# Hospital Automation Portal - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Start the System

```bash
# Make sure you're in the project directory
cd c:\Users\malih\Tech-Champions-HackNovate-2025

# Start the Next.js server (should already be running)
npm run dev
```

**Expected Output:**
```
ready - started server on 0.0.0.0:3001
```

### Step 2: Access the Portal

Open your browser and navigate to:
```
http://localhost:3001/hospital-portal
```

You'll see three role options:
- 🩺 **Doctor** - Manage patients and write prescriptions
- 👤 **Patient** - Check-in and track your hospital visit
- 💊 **Pharmacy** - Process prescriptions and dispense medications

---

## 📋 Complete Test Workflow (10 Minutes)

### Test Scenario: "John Doe visits the hospital"

#### 1️⃣ Patient Checks In

**Action:**
1. Click on **"Patient"** card
2. Fill in the check-in form:
   - **Name:** John Doe
   - **Reason:** Fever and headache for 2 days, feeling weak
   - Leave "Emergency" unchecked
3. Click **"Check-In Now"**

**Expected Result:**
- Success message appears
- Journey tracker shows "Registration" as completed
- Status shows "Waiting in Queue"
- Queue position displays (e.g., #1, #2, etc.)

**Screenshot Reference:**
```
┌────────────────────────────────────┐
│ Patient Portal                     │
├────────────────────────────────────┤
│ Current Status: [Waiting in Queue] │
│ Queue Position: #1                 │
│ Wait Time: 2 min                   │
│ Priority: [Normal]                 │
├────────────────────────────────────┤
│ Journey Tracker:                   │
│ ✓ Registration                     │
│ ○ Triage Assessment                │
│ ○ Doctor Consultation              │
│ ○ Lab Tests                        │
│ ○ Pharmacy                         │
│ ○ Billing & Checkout               │
└────────────────────────────────────┘
```

#### 2️⃣ System Processes Patient (Automated)

**Behind the Scenes (you'll see these updates):**

1. **Reception Agent** receives check-in → assigns urgency
2. **Triage Agent** performs assessment → determines specialty needed
3. **Scheduling Agent** assigns available doctor → allocates room

**Patient Interface Updates:**
- Journey tracker progresses automatically
- Status changes to "In Triage" → "Assigned to Doctor"
- Doctor name and room number appear

**Time:** ~30 seconds (agents process automatically)

#### 3️⃣ Doctor Sees Patient

**Action:**
1. Open a **new browser tab** (same URL)
2. Select **"Doctor"** role
3. In the doctor name field, enter: **Dr. Smith** (or any name)
4. You should see John Doe in your patient queue

**Expected Result:**
```
┌────────────────────────────────────┐
│ Doctor Portal - Dr. Smith          │
├────────────────────────────────────┤
│ My Patients (1)                    │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ John Doe                       │ │
│ │ Fever and headache for 2 days  │ │
│ │ Room: R-CONS-003               │ │
│ │ Status: [Waiting]              │ │
│ │ [View Details]                 │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

#### 4️⃣ Doctor Reviews and Prescribes

**Action:**
1. Click **"View Details"** on John Doe
2. Review the tabs:
   - **Details:** See patient info, chief complaint
   - **Lab Results:** (may be empty if no tests ordered)
   - **Prescription:** Write prescription here

3. Click on **"Prescription"** tab
4. Add medications:
   - Click **"Add Medication"**
   - **Name:** Amoxicillin
   - **Dosage:** 500mg
   - **Frequency:** 3 times daily
   - **Duration:** 7 days
   - **Instructions:** Take with food

5. Add another medication:
   - **Name:** Ibuprofen
   - **Dosage:** 400mg
   - **Frequency:** Every 6 hours as needed
   - **Duration:** 5 days
   - **Instructions:** Take after meals

6. Add diagnosis:
   - **Diagnosis:** Upper respiratory tract infection
   - **Notes:** Rest advised. Return if symptoms worsen.

7. Click **"Submit Prescription"**

**Expected Result:**
- Success message: "Prescription submitted to pharmacy"
- Prescription auto-forwards to pharmacy system

#### 5️⃣ Pharmacy Receives Order

**Action:**
1. Open **another new browser tab**
2. Select **"Pharmacy"** role
3. You should see John Doe's prescription order in "Pending Orders"

**Expected Result:**
```
┌────────────────────────────────────┐
│ Pharmacy Portal                    │
├────────────────────────────────────┤
│ Pending Orders (1)                 │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ John Doe                       │ │
│ │ Appointment: APT001            │ │
│ │ [Pending]                      │ │
│ │                                │ │
│ │ Medications:                   │ │
│ │ • Amoxicillin 500mg            │ │
│ │   3x daily - 7 days - $12.99   │ │
│ │ • Ibuprofen 400mg              │ │
│ │   Every 6h - 5 days - $8.99    │ │
│ │                                │ │
│ │ Total: $21.98                  │ │
│ │                                │ │
│ │ [Generate Bill] [Review & Dispense] │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

#### 6️⃣ Pharmacy Processes Order

**Action:**
1. Click **"Generate Bill"** button
   - Wait for confirmation
2. Click **"Review & Dispense"** button
   - Review medications in modal
   - Check for any drug interaction warnings
3. Click **"Confirm Dispense"**

**Expected Result:**
- Order moves to "Completed Orders"
- Inventory updated automatically
- Patient notified (visible in patient interface)

#### 7️⃣ Patient Completes Visit

**Action:**
1. Switch back to **Patient tab**
2. Check the updates:

**Expected Result:**
```
┌────────────────────────────────────┐
│ Patient Portal                     │
├────────────────────────────────────┤
│ Current Status: [Completed]        │
│                                    │
│ Journey Tracker:                   │
│ ✓ Registration                     │
│ ✓ Triage Assessment                │
│ ✓ Doctor Consultation              │
│ ○ Lab Tests (Not required)         │
│ ✓ Pharmacy                         │
│ ✓ Billing & Checkout               │
│                                    │
│ [View Prescription] [View Bill]    │
└────────────────────────────────────┘
```

---

## 🔄 Real-Time Updates

All interfaces update automatically every 5-10 seconds:

- **Patient Interface:** Journey tracker updates as agents process
- **Doctor Interface:** New patients appear in queue automatically
- **Pharmacy Interface:** Prescriptions arrive as doctors submit them

**No page refresh needed!** Just wait and watch the magic happen. ✨

---

## 🧪 Testing Multiple Patients

Want to test with more patients? Here's how:

1. **Open Patient Interface** in an incognito/private window
2. **Check in a new patient:**
   - Name: Sarah Johnson
   - Reason: Persistent cough and chest pain
   - Check "Emergency" box ✓ (to see priority handling)
3. **Watch the difference:**
   - Emergency patients get higher priority
   - They'll appear at the top of doctor's queue
   - Faster processing through triage

---

## 💡 Pro Tips

### Tip 1: Multiple Browser Windows
Open three windows side-by-side to see real-time coordination:
```
┌─────────────┬─────────────┬─────────────┐
│   Patient   │   Doctor    │  Pharmacy   │
│  Interface  │  Interface  │  Interface  │
└─────────────┴─────────────┴─────────────┘
```

### Tip 2: Check the Dashboard
Open the main dashboard to see agent activity:
```
http://localhost:3001/hospital-automation/dashboard
```

### Tip 3: Browser Console
Open developer tools (F12) to see message bus activity:
- All agent communications logged
- Real-time message flow visible
- Debug any issues

### Tip 4: Role Switching
Click the role badge in the top-right corner to switch between roles without opening new tabs.

---

## 🐛 Common Issues

### Issue: "No patients found"
**Solution:**
1. Make sure you checked in as a patient first
2. Wait 10-20 seconds for agents to process
3. Check the dashboard to verify agents are running
4. Refresh the doctor interface

### Issue: "Prescription not appearing"
**Solution:**
1. Verify you clicked "Submit Prescription" (not just "Save Draft")
2. Check browser console for errors
3. Wait 5-10 seconds for polling to fetch updates
4. Refresh pharmacy interface

### Issue: "Status not updating"
**Solution:**
1. Interfaces poll every 5-10 seconds
2. Be patient, updates are automatic
3. Check network tab - API calls should be happening
4. If still stuck, check the dashboard

---

## 📊 What to Observe

### Multi-Agent Coordination
Watch how agents work together:
1. Reception Agent: Receives patient → assesses urgency
2. Triage Agent: Performs medical triage → orders tests
3. Scheduling Agent: Assigns doctor → allocates room
4. Doctor: Reviews → writes prescription
5. Pharmacy Agent: Processes → checks interactions
6. Billing Agent: Calculates → generates invoice

### Real-Time Data Flow
All interfaces show live updates:
- Patient sees journey progress
- Doctor sees new patients arrive
- Pharmacy sees prescriptions come in
- Inventory updates automatically
- Bills generate on the fly

---

## 🎯 Success Criteria

You've successfully completed the test when:

- ✅ Patient checked in successfully
- ✅ Patient assigned to doctor with room number
- ✅ Doctor can see and select patient
- ✅ Doctor submitted prescription with multiple medications
- ✅ Pharmacy received prescription order
- ✅ Pharmacy generated bill
- ✅ Pharmacy dispensed medication
- ✅ Patient shows "Completed" status
- ✅ All interfaces updated in real-time

---

## 🚀 Next Steps

After completing the basic workflow:

1. **Test Emergency Scenario:**
   - Check in a patient with "Emergency" checked
   - Watch priority handling (moves to front of queue)

2. **Test Lab Tests:**
   - Manually trigger lab tests via API or dashboard
   - Watch results appear in doctor and patient interfaces

3. **Test Inventory Alerts:**
   - Check pharmacy inventory tab
   - See low stock warnings

4. **Test Multiple Doctors:**
   - Open multiple doctor tabs with different names
   - See how patients distribute among doctors

---

## 📞 Need Help?

If something doesn't work:

1. **Check Terminal:** Look for server errors
2. **Check Browser Console:** Press F12, look at console tab
3. **Check Dashboard:** Visit `/hospital-automation/dashboard`
4. **Restart Server:** Stop (Ctrl+C) and run `npm run dev` again

---

**Enjoy your AI-powered hospital! 🏥✨**
