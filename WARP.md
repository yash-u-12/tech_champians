# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
```bash
# Start main development server (Next.js on port 3000)
npm run dev

# Start with Turbopack (faster hot reload)
npm run dev:turbo

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Database Operations
```bash
# Generate Prisma client (runs automatically after npm install)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio

# Seed database (if configured)
npx prisma db seed

# Reset database (WARNING: destructive)
npx prisma migrate reset
```

### Hospital Automation System (Separate Module)
```bash
# Navigate to hospital automation directory
cd hospital-automation

# Install dependencies (if not already installed)
npm install

# Start hospital automation system (runs on port 3001)
npm start

# Access hospital portal
# http://localhost:3001/hospital-portal

# Access automation dashboard
# http://localhost:3001/hospital-automation/dashboard
```

### Stripe Integration
```bash
# Start Stripe webhook listener for local development
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router (React 19)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (multi-role: PATIENT, DOCTOR, ADMIN)
- **Styling**: Tailwind CSS 4 with Shadcn/ui components
- **Video Calls**: Vonage Video API (OpenTok)
- **Payments**: Stripe with credit-based system
- **AI Integration**: Google Generative AI (Gemini)

### System Overview

This is an **integrated hospital management platform** that provides multiple pathways for patient care:

1. **AI Triage** (Entry Point)
   - Patient describes medical issue to AI agent
   - AI analyzes severity and suggests treatment path:
     - **Mild issues**: AI provides self-care recommendations
     - **Moderate issues**: Suggests video consultation with doctor
     - **Severe/Complex issues**: Recommends hospital visit

2. **Video Consultation Path** (Telemedicine)
   - Lives in root directory and `/app`
   - Runs on port 3000
   - Credit-based video calls with verified doctors
   - Doctor can prescribe medication digitally

3. **Hospital Visit Path** (Physical Visit Management)
   - Self-contained in `/hospital-automation` directory
   - Runs on port 3001
   - 10 AI agents coordinate entire hospital workflow
   - From check-in to doctor consultation to pharmacy to checkout

### Directory Structure

```
/app
├── (auth)/              # Authentication routes (sign-in, sign-up)
├── (main)/              # Main application routes
│   ├── admin/           # Admin dashboard and management
│   ├── doctor/          # Doctor portal (appointments, payouts)
│   ├── doctors/         # Patient-facing doctor discovery
│   ├── onboarding/      # User role selection and profile setup
│   ├── pricing/         # Credit packages and payment
│   ├── video-call/      # Video consultation interface
│   ├── hospital-automation/  # Dashboard for AI agent system
│   ├── hospital-portal/ # Multi-role interface (Doctor/Patient/Pharmacy)
│   └── hospital-workflow/    # Workflow visualization
└── api/
    ├── chat/            # AI health assistant endpoints
    ├── hospital/        # Hospital portal API
    ├── hospital-automation/ # AI agent system API
    ├── user/            # User management
    └── webhook/         # Stripe webhooks

/actions                 # Next.js Server Actions (appointments, credits, users)
/components              # React components (UI components, forms, cards)
/lib                     # Utilities (Prisma client, schemas, helpers)
/prisma                  # Database schema and migrations
/hospital-automation     # 🤖 AI Multi-Agent System (separate module)
  ├── agents/            # 10 specialized AI agents
  ├── workflows/         # Orchestration logic
  ├── interfaces/        # Multiple UI interfaces
  └── utils/             # Helper functions
```

### Database Architecture (Prisma)

**Key Models:**
- `User`: Unified model for patients, doctors, and admins (role-based)
- `Appointment`: Video consultation bookings with Vonage session integration
- `Availability`: Doctor time slot management
- `CreditTransaction`: Credit purchase and usage tracking
- `Payout`: Doctor earnings and withdrawal requests
- `Chat` + `Message`: AI health assistant conversations

**Important Enums:**
- `UserRole`: UNASSIGNED, PATIENT, DOCTOR, ADMIN
- `VerificationStatus`: PENDING, VERIFIED, REJECTED (for doctors)
- `AppointmentStatus`: SCHEDULED, COMPLETED, CANCELLED
- `PayoutStatus`: PROCESSING, PROCESSED

### Authentication & Authorization Flow

1. **Clerk** manages user authentication
2. **Middleware** (`middleware.js`) handles:
   - Hospital routes bypass authentication (lines 7-14)
   - Currently allows all routes (line 18) - Clerk integration disabled
3. **Role-based access**:
   - `role` field in User model determines access
   - Onboarding flow assigns roles after sign-up
   - Server Actions verify roles via `auth()` from Clerk

### Hospital Visit Workflow Architecture

**Complete Patient Journey for Hospital Visits:**

1. **Patient Side** (Mobile/Web Interface):
   - Patient opts for "Hospital Visit" after AI triage
   - Views doctor availability in real-time
   - Checks in and receives queue position
   - Tracks journey: Registration → Doctor → Pharmacy → Checkout
   - Views prescription in patient profile
   - Receives pharmacy bill notification

2. **Hospital Side** (Agent Coordination):
   - **Reception Agent**: Receives patient details, creates visit record
   - **Triage Agent**: Assesses urgency, determines specialty needed
   - **Scheduling Agent**: Assigns available doctor based on specialty
   - **Doctor Interface**: Shows patient in queue with AI triage notes
   - **Doctor Action**: Examines patient, writes prescription
   - **Prescription Flow**: Auto-saved to patient profile (visible to both doctor & patient)
   - **Pharmacy Agent**: Receives prescription on pharmacy mobile interface
   - **Billing Agent**: Generates itemized bill for medicines
   - **Patient Checkout**: Collects medicines and completes visit

3. **Pharmacy Side** (Mobile Interface):
   - Receives prescriptions in real-time
   - Views patient details and medication list
   - Generates bill (auto-calculated from inventory prices)
   - Marks medicines as dispensed
   - Updates patient profile with dispensed status

**10 AI Agents** orchestrating the workflow:
1. **Reception Agent**: Patient check-in, registration, user detail collection
2. **Triage Agent**: Medical assessment, prioritization, specialty routing
3. **Scheduling Agent**: Doctor/room assignment based on availability
4. **Emergency Agent**: Critical care fast-tracking
5. **Lab Agent**: Test ordering if needed (optional flow)
6. **Pharmacy Agent**: Prescription processing, inventory management
7. **Billing Agent**: Medicine bill generation and payment
8. **Inventory Agent**: Stock tracking, low-stock alerts
9. **Staff Coordinator Agent**: Doctor availability management
10. **Patient Monitoring Agent**: Journey tracking, status updates

**Communication**: All agents communicate through a central message bus (`message-bus.js`) enabling real-time coordination without tight coupling.

**Workflows**: Located in `/hospital-automation/workflows/`, orchestrate multi-step processes (admission, emergency response, discharge).

### Video Call Architecture

- **Session Creation**: When appointment booked, `createVideoSession()` generates Vonage session ID
- **Token Generation**: `generateVideoToken()` creates time-limited tokens for participants
- **Security**: Only doctor/patient in appointment can join; tokens expire 5 min after appointment end
- **Storage**: `videoSessionId` and `videoSessionToken` stored in Appointment model

### Credit System

- **Credit Cost**: 500 credits = 1 video consultation
- **Purchase**: Handled via Stripe (see `/app/(main)/pricing`)
- **Deduction**: `deductCreditsForAppointment()` in `/actions/credits.js`
- **Doctor Earnings**: Credits convert to payouts with platform fee deducted

### Form Validation Strategy

All forms use **Zod schemas** (defined in `/lib/schema.js`) with **React Hook Form**:
- Profanity filtering via `bad-words` package
- Type coercion for numeric inputs
- Comprehensive validation messages
- Server-side validation in Server Actions mirrors client-side

## Important Patterns

### Server Actions Convention
All data mutations use Next.js Server Actions (in `/actions`):
```javascript
"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function actionName(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  // Get user from database
  const user = await db.user.findUnique({
    where: { clerkUserId: userId }
  });
  
  // Perform action with proper error handling
  // Always revalidatePath() after mutations
}
```

### Prisma Client Usage
Always import from `/lib/prisma.js` as `db`:
```javascript
import { db } from "@/lib/prisma";
```
Never instantiate PrismaClient directly - singleton pattern prevents connection issues.

### Component Organization
- UI primitives: `/components/ui` (Shadcn components)
- Feature components: `/components` root (e.g., `appointment-card.jsx`, `header.jsx`)
- Page-specific components: Co-located in route directories when complex

### Image Handling
Next.js Image component configured for Clerk CDN:
- `protocol: "https"`
- `hostname: "img.clerk.com"`

### Hospital System Integration
When working with hospital automation:
1. Changes to AI agents require restart of hospital system (not main dev server)
2. Hospital system runs independently - can develop main app without it
3. API routes in `/app/api/hospital-automation` bridge the two systems
4. Shared data models may exist in main Prisma schema
5. **Key Integration Points**:
   - AI triage recommendations feed into hospital visit flow
   - Patient profiles shared between video consultation and hospital visit
   - Prescriptions from both paths stored in same database model
   - Pharmacy interface works for both digital prescriptions (VC) and physical visits

## Environment Variables Required

### Main Application
```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Vonage Video API
NEXT_PUBLIC_VONAGE_APPLICATION_ID="..."
VONAGE_PRIVATE_KEY="..."  # Multi-line private key
VONAGE_API_KEY="..."
VONAGE_API_SECRET="..."

# Stripe Payments
STRIPE_SECRET_KEY="sk_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # For webhook verification

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Hospital Automation System
Create `/hospital-automation/.env.local`:
```env
GEMINI_API_KEY="..."  # Google Generative AI API key
HOSPITAL_AI_MODEL="gemini-pro"
```

## Key Workflows

### Complete Patient Journey (AI-Driven Triage)

**Step 1: AI Triage (Entry Point)**
1. Patient accesses AI assistant (via `/ai-assistant` or chat interface)
2. Describes medical issue/symptoms to AI agent
3. AI analyzes severity and recommends:
   - **Mild**: Self-care tips, over-the-counter suggestions
   - **Moderate**: Video consultation with doctor
   - **Severe**: Hospital visit required

**Step 2a: Video Consultation Path**
1. Patient opts for video consultation
2. Browses available doctors by specialty
3. Books appointment (requires 500 credits)
4. `bookAppointment()` Server Action:
   - Verifies patient has 500+ credits
   - Checks for overlapping appointments
   - Creates Vonage video session
   - Deducts credits from patient
   - Creates appointment record
5. At appointment time, joins video call via `/video-call`
6. Doctor diagnoses and prescribes (digitally)
7. Prescription saved to patient profile

**Step 2b: Hospital Visit Path (Physical Visit)**

*Patient Side:*
1. Patient opts for "Hospital Visit" from AI recommendation
2. System shows real-time doctor availability
3. Patient checks in via `/hospital-portal` (Patient role)
4. Receives queue position and wait time
5. Journey tracker updates in real-time:
   - ✓ Registration
   - ⏳ Waiting for Doctor
   - ⏳ Consultation
   - ⏳ Pharmacy
   - ⏳ Checkout

*Hospital Side (Agent Coordination):*
1. **Reception Agent** receives patient details:
   - Name, age, symptoms from AI triage
   - Medical history if available
   - Creates visit record in system
2. **Triage Agent** processes:
   - Analyzes symptoms + AI triage notes
   - Assigns urgency level (Normal/Urgent/Emergency)
   - Determines required specialty
3. **Scheduling Agent** assigns:
   - Available doctor matching specialty
   - Consultation room number
   - Estimated wait time
4. **Doctor Interface** (`/hospital-portal` Doctor role):
   - Doctor sees patient in queue
   - Views AI triage summary + patient history
   - Clicks patient to open consultation view
   - Examines patient (physical)
   - Writes prescription in interface:
     * Medicine name, dosage, frequency, duration
     * Diagnosis and notes
   - Submits prescription → Auto-saved to patient profile
5. **Prescription Distribution**:
   - Saved in database (visible to patient & doctor)
   - Automatically sent to pharmacy queue
   - Patient notified: "Prescription ready at pharmacy"
6. **Pharmacy Interface** (`/hospital-portal` Pharmacy role - **Mobile Optimized**):
   - Pharmacist sees new prescription order
   - Views patient details + medication list
   - Clicks "Generate Bill"
   - System auto-calculates total from inventory prices
   - Reviews medicines + checks for interactions
   - Clicks "Dispense Medication"
   - Patient notified to collect medicines
7. **Patient Checkout**:
   - Patient sees "Ready for Pickup" status
   - Goes to pharmacy counter
   - Pays bill (cash/card/insurance)
   - Collects medicines
   - Journey marked complete
   - Prescription + bill saved in patient profile forever

### Doctor Verification (For Video Consultations)
1. Doctor completes onboarding (specialty, experience, credentials)
2. Admin reviews at `/admin` dashboard
3. Admin approves/rejects via UI
4. Only VERIFIED doctors appear in patient search
5. Only VERIFIED doctors can receive appointments

## Testing Approaches

- **No formal test suite configured** (no Jest/Vitest/Cypress in package.json)
- Manual testing via development server
- Hospital system: Follow `/hospital-automation/QUICKSTART.md` for testing workflows
- Use Prisma Studio to verify database state
- Browser console for API debugging

## Common Gotchas

1. **Clerk Authentication**: Currently disabled in middleware - re-enable by uncommenting Clerk logic when you have valid keys
2. **Two Node Processes**: Main app and hospital automation run separately; check which one has errors
3. **Prisma Client**: Run `npx prisma generate` after schema changes, or install fails
4. **Video Sessions**: Vonage requires private key as environment variable (can be multi-line)
5. **Stripe Webhooks**: Must run `stripe listen` locally or webhooks fail
6. **Hospital Agent Communication**: Agents communicate asynchronously - debugging requires checking message bus logs
7. **Port Conflicts**: Main app (3000), hospital automation (3001) - ensure both ports available
8. **Windows Paths**: Use PowerShell-compatible commands or Git Bash

## Development Workflow

### Adding New Feature to Main App
1. Define Prisma schema changes in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name feature_name`
3. Create Server Action in `/actions`
4. Build UI components in `/components`
5. Create route in `/app/(main)/feature-name`
6. Test with development server
7. Run `npm run lint` before committing

### Modifying Hospital Automation
1. Make changes in `/hospital-automation/agents` or `/workflows`
2. Restart hospital automation system (`npm start` in that directory)
3. Test via `/hospital-portal` or `/hospital-automation/dashboard`
4. Check browser console for agent message bus activity
5. Refer to `/hospital-automation/USAGE_GUIDE.md` for detailed workflows

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev` (creates migration + applies it)
3. Prisma Client auto-regenerates
4. Update TypeScript types if using explicit typing
5. Consider data migration for existing records

## Special Notes

- **AI Triage as Gateway**: All patient journeys start with AI analysis - determines care pathway
- **Three Care Pathways**: Self-care (AI only) → Video Consultation (credit-based) → Hospital Visit (physical)
- **Unified Patient Profile**: Prescriptions, medical history, and bills from both VC and hospital visits stored together
- **Pharmacy Mobile Interface**: Optimized for pharmacist's mobile device to process prescriptions on-the-go
- **Real-time Updates**: Patient, doctor, and pharmacy interfaces update automatically (polling every 5-10 seconds)
- **Prescription Visibility**: Both doctor and patient can view prescription history from profile
- **Agent Coordination**: Hospital agents work autonomously but coordinately via message bus
- **Doctor Availability**: Real-time tracking - patients see which doctors are available before hospital visit
- **Turbopack Mode**: Available via `npm run dev:turbo` for faster HMR
- **Profanity Filtering**: All user text inputs filtered via `bad-words` in Zod schemas
- **Role Assignment**: Users start as UNASSIGNED, must complete onboarding
- **Video Call Timing**: Users can only join calls at/after scheduled start time (enforced in `generateVideoToken`)
- **Platform Fee**: Deducted from doctor payouts (see Payout model in schema)
