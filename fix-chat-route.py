#!/usr/bin/env python3
"""Fix the variable shadowing and fallback logic in chat route"""

filepath = r"c:\Users\thati\Desktop\mcet hack\tech_champians\app\api\chat\route.js"

# Read the entire file
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Rename shadowing variable on line 180
content = content.replace(
    '    } catch (aiErr) {\n      const message = String(aiErr?.message || aiErr);',
    '    } catch (aiErr) {\n      const errMessage = String(aiErr?.message || aiErr);'
)

# Fix 2: Update reference to renamed variable on line 184
content = content.replace(
    '      if (status === 429 || /429|Too Many Requests|quota|Resource exhausted/i.test(message)) {',
    '      if (status === 429 || /429|Too Many Requests|quota|Resource exhausted/i.test(errMessage)) {'
)

# Fix 3: Replace the entire messy fallback section with clean logic that uses the ORIGINAL user message
old_fallback = '''      // Other AI errors: provide a safe, structured fallback and escalate if red flags
      const textLower = (message || "").toString().toLowerCase();
      const userText = (typeof message === "string" ? message : "") || "";
      const qLower = (typeof req !== "undefined" ? "" : "");
      const userMsg = (await req.json?.().catch?.(() => null))?.message || undefined; // not reliable here

      // Use the original input captured earlier in scope
      const inputLower = (typeof prompt !== "undefined" ? "" : "");

      const mLower = (typeof userMsg === 'string' && userMsg) ? userMsg.toLowerCase() : (typeof req._cachedUserMessage === 'string' ? req._cachedUserMessage.toLowerCase() : "");
      const redFlag = /sudden\\s+severe\\s+headache|confusion|weakness|numbness|trouble\\s+speaking|vision\\s+loss|stiff\\s+neck|high\\s+fever|head\\s+injury|pregnan|immunocompromised/.test(mLower);

      const fallbackAnswer = `**Summary:** Severe headache with confusion can be a medical emergency.

**Likely causes (possible):**
- Severe migraine or cluster headache
- Infection (e.g., meningitis) or bleeding in the brain
- Stroke warning signs if paired with weakness, numbness, or speech/vision changes

**What you can do now:**
- Do not drive; arrange immediate medical evaluation.
- If new neurological signs (weakness, numbness, trouble speaking, vision loss) or worst headache of life: call emergency services.
- Avoid painkillers that thin blood (e.g., aspirin) until evaluated.
- If available, note onset time and associated symptoms to tell clinicians.

**Red flags (seek urgent care):**
- Sudden "worst-ever" headache, confusion, stiff neck, high fever
- New weakness, numbness, seizures, vision or speech changes
- Headache after head injury, or if pregnant/immunocompromised

This guidance is not a diagnosis and doesn't replace a doctor.`;

      return NextResponse.json(
        {
          answer: fallbackAnswer,
          aiError: true,
          needsHuman: true,
          urgency: "urgent",
        },
        { status: 200 }
      );'''

new_fallback = '''      // Other AI errors: provide a safe fallback based on the ACTUAL user input
      // Use the 'message' variable from line 81 (the original user input)
      const userMsgLower = (message || "").toLowerCase();
      
      // Check for true red-flag symptoms requiring urgent care
      const redFlag = /sudden.*severe.*headache|worst.*headache.*life|confusion.*headache|weakness|numbness|trouble\\s+speaking|vision\\s+loss|stiff\\s+neck|chest.*pain|difficulty.*breathing|severe.*bleeding|unconscious|seizure|stroke|heart.*attack/.test(userMsgLower);

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
      );'''

# Apply the fallback replacement
content = content.replace(old_fallback, new_fallback)

# Write the fixed content back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed chat route:")
print("  - Renamed 'message' to 'errMessage' on line 180 (no more shadowing)")
print("  - Updated reference on line 184")
print("  - Replaced hardcoded fallback with user-aware logic")
print("  - Now checks ORIGINAL user message for red flags")
print("  - Mild symptoms get self-care advice, no escalation")
