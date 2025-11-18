# Hospital Automation Multi-Interface System

## Overview

The Hospital Automation Portal provides role-based interfaces for doctors, patients, and pharmacy staff, all integrated with the AI agent system for seamless hospital operations.

## Access the Portal

Navigate to: **http://localhost:3001/hospital-portal**

## Available Interfaces

### 🩺 Doctor Interface
**Access:** Select "Doctor" role on the portal page

**Features:**
- View assigned patients in real-time
- Access patient details (chief complaint, vitals, history)
- Review lab test results
- Write and submit prescriptions
- Add diagnosis and treatment notes
- Complete consultations
- Automatic prescription forwarding to pharmacy

**Workflow:**
1. Doctor logs in and sees patient queue
2. Selects a patient to view details
3. Reviews lab results (if ordered)
4. Writes prescription with medications
5. Submits prescription (auto-forwards to pharmacy)
6. Completes consultation

### 👤 Patient Interface
**Access:** Select "Patient" role on the portal page

**Features:**
- Check-in for consultation
- Track journey through hospital
- View assigned doctor and location
- Monitor queue position and wait time
- Access lab test results
- View prescriptions when ready
- Check billing information
- Real-time status updates

**Workflow:**
1. Patient fills check-in form
2. System assigns urgency level
3. Patient waits in queue
4. Gets assigned to doctor
5. Consultation happens
6. Views lab results (if any)
7. Receives prescription
8. Collects medication from pharmacy
9. Completes payment

### 💊 Pharmacy Interface
**Access:** Select "Pharmacy" role on the portal page

**Features:**
- View incoming prescription orders
- Check medication inventory
- Review drug interactions
- Generate medication bills
- Dispense medications to patients
- Monitor low stock alerts
- Track completed orders

**Workflow:**
1. Receives prescription from doctor
2. Reviews medications and interactions
3. Generates bill for patient
4. Dispenses medication
5. Updates inventory
6. Marks order as completed

## Integration with AI Agents

### Message Flow

```
Patient Check-in → Reception Agent → Triage Agent
                                    ↓
Lab Agent ← Scheduling Agent ← Doctor Assignment
    ↓              ↓
Doctor Interface   Consultation
    ↓              ↓
Prescription → Pharmacy Agent → Pharmacy Interface
                    ↓              ↓
              Billing Agent    Medication Dispensed
                    ↓
              Patient Checkout
```

### Key Integration Points

1. **Doctor → Pharmacy:**
   - Doctor submits prescription via `PRESCRIPTION_WRITTEN` message
   - Pharmacy Agent receives and processes automatically
   - Pharmacy Interface displays order immediately

2. **Patient Status Updates:**
   - All agent actions publish messages
   - Patient Interface subscribes and updates in real-time
   - Journey tracker shows current step

3. **Lab Results:**
   - Lab Agent publishes results
   - Both Doctor and Patient interfaces receive updates
   - Results displayed in appropriate tabs

## API Endpoints

### Doctor Endpoints
```
GET  /api/hospital-automation/doctor?doctorName=Dr.Smith
POST /api/hospital-automation/doctor
     Body: { action: "submit_prescription", appointmentId, patientId, prescription, diagnosis, notes }
POST /api/hospital-automation/doctor
     Body: { action: "complete_consultation", appointmentId, patientId }
```

### Patient Endpoints
```
GET  /api/hospital-automation/patient?patientId=PAT123
POST /api/hospital-automation/patient/checkin
     Body: { patientId, name, reason, isEmergency }
```

### Pharmacy Endpoints
```
GET  /api/hospital-automation/pharmacy/orders
GET  /api/hospital-automation/pharmacy/inventory
POST /api/hospital-automation/pharmacy/dispense
     Body: { orderId, pharmacistId }
POST /api/hospital-automation/pharmacy/generate-bill
     Body: { orderId }
```

## Testing the System

### End-to-End Test Scenario

1. **Start the Server:**
   ```bash
   npm run dev
   ```

2. **Open Three Browser Windows:**
   - Window 1: Doctor interface (http://localhost:3001/hospital-portal → Select Doctor)
   - Window 2: Patient interface (http://localhost:3001/hospital-portal → Select Patient)
   - Window 3: Pharmacy interface (http://localhost:3001/hospital-portal → Select Pharmacy)

3. **Patient Checks In:**
   - In Patient window, fill check-in form
   - Name: "John Doe"
   - Reason: "Fever and cough for 3 days"
   - Click "Check-In Now"

4. **Watch the Flow:**
   - Patient window: See journey tracker update
   - Doctor window: Patient appears in queue
   - Doctor selects patient, reviews details
   - Doctor writes prescription
   - Pharmacy window: Order appears automatically

5. **Pharmacy Processes:**
   - Pharmacist reviews prescription
   - Generates bill
   - Dispenses medication
   - Patient receives notification

### Quick Demo Test

1. **Access Portal:**
   ```
   http://localhost:3001/hospital-portal
   ```

2. **Test as Patient:**
   - Select "Patient" role
   - Enter test data and check-in
   - Watch real-time updates

3. **Test as Doctor:**
   - Open new tab, go to same URL
   - Select "Doctor" role
   - View patients (if any were created)

4. **Test as Pharmacy:**
   - Open another tab
   - Select "Pharmacy" role
   - View orders and inventory

## Role-Based Access (Future Enhancement)

Currently uses manual role selection for testing. In production:

1. **Clerk Authentication Integration:**
   ```javascript
   // Set user role in Clerk metadata
   await clerkClient.users.updateUserMetadata(userId, {
     publicMetadata: {
       hospitalRole: 'doctor' // or 'patient', 'pharmacy'
     }
   });
   ```

2. **Automatic Role Detection:**
   - System reads `user.publicMetadata.hospitalRole`
   - Routes to appropriate interface automatically
   - No manual selection needed

3. **Role Assignment Flow:**
   - Admin panel assigns roles
   - Staff login with credentials
   - System routes based on role
   - Secure, no manual switching

## Data Storage

**Current:** In-memory Maps (development/testing)
**Production:** Should use PostgreSQL with Prisma

### Recommended Schema Updates

```prisma
model HospitalUser {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  role      String   // 'doctor', 'patient', 'pharmacy', 'admin'
  name      String
  createdAt DateTime @default(now())
}

model PatientVisit {
  id            String   @id @default(cuid())
  patientId     String
  status        String
  checkInTime   DateTime
  doctorId      String?
  roomId        String?
  prescription  Json?
  labResults    Json?
  invoice       Json?
}

model PharmacyOrder {
  id           String   @id @default(cuid())
  visitId      String
  patientId    String
  medications  Json
  status       String
  totalAmount  Float
  dispensedBy  String?
  dispensedAt  DateTime?
}
```

## Troubleshooting

### "No patients found"
- Ensure agents are running: Check `/hospital-automation/dashboard`
- Check console for message bus errors
- Verify API endpoints are responding

### "Prescription not appearing in pharmacy"
- Check message bus is publishing `PRESCRIPTION_WRITTEN`
- Verify pharmacy API is listening
- Check browser console for errors

### "Real-time updates not working"
- Polling is set to 5-10 seconds
- Check network tab for API calls
- Ensure message bus is active

## Next Steps

- [ ] Add Prisma database integration
- [ ] Implement Clerk role-based authentication
- [ ] Add admin interface for role management
- [ ] Create notification system
- [ ] Add video call integration for consultations
- [ ] Implement payment gateway
- [ ] Add reporting and analytics
- [ ] Mobile-responsive design improvements
- [ ] Add file upload for medical records
- [ ] Implement appointment scheduling

## Architecture

```
┌─────────────────────────────────────────────┐
│         Hospital Portal Page                │
│  (Role Selector / Router)                   │
└─────────────┬───────────────────────────────┘
              │
      ┌───────┴───────┬───────────────┐
      │               │               │
┌─────▼─────┐  ┌──────▼──────┐  ┌────▼──────┐
│  Doctor   │  │   Patient   │  │ Pharmacy  │
│ Interface │  │  Interface  │  │ Interface │
└─────┬─────┘  └──────┬──────┘  └────┬──────┘
      │               │               │
      └───────┬───────┴───────┬───────┘
              │               │
        ┌─────▼───────────────▼─────┐
        │    API Endpoints          │
        │  /doctor, /patient,       │
        │  /pharmacy                │
        └─────┬─────────────────────┘
              │
        ┌─────▼─────────────────────┐
        │    Message Bus            │
        │  (Event Distribution)     │
        └─────┬─────────────────────┘
              │
    ┌─────────┼─────────┬──────────┬─────────┬──────────┐
    │         │         │          │         │          │
┌───▼───┐ ┌──▼───┐ ┌───▼────┐ ┌───▼────┐ ┌──▼───┐ ┌───▼────┐
│Reception│ │Triage│ │Schedule│ │Pharmacy│ │ Lab  │ │Billing │
│ Agent  │ │Agent │ │ Agent  │ │ Agent  │ │Agent │ │ Agent  │
└────────┘ └──────┘ └────────┘ └────────┘ └──────┘ └────────┘
```

## Contributing

When adding new features:

1. Create interface component in `hospital-automation/interfaces/[role]/`
2. Add API endpoints in `app/api/hospital-automation/[role]/`
3. Subscribe to relevant message bus events
4. Update this README
5. Test end-to-end workflow

---

**Built with:** Next.js 15, React 19, Tailwind CSS, Shadcn/ui
**AI Agents:** Google Gemini with rule-based fallbacks
**Real-time:** Message Bus architecture with polling
