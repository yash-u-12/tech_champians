import { NextResponse } from "next/server";
import { queryPinecone } from "@/lib/pinecone";
import { getEmbedding } from "@/lib/embeddings";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_PRIMARY = process.env.HOSPITAL_AI_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_MODEL_FALLBACK = process.env.GEMINI_MODEL_FALLBACK || "gemini-1.5-flash-8b";

// Lazily construct models so we can swap on failure
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const getModel = (name) => genAI.getGenerativeModel({ model: name });

// Simple in-memory cache to reduce duplicate calls briefly
const responseCache = new Map(); // key -> { text, expiresAt }
const CACHE_TTL_MS = 2 * 60 * 1000;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function generateWithRetry(prompt, { maxRetries = 3 } = {}) {
  const now = Date.now();
  const cached = responseCache.get(prompt);
  if (cached && cached.expiresAt > now) {
    return { text: cached.text, modelUsed: cached.modelUsed, cached: true };
  }

  let lastErr;
  let modelName = GEMINI_MODEL_PRIMARY;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() || "";
      responseCache.set(prompt, {
        text,
        modelUsed: modelName,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return { text, modelUsed: modelName, cached: false };
    } catch (err) {
      lastErr = err;
      const message = String(err?.message || err);
      const status = err?.status || err?.response?.status;

      // On first failure, try fallback model once
      if (attempt === 0 && GEMINI_MODEL_FALLBACK && GEMINI_MODEL_FALLBACK !== modelName) {
        modelName = GEMINI_MODEL_FALLBACK;
        continue;
      }

      // Handle 429 with exponential backoff
      if (status === 429 || /429|Too Many Requests|quota|Resource exhausted/i.test(errMessage)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.floor(Math.random() * 200);
        if (attempt < maxRetries) {
          await sleep(delay);
          continue;
        }
      }

      // Non-retryable or retries exhausted
      break;
    }
  }

  throw lastErr;
}

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, chatId, messageHistory } = await req.json();
    const formattedHistory = messageHistory
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    if (!message) {
      return NextResponse.json(
        { error: "Missing `Message` in Body" },
        { status: 400 }
      );
    }

    let user = null;
    try {
      user = await db.user.findUnique({ where: { clerkUserId: userId } });
    } catch (e) {
      user = null;
    }

    const prompt = `You are a smart, compassionate medical assistant.
    Your priority is to provide clear, actionable help immediately, then ask at most one follow-up question.
    Base your guidance ONLY on the provided Context, User Details, and Conversation History. If information is missing, give safe, general advice and state assumptions briefly.

    Response Policy (keep it concise and practical):
    1) Summary: One line paraphrase of the user's concern.
    2) Likely causes: 2–3 possibilities based on context/history (say "possible" if uncertain).
    3) What you can do now: 3–5 specific, safe steps (home care, OTC options with generic names; say "follow label" for dosing; avoid prescribing). Include lifestyle tips when relevant. For mild conditions, emphasize self-care and reassurance.
    4) When to see a doctor: List specific warning signs that would require medical attention (not just general advice). Be specific - only mention this if symptoms worsen significantly or persist beyond expected timeframe.
    5) One follow-up question: Ask only one focused question at the end to refine advice (optional - omit if advice is comprehensive).

    Constraints:
    - For MILD conditions (mild headache, minor cold, slight indigestion, mild fatigue): Focus on reassurance and self-care. Do NOT suggest seeing a doctor unless symptoms worsen or persist beyond 5-7 days.
    - Avoid excessive questioning. Do not ask multiple questions in a row.
    - Be friendly and plain-language. Keep total length to ~6–10 sentences.
    - Include a brief disclaimer that this is not a diagnosis and doesn't replace a doctor.
    - Format using Markdown with bold section titles and bullet points. Put each item on its own line. Do not use code blocks.

    Machine Output Requirement:
    - Append a final line exactly as: HUMAN_NEEDED: yes|no|urgent
    - Set to "no" for mild, self-limiting conditions that can be managed at home (e.g., mild headache, minor cold, mild indigestion, mild muscle soreness, mild seasonal allergies).
    - Set to "yes" ONLY when medical intervention is truly needed: severe pain not responding to OTC meds, symptoms lasting more than 7 days without improvement, fever >102°F (39°C) persisting >3 days, significant breathing difficulty, chest pain, severe abdominal pain, signs of infection requiring antibiotics, chronic disease complications, pregnancy complications, or when physical examination/tests are clearly necessary.
    - Set to "urgent" only for immediate/life-threatening emergencies: sudden severe headache (worst ever), chest pain with shortness of breath, stroke symptoms (facial drooping, arm weakness, speech difficulty), severe bleeding, difficulty breathing, loss of consciousness, seizures, severe allergic reaction.
    
    User:
    ${message}
    
    Assistant:`;

    let answer = "";
    try {
      const { text } = await generateWithRetry(prompt, { maxRetries: 3 });
      answer = text;
    } catch (aiErr) {
      const errMessage = String(aiErr?.message || aiErr);
      const status = aiErr?.status || aiErr?.response?.status;

      // Friendly degradation on 429/quota issues
      if (status === 429 || /429|Too Many Requests|quota|Resource exhausted/i.test(errMessage)) {
        return NextResponse.json(
          {
            answer:
              "We're hitting AI usage limits right now. Please wait a moment and try again.",
            rateLimited: true,
          },
          { status: 200 }
        );
      }

      // Other AI errors: provide a safe fallback based on the ACTUAL user input
      // Use the 'message' variable from line 81 (the original user input)
      const userMsgLower = (message || "").toLowerCase();
      
      // Check for true red-flag symptoms requiring urgent care
      const redFlag = /sudden.*severe.*headache|worst.*headache.*life|confusion.*headache|weakness|numbness|trouble\s+speaking|vision\s+loss|stiff\s+neck|chest.*pain|difficulty.*breathing|severe.*bleeding|unconscious|seizure|stroke|heart.*attack/.test(userMsgLower);

      let fallbackAnswer = "";
      let needsHumanFallback = false;
      let urgencyLevel = "no";

      if (redFlag) {
        // True emergency symptoms detected
        fallbackAnswer = `**Summary:** Your symptoms suggest a potentially serious medical emergency.

**Immediate Action Required:**
- Do not drive yourself; call emergency services or have someone take you to the ER immediately.
- If experiencing chest pain, difficulty breathing, sudden severe headache, or stroke symptoms: **Call emergency services now**.

**Red flag symptoms include:**
- Sudden "worst-ever" headache, confusion, stiff neck, high fever
- Chest pain, difficulty breathing, or pressure in chest
- New weakness, numbness, seizures, vision or speech changes
- Severe bleeding or loss of consciousness

This guidance is not a diagnosis. Get immediate medical evaluation.`;
        needsHumanFallback = true;
        urgencyLevel = "urgent";
      } else {
        // No red flags - provide general self-care advice
        fallbackAnswer = `I apologize, but I'm having trouble processing your request right now due to a technical issue. 

For your health concern, here's general guidance:
- If symptoms are mild and manageable, try rest, hydration, and over-the-counter remedies as appropriate
- Monitor your symptoms - if they worsen or persist beyond a few days, consider seeing a doctor
- If you develop severe symptoms, chest pain, difficulty breathing, or other concerning signs, seek immediate medical care

Would you like to schedule an appointment with a healthcare provider to discuss your concerns?`;
        needsHumanFallback = false;
        urgencyLevel = "no";
      }

      return NextResponse.json(
        {
          answer: fallbackAnswer,
          aiError: true,
          needsHuman: needsHumanFallback,
          urgency: urgencyLevel,
        },
        { status: 200 }
      );
    }


    // Extract machine-readable HUMAN_NEEDED flag and clean answer
    let needsHuman = false;
    let urgency = "no";
    if (answer) {
      const m = answer.match(/HUMAN_NEEDED:\s*(yes|no|urgent)/i);
      if (m) {
        urgency = m[1].toLowerCase();
        needsHuman = urgency === "yes" || urgency === "urgent";
        answer = answer.replace(/^.*HUMAN_NEEDED:.*$/mi, "").trim();
      }
    }

    // If DB is unavailable, return answer without persistence
    try {
      if (!user) {
        return NextResponse.json({
          answer: answer?.trim() || "No Answer Returned from Gemini.",
          needsHuman,
          urgency,
        });
      }

      let chat;
      if (chatId) {
        chat = await db.chat.findUnique({
          where: { id: chatId, userId: user.id },
        });

        if (!chat) {
          return NextResponse.json(
            { error: "Chat Not Found" },
            { status: 404 }
          );
        }

        await db.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });
      } else {
        const title =
          message.length > 30 ? `${message.substring(0, 30)}...` : message;
        chat = await db.chat.create({
          data: {
            userId: user.id,
            title: title,
          },
        });

        await db.message.create({
          data: {
            chatId: chat.id,
            role: "ASSISTANT",
            content:
              "Hello! I'm your MedSync AI Assistant. How Can I Help You With Your Medical Questions Today?",
          },
        });
      }

      await db.message.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: message,
        },
      });

      await db.message.create({
        data: {
          chatId: chat.id,
          role: "ASSISTANT",
          content: answer?.trim() || "No Answer Returned from Gemini.",
        },
      });

      return NextResponse.json({
        answer: answer?.trim() || "No Answer Returned from Gemini.",
        chatId: chat.id,
        needsHuman,
        urgency,
      });
    } catch (pErr) {
      // Persistence failed; still return an answer for demo continuity
      return NextResponse.json({
        answer: answer?.trim() || "No Answer Returned from Gemini.",
        needsHuman,
        urgency,
      });
    }
  } catch (err) {
    console.error("API /api/chat Error:", err);
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 500 }
    );
  }
}
