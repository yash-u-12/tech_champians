# 🔑 API Keys Needed - Quick Reference

## 🚨 CRITICAL (Required for Demo)

### 1. **Database** 
- **Service**: PostgreSQL (Neon.tech recommended for quick setup)
- **Where**: https://neon.tech
- **What to do**:
  1. Sign up (free)
  2. Create project "medsync_ai"
  3. Copy connection string
- **Where to paste**: `.env.local` → `DATABASE_URL`
- **Example**: `postgresql://user:pass@ep-xxx.neon.tech/medsync_ai?sslmode=require`

### 2. **Google Gemini AI**
- **Service**: Google AI Studio
- **Where**: https://makersuite.google.com/app/apikey
- **What to do**:
  1. Sign in with Google account
  2. Click "Create API Key"
  3. Copy key
- **Where to paste**: 
  - `.env.local` → `GEMINI_API_KEY`
  - `hospital-automation/.env.local` → `GEMINI_API_KEY`
- **Example**: `AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. **Pinecone Vector Database**
- **Service**: Pinecone
- **Where**: https://www.pinecone.io
- **What to do**:
  1. Sign up (free starter plan)
  2. Create new index:
     - Name: `medical-chatbot`
     - Dimensions: `384`
     - Metric: `cosine`
  3. Copy API key from dashboard
- **Where to paste**: `.env.local` → `PINECONE_API_KEY`
- **Example**: `pcsk_xxxxx-xxxxx-xxxxx`

---

## ⚠️ OPTIONAL (For Full Features)

### 4. **Clerk** (Authentication - Currently Disabled)
- **Service**: Clerk
- **Where**: https://clerk.com
- **For**: User authentication
- **Status**: Not needed for demo (middleware bypasses auth)

### 5. **Vonage** (Video Calls)
- **Service**: Vonage Video API
- **Where**: https://www.vonage.com/communications-apis/video/
- **For**: Doctor-patient video consultations
- **Status**: Optional - can demo hospital visit workflow without it

### 6. **Stripe** (Payments)
- **Service**: Stripe
- **Where**: https://stripe.com
- **For**: Credit purchase system
- **Status**: Optional - can manually add credits via database

---

## 📋 Setup Order

1. **Get Neon Database** (2 minutes)
   - Instant setup, no local install needed
   
2. **Get Gemini API Key** (1 minute)
   - Just need Google account
   
3. **Get Pinecone** (5 minutes)
   - Need to create index and wait for initialization
   
4. **Update .env.local files** (1 minute)
   - Copy-paste the three keys
   
5. **Run migrations** (2 minutes)
   ```bash
   npx prisma migrate dev
   ```
   
6. **Start servers** (1 minute)
   ```bash
   npm run dev
   cd hospital-automation && npm start
   ```

**Total Time: ~15 minutes**

---

## 🎯 Minimum Viable Demo

With just these 3 keys, you can demo:
- ✅ AI symptom analysis
- ✅ Hospital visit workflow
- ✅ Doctor-patient-pharmacy coordination
- ✅ Prescription management
- ✅ Real-time agent coordination
- ✅ Patient journey tracking

**This covers 90% of your hackathon demo!**

---

## 📝 Copy-Paste Template

Once you have the keys, update `.env.local`:

```env
DATABASE_URL="paste-neon-connection-string-here"
GEMINI_API_KEY="paste-gemini-key-here"
PINECONE_API_KEY="paste-pinecone-key-here"
PINECONE_INDEX="medical-chatbot"
```

And `hospital-automation/.env.local`:

```env
GEMINI_API_KEY="paste-same-gemini-key-here"
HOSPITAL_AI_MODEL="gemini-pro"
```

**That's it! You're ready to demo! 🚀**
