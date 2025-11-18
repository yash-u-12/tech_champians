# Quick Setup Guide for Hackathon

## 🚀 Priority Setup (Get Running in 15 Minutes)

### Step 1: Install Dependencies (Already Done ✓)
```bash
npm install
```

### Step 2: Configure Critical Environment Variables

Edit `.env.local` file and add these **REQUIRED** keys:

#### 1. **Database (PostgreSQL)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/medsync_ai"
```

**Options:**
- **Local PostgreSQL**: Install PostgreSQL and create database
- **Quick Cloud Option (Recommended)**: Use [Neon.tech](https://neon.tech) (Free tier, instant setup)
  1. Sign up at https://neon.tech
  2. Create project "medsync_ai"
  3. Copy connection string
  4. Paste in DATABASE_URL

#### 2. **Google Gemini API** (For AI Chat Assistant)
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

**Get API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy and paste in .env.local

#### 3. **Pinecone** (For Medical Knowledge Base)
```env
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX="medical-chatbot"
```

**Get API Key:**
1. Sign up at https://www.pinecone.io
2. Create a new index named "medical-chatbot"
   - Dimensions: 384 (for sentence-transformers/all-MiniLM-L6-v2)
   - Metric: cosine
3. Copy API key from dashboard
4. Paste in .env.local

### Step 3: Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio to verify (optional)
npx prisma studio
```

### Step 4: Start Main Application
```bash
npm run dev
```

Server will run on: http://localhost:3000

### Step 5: Setup Hospital Automation (Optional but Recommended)

```bash
# Navigate to hospital automation
cd hospital-automation

# Edit .env.local (add Gemini API key)
# (Use same GEMINI_API_KEY from main app)
notepad .env.local

# Start hospital automation system
npm start
```

Server will run on: http://localhost:3001

---

## 🎯 What Works Without Optional Keys

### ✅ With Only Database + Gemini + Pinecone:
- AI Triage Chat (symptom analysis)
- Hospital Visit Workflow (full agent coordination)
- Doctor-Patient-Pharmacy interfaces
- Prescription management
- Real-time status tracking

### ❌ What Needs Optional Keys:
- **Video Consultations**: Needs Vonage API keys
- **Credit Purchase**: Needs Stripe keys
- **User Authentication**: Needs Clerk keys (currently disabled)

---

## 📋 Testing the System

### Test 1: AI Chat (Verify Gemini + Pinecone)
1. Go to http://localhost:3000
2. Navigate to AI Assistant
3. Type: "I have a headache and fever"
4. AI should respond with questions and suggestions

### Test 2: Hospital Visit Workflow
1. Go to http://localhost:3001/hospital-portal
2. Click "Patient" role
3. Fill check-in form:
   - Name: John Doe
   - Symptoms: "Fever and cough"
4. Click "Check-In"
5. Open new tab → http://localhost:3001/hospital-portal
6. Click "Doctor" role
7. Enter doctor name: Dr. Smith
8. You should see John Doe in patient queue
9. Write prescription
10. Open new tab → Click "Pharmacy" role
11. See prescription, generate bill, dispense

---

## 🔧 Troubleshooting

### Database Connection Error
**Error**: "Can't reach database server"
**Fix**: 
- Check DATABASE_URL is correct
- Make sure PostgreSQL is running (or Neon connection string is valid)
- Run `npx prisma migrate dev` again

### Gemini API Error
**Error**: "API key not valid"
**Fix**:
- Verify GEMINI_API_KEY is set in .env.local
- Check for spaces or quotes in the key
- Regenerate key from Google AI Studio

### Pinecone Error
**Error**: "Index not found"
**Fix**:
- Create index named "medical-chatbot" in Pinecone dashboard
- Set dimensions to 384
- Set metric to cosine
- Wait 1-2 minutes for index to initialize

### Port Already in Use
**Error**: "Port 3000 is already in use"
**Fix**:
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID with actual ID)
taskkill /PID <PID> /F
```

### Hospital Automation Not Starting
**Fix**:
1. Check you're in hospital-automation directory
2. Verify GEMINI_API_KEY in hospital-automation/.env.local
3. Run `npm install` in that directory if needed

---

## 🎪 Demo Flow for Hackathon

### Scenario: Complete Patient Journey

**Part 1: AI Triage (Show AI Decision Making)**
1. Patient describes symptoms to AI
2. AI asks clarifying questions
3. AI recommends "Hospital Visit" for moderate issue

**Part 2: Hospital Visit (Show Agent Coordination)**
1. Patient checks in on mobile
2. Reception Agent receives → Triage Agent assesses
3. Scheduling Agent assigns Dr. Smith
4. Doctor sees patient in queue with AI notes
5. Doctor examines, writes prescription
6. Prescription auto-appears in pharmacy queue

**Part 3: Pharmacy & Checkout (Show Real-time Updates)**
1. Pharmacist sees prescription on mobile
2. Generates itemized bill
3. Patient sees "Ready for pickup" notification
4. Patient views prescription in profile

**Part 4: Show Patient Profile**
- Complete medical history
- All prescriptions saved
- Journey timeline visible

---

## 🚨 Known Issues & Workarounds

### Issue: Clerk Authentication Errors
**Status**: Authentication currently disabled in middleware.js
**Workaround**: System works without auth for demo purposes
**Fix**: Add valid Clerk keys when needed for production

### Issue: Video Calls Not Working
**Status**: Requires Vonage API setup
**Workaround**: Focus on hospital visit workflow for demo
**Fix**: Sign up for Vonage account and add keys

### Issue: Stripe Payment Errors
**Status**: Requires Stripe account
**Workaround**: Skip credit purchase, directly set credits in database
**Fix**: Use Prisma Studio to manually add credits to user accounts

---

## 💡 Quick Wins for Demo

1. **Use Incognito Windows**: Open 3 windows side-by-side (Patient, Doctor, Pharmacy) to show real-time coordination

2. **Seed Test Data**: Use Prisma Studio to pre-create:
   - A few doctors with specialties
   - A patient with medical history
   - Some credits for the patient

3. **Prepare Test Scenarios**:
   - Emergency case (checkbox checked)
   - Normal consultation
   - Multiple medications in prescription

4. **Show Agent Dashboard**: http://localhost:3001/hospital-automation/dashboard
   - Real-time agent activity
   - Message bus communication
   - System metrics

---

## 📞 Getting Help

If you're stuck:
1. Check browser console (F12) for errors
2. Check terminal output for server errors
3. Verify all API keys are set correctly
4. Restart both servers
5. Clear browser cache and cookies

---

## ✅ Final Checklist Before Demo

- [ ] Database connected (run test query in Prisma Studio)
- [ ] Gemini API working (test AI chat)
- [ ] Pinecone API working (AI chat returns relevant info)
- [ ] Main app running on port 3000
- [ ] Hospital automation running on port 3001
- [ ] Test patient check-in works
- [ ] Test doctor can see patient
- [ ] Test prescription flow to pharmacy
- [ ] Test pharmacy can generate bill
- [ ] All interfaces update in real-time

**Good luck with your hackathon! 🚀**
