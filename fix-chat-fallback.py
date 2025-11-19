import re

# Read the file
with open(r'app\api\chat\route.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old fallback logic (from "// Other AI errors" to the return statement)
old_section = '''      // Other AI errors: provide a safe, structured fallback and escalate if red flags
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

# Define the new fallback logic
new_section = '''      // Other AI errors: Check user's message for red flags
      const userMsgLower = message.toLowerCase(); // user's original input
      const hasRedFlags = /severe|worst.*ever|sudden.*intense|chest.*pain|can't.*breath|difficulty.*breathing|confusion|disoriented|loss.*consciousness|bleeding.*heavily|seizure|stroke|heart.*attack|suicidal|emergency/i.test(userMsgLower);

      if (hasRedFlags) {
        const fallbackAnswer = `I'm having trouble processing your request right now, but based on the severity of your symptoms, I recommend seeking immediate medical attention.

**What you should do:**
- If experiencing severe chest pain, difficulty breathing, sudden severe headache, confusion, or other life-threatening symptoms: call emergency services immediately
- For urgent but non-life-threatening concerns: go to urgent care or emergency room
- Keep track of your symptoms and when they started

This is not a diagnosis. Please seek immediate medical care for severe symptoms.`;

        return NextResponse.json(
          {
            answer: fallbackAnswer,
            aiError: true,
            needsHuman: true,
            urgency: "urgent",
          },
          { status: 200 }
        );
      } else {
        const fallbackAnswer = `I'm having trouble processing your request right now. Here's some general guidance:

**For mild symptoms:**
- Rest and stay hydrated
- Over-the-counter medications may help (follow package directions)
- Monitor your symptoms

**When to see a doctor:**
- Symptoms worsen or don't improve after a few days
- You develop new concerning symptoms
- You have questions about your specific situation

This is not a diagnosis and doesn't replace professional medical advice. Please try your question again, or if symptoms are severe, consult a healthcare provider.`;

        return NextResponse.json(
          {
            answer: fallbackAnswer,
            aiError: true,
            needsHuman: false,
            urgency: "no",
          },
          { status: 200 }
        );
      }'''

# Replace
content = content.replace(old_section, new_section)

# Write back
with open(r'app\api\chat\route.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
