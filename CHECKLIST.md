# 🎯 Hackathon Setup Checklist

## Step 1: Get API Keys ⏱️ 10 minutes

### Database (Neon.tech)
- [ ] Go to https://neon.tech
- [ ] Sign up (free account)
- [ ] Create project named "medsync_ai"
- [ ] Copy connection string
- [ ] Paste in `.env.local` → `DATABASE_URL`
- [ ] **Test**: Connection string should look like:
  ```
  postgresql://user:pass@ep-xxx-xxx.neon.tech/medsync_ai?sslmode=require
  ```

### Google Gemini AI
- [ ] Go to https://makersuite.google.com/app/apikey
- [ ] Sign in with Google account
- [ ] Click "Create API Key"
- [ ] Copy the API key
- [ ] Paste in `.env.local` → `GEMINI_API_KEY`
- [ ] Paste SAME KEY in `hospital-automation/.env.local` → `GEMINI_API_KEY`
- [ ] **Test**: Key should start with `AIzaSy...`

### Pinecone Vector Database
- [ ] Go to https://www.pinecone.io
- [ ] Sign up for free starter plan
- [ ] Create new index with:
  - [ ] Name: `medical-chatbot`
  - [ ] Dimensions: `384`
  - [ ] Metric: `cosine`
- [ ] Wait 1-2 minutes for index to initialize
- [ ] Copy API key from dashboard
- [ ] Paste in `.env.local` → `PINECONE_API_KEY`
- [ ] **Test**: Key should look like `pcsk_xxx...` or similar

---

## Step 2: Setup Database ⏱️ 3 minutes

Run these commands in terminal:

```bash
# Generate Prisma client
npx prisma generate
```
- [ ] Command completed without errors

```bash
# Run database migrations
npx prisma migrate dev
```
- [ ] Migrations applied successfully
- [ ] Database schema created

**Optional - Verify database:**
```bash
npx prisma studio
```
- [ ] Opens in browser at http://localhost:5555
- [ ] Can see User, Appointment, etc. tables

---

## Step 3: Start Servers ⏱️ 2 minutes

### Terminal 1 - Main Application

```bash
npm run dev
```

**Verify:**
- [ ] Server starts without errors
- [ ] Shows: `ready - started server on 0.0.0.0:3000`
- [ ] Can access http://localhost:3000
- [ ] Landing page loads correctly

### Terminal 2 - Hospital Automation

```bash
cd hospital-automation
npm start
```

**Verify:**
- [ ] Server starts without errors
- [ ] Shows: Hospital automation system running
- [ ] Can access http://localhost:3001/hospital-portal
- [ ] Portal shows three role cards (Patient, Doctor, Pharmacy)

---

## Step 4: Test Core Features ⏱️ 5 minutes

### Test AI Chat
- [ ] Go to http://localhost:3000/ai-assistant
- [ ] Type a message: "I have fever and headache"
- [ ] AI responds with questions or suggestions
- [ ] No errors in browser console (F12)

### Test Hospital Check-in
- [ ] Go to http://localhost:3001/hospital-portal
- [ ] Click "Patient" role card
- [ ] Fill form:
  - [ ] Name: Test Patient
  - [ ] Symptoms: Fever and cough
- [ ] Click "Check-In Now"
- [ ] Success message appears
- [ ] Journey tracker shows "Registration" completed
- [ ] Queue position displays

### Test Doctor Interface
- [ ] Open NEW tab: http://localhost:3001/hospital-portal
- [ ] Click "Doctor" role card
- [ ] Enter doctor name: Dr. Test
- [ ] Patient "Test Patient" appears in queue
- [ ] Can click to view patient details

### Test Prescription Flow
- [ ] In doctor interface, click patient
- [ ] Go to "Prescription" tab
- [ ] Add medication:
  - [ ] Name: Test Medicine
  - [ ] Dosage: 500mg
  - [ ] Frequency: 2 times daily
  - [ ] Duration: 5 days
- [ ] Click "Submit Prescription"
- [ ] Success message appears

### Test Pharmacy Interface
- [ ] Open NEW tab: http://localhost:3001/hospital-portal
- [ ] Click "Pharmacy" role card
- [ ] Prescription for "Test Patient" appears
- [ ] Can click "Generate Bill"
- [ ] Can click "Review & Dispense"

---

## Step 5: Demo Preparation ⏱️ 5 minutes

### Browser Setup
- [ ] Open 3 browser windows (or use split screen)
- [ ] Window 1: Patient interface
- [ ] Window 2: Doctor interface
- [ ] Window 3: Pharmacy interface
- [ ] Arrange side-by-side for live demo

### Optional: Seed Test Data
Using Prisma Studio (http://localhost:5555):
- [ ] Create 2-3 test doctors with different specialties
- [ ] Create test patient with medical history
- [ ] Add 1000 credits to test patient

### Demo Script Ready
- [ ] Reviewed demo flow in READY_TO_RUN.md
- [ ] Prepared test scenarios
- [ ] Know which features to highlight
- [ ] Practiced the flow once

---

## ✅ Final Pre-Demo Checklist

### Environment
- [ ] Both servers running (3000 and 3001)
- [ ] No errors in either terminal
- [ ] All 3 API keys configured correctly
- [ ] Database connected and migrated

### Functionality
- [ ] AI chat responds to messages
- [ ] Patient can check in
- [ ] Doctor sees patients in queue
- [ ] Prescriptions flow to pharmacy
- [ ] Real-time updates working

### Demo Ready
- [ ] 3 browser windows prepared
- [ ] Test patient checked in
- [ ] Doctor interface shows patient
- [ ] Pharmacy ready to receive prescriptions
- [ ] Backup plan if something fails

### Presentation
- [ ] Can explain AI triage flow
- [ ] Can explain 10-agent system
- [ ] Can show real-time coordination
- [ ] Can demonstrate complete patient journey
- [ ] Know your unique selling points

---

## 🚨 If Something's Not Working

### Priority Fixes (Do these first)
1. [ ] Check both terminals for error messages
2. [ ] Open browser console (F12) and check for errors
3. [ ] Verify all API keys are pasted correctly (no extra spaces)
4. [ ] Restart both servers
5. [ ] Clear browser cache and cookies

### Still Having Issues?
- [ ] Read SETUP.md for detailed troubleshooting
- [ ] Check API_KEYS_NEEDED.md for key requirements
- [ ] Verify Pinecone index exists and is active
- [ ] Test database connection with Prisma Studio
- [ ] Check that ports 3000 and 3001 aren't blocked

---

## 🎉 You're Ready When...

- ✅ All checkboxes above are checked
- ✅ Both servers running smoothly
- ✅ Can complete full patient journey
- ✅ All interfaces update in real-time
- ✅ Confident in your demo flow

**GOOD LUCK WITH YOUR HACKATHON! 🚀**

---

**Current Status:**
- Project analyzed: ✅
- Documentation created: ✅
- Dependencies installed: ✅
- Environment files ready: ✅
- **Waiting for**: Your API keys and database setup
- **Time to completion**: 15-20 minutes with your keys
