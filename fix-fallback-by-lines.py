#!/usr/bin/env python3
"""Fix chat route by line-based replacement"""

filepath = r"c:\Users\thati\Desktop\mcet hack\tech_champians\app\api\chat\route.js"

# Read all lines
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with "const fallbackAnswer" and replace everything until the closing brace of the catch block
# Looking for line ~202

new_code = '''      let fallbackAnswer = "";
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
'''

# Find start and end lines
start_line = None
end_line = None

for i, line in enumerate(lines):
    if 'const fallbackAnswer = `**Summary:**' in line:
        start_line = i
    if start_line is not None and i > start_line and '      );' in line and '    }' in lines[i+1] if i+1 < len(lines) else False:
        end_line = i + 1  # Include the closing brace
        break

if start_line is not None and end_line is not None:
    print(f"Found fallback code from line {start_line+1} to {end_line+1}")
    # Replace lines
    new_lines = lines[:start_line] + [new_code + '\n'] + lines[end_line+1:]
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("✅ Successfully replaced fallback logic")
    print(f"  - Removed {end_line - start_line + 1} lines")
    print(f"  - Added conditional logic based on actual user message")
    print(f"  - Mild symptoms now get self-care advice (no escalation)")
    print(f"  - Emergency symptoms still escalate appropriately")
else:
    print(f"❌ Could not find fallback code section")
    print(f"  start_line: {start_line}")
    print(f"  end_line: {end_line}")
