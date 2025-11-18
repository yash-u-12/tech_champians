# Hospital Automation System - Visual Overview

## 🏥 System Architecture

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃           HOSPITAL AUTOMATION PORTAL                        ┃
┃        http://localhost:3001/hospital-portal                ┃
┃                                                              ┃
┃  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     ┃
┃  │   🩺 Doctor  │  │  👤 Patient   │  │  💊 Pharmacy  │     ┃
┃  │              │  │               │  │               │     ┃
┃  │  Select Role │  │  Select Role  │  │  Select Role  │     ┃
┃  └──────────────┘  └──────────────┘  └──────────────┘     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
            │                 │                 │
            ▼                 ▼                 ▼
```

## 📱 Three Interfaces

### 🩺 Doctor Interface
```
┌─────────────────────────────────────────┐
│  Doctor Portal - Dr. Smith             │
├─────────────────────────────────────────┤
│                                         │
│  📋 My Patients (3)                     │
│  ┌───────────────────────────────────┐ │
│  │ 👤 John Doe                       │ │
│  │ Fever and cough - Room R-C-003   │ │
│  │ [View Details]                    │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ 👤 Sarah Johnson                  │ │
│  │ Chest pain - Room R-E-001         │ │
│  │ [View Details]                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📝 Selected: John Doe                  │
│  ┌─────────────────────────────────┐   │
│  │ Details | Lab Results | RX      │   │
│  ├─────────────────────────────────┤   │
│  │ Write Prescription:             │   │
│  │ • Amoxicillin 500mg             │   │
│  │ • Ibuprofen 400mg               │   │
│  │ [Add Medication]                │   │
│  │ [Submit Prescription]           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 👤 Patient Interface
```
┌─────────────────────────────────────────┐
│  Patient Portal - John Doe             │
├─────────────────────────────────────────┤
│                                         │
│  Status: [In Consultation]             │
│  Queue Position: #1                    │
│  Wait Time: 15 minutes                 │
│  Priority: [Normal]                    │
│                                         │
│  🚶 Your Journey:                       │
│  ✅ Registration                        │
│  ✅ Triage Assessment                   │
│  🔵 Doctor Consultation (Current)       │
│  ⚪ Lab Tests                           │
│  ⚪ Pharmacy                            │
│  ⚪ Billing & Checkout                  │
│                                         │
│  📋 Details:                            │
│  Doctor: Dr. Smith                     │
│  Room: R-CONS-003                      │
│  Complaint: Fever and cough            │
│                                         │
│  💊 Prescription: (Ready)               │
│  • Amoxicillin 500mg - 7 days         │
│  • Ibuprofen 400mg - 5 days           │
│                                         │
│  💰 Billing: $156.98                    │
└─────────────────────────────────────────┘
```

### 💊 Pharmacy Interface
```
┌─────────────────────────────────────────┐
│  Pharmacy Portal                       │
├─────────────────────────────────────────┤
│                                         │
│  Pending Orders: 2                     │
│  Completed Today: 5                    │
│  Low Stock Items: 1                    │
│  Revenue Today: $428.50                │
│                                         │
│  📝 Prescription Orders:                │
│  ┌───────────────────────────────────┐ │
│  │ 👤 John Doe - APT001              │ │
│  │ [Pending]                         │ │
│  │                                   │ │
│  │ Medications:                      │ │
│  │ • Amoxicillin 500mg - $12.99     │ │
│  │ • Ibuprofen 400mg - $8.99        │ │
│  │                                   │ │
│  │ Total: $21.98                     │ │
│  │                                   │ │
│  │ ⚠️ No interactions detected        │ │
│  │                                   │ │
│  │ [Generate Bill] [Dispense]        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📦 Inventory:                          │
│  • Amoxicillin: 150 units ✅          │
│  • Ibuprofen: 200 units ✅            │
│  • Lisinopril: 30 units ⚠️ Low Stock  │
└─────────────────────────────────────────┘
```

## 🔄 Complete Workflow Diagram

```
STEP 1: PATIENT CHECK-IN
┌──────────────┐
│   Patient    │ Fills form (name, reason, emergency)
│  Interface   │ ───────────────────┐
└──────────────┘                    │
                                    ▼
                            ┌───────────────┐
                            │ POST /checkin │
                            └───────┬───────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │  Reception Agent    │
                        │ • Registers patient │
                        │ • Assigns ID        │
                        └──────────┬──────────┘
                                   │
        ┌──────────────────────────┘
        │
STEP 2: TRIAGE & ASSIGNMENT
        │
        ▼
┌──────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│  Triage Agent    │────▶ │ Scheduling      │────▶ │ Doctor Assigned  │
│ • Assesses       │      │ Agent           │      │ • Room allocated │
│ • Orders tests   │      │ • Finds doctor  │      │ • Queue updated  │
└──────────────────┘      └─────────────────┘      └────────┬─────────┘
                                                             │
        ┌────────────────────────────────────────────────────┘
        │
STEP 3: CONSULTATION
        │
        ▼
┌──────────────────────┐
│  Doctor Interface    │ 
│ ┌──────────────────┐ │  1. Doctor sees patient in queue
│ │ John Doe         │ │  2. Reviews details & lab results
│ │ [View Details]   │ │  3. Writes prescription
│ └──────────────────┘ │  4. Submits to pharmacy
└──────────┬───────────┘
           │
           │ Submit Prescription
           │
           ▼
   ┌────────────────┐
   │ PRESCRIPTION_  │ ─────┐
   │   WRITTEN      │      │
   │   (Message)    │      │
   └────────────────┘      │
                           │
        ┌──────────────────┘
        │
STEP 4: PHARMACY PROCESSING
        │
        ▼
┌──────────────────────┐      ┌─────────────────┐
│  Pharmacy Agent      │────▶ │ Billing Agent   │
│ • Receives RX        │      │ • Calculates    │
│ • Checks inventory   │      │ • Generates bill│
│ • Checks interactions│      └─────────────────┘
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Pharmacy Interface   │
│ ┌──────────────────┐ │  1. Order appears automatically
│ │ John Doe - RX    │ │  2. Pharmacist reviews
│ │ • Amoxicillin    │ │  3. Generates bill
│ │ • Ibuprofen      │ │  4. Dispenses medication
│ │ [Dispense]       │ │
│ └──────────────────┘ │
└──────────────────────┘
           │
           │ Dispense
           │
           ▼
STEP 5: COMPLETION
        
┌──────────────────────┐
│  Patient Interface   │
│ ✅ Prescription Ready │  Patient sees:
│ ✅ Medication         │  • Journey complete
│ ✅ Bill: $21.98       │  • Prescription details
│ [Complete Checkout]  │  • Billing info
└──────────────────────┘
```

## 📊 Message Flow

```
┌─────────────┐                                      ┌─────────────┐
│   Patient   │ ─── PATIENT_ARRIVAL ────────────▶  │  Reception  │
│  Interface  │                                      │    Agent    │
└─────────────┘                                      └──────┬──────┘
                                                            │
                                                            │
                                                            ▼
                                                     ┌──────────────┐
                                                     │   Triage     │
                                                     │    Agent     │
                                                     └──────┬───────┘
                                                            │
                                                            │
                                                            ▼
┌─────────────┐                                      ┌──────────────┐
│   Doctor    │ ◀── DOCTOR_ASSIGNED ────────────── │  Scheduling  │
│  Interface  │                                      │    Agent     │
└──────┬──────┘                                      └──────────────┘
       │
       │ PRESCRIPTION_WRITTEN
       │
       ▼
┌──────────────┐                                     ┌──────────────┐
│   Pharmacy   │ ◀── PRESCRIPTION_PROCESSED ──────  │   Pharmacy   │
│   Interface  │                                     │    Agent     │
└──────┬───────┘                                     └──────────────┘
       │
       │ MEDICATION_DISPENSED
       │
       ▼
┌─────────────┐                                      ┌──────────────┐
│   Patient   │ ◀── Status Updates ────────────────│  All Agents  │
│  Interface  │                                      └──────────────┘
└─────────────┘
```

## 🎯 Data Flow Example

```
Patient: John Doe
Complaint: Fever and cough

1. CHECK-IN
   ┌────────────────────────────┐
   │ Name: John Doe             │
   │ Reason: Fever and cough    │
   │ Emergency: No              │
   └────────────────────────────┘
              ↓
2. TRIAGE
   ┌────────────────────────────┐
   │ Urgency: Normal            │
   │ Specialty: General         │
   │ Tests: Blood test          │
   └────────────────────────────┘
              ↓
3. ASSIGNMENT
   ┌────────────────────────────┐
   │ Doctor: Dr. Smith          │
   │ Room: R-CONS-003           │
   │ Queue: Position #1         │
   └────────────────────────────┘
              ↓
4. CONSULTATION
   ┌────────────────────────────┐
   │ Diagnosis: URTI            │
   │ Prescription:              │
   │ • Amoxicillin 500mg        │
   │ • Ibuprofen 400mg          │
   └────────────────────────────┘
              ↓
5. PHARMACY
   ┌────────────────────────────┐
   │ Medications:               │
   │ • Amoxicillin - $12.99     │
   │ • Ibuprofen - $8.99        │
   │ Total: $21.98              │
   │ Interactions: None         │
   └────────────────────────────┘
              ↓
6. COMPLETION
   ┌────────────────────────────┐
   │ Status: Completed          │
   │ Time: 45 minutes           │
   │ Medication: Dispensed      │
   │ Bill: Paid ($21.98)        │
   └────────────────────────────┘
```

## 🌐 API Endpoints Map

```
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DOCTOR APIs                                                │
│  ├─ GET  /api/hospital-automation/doctor                   │
│  │       ?doctorName=Dr.Smith                              │
│  │       → Returns assigned patients                       │
│  │                                                          │
│  └─ POST /api/hospital-automation/doctor                   │
│          { action: "submit_prescription", ... }            │
│          { action: "complete_consultation", ... }          │
│                                                             │
│  PATIENT APIs                                               │
│  ├─ GET  /api/hospital-automation/patient                  │
│  │       ?patientId=PAT123                                 │
│  │       → Returns patient status & journey               │
│  │                                                          │
│  └─ POST /api/hospital-automation/patient/checkin         │
│          { patientId, name, reason, isEmergency }         │
│                                                             │
│  PHARMACY APIs                                              │
│  ├─ GET  /api/hospital-automation/pharmacy/orders         │
│  │       → Returns all prescription orders                │
│  │                                                          │
│  ├─ GET  /api/hospital-automation/pharmacy/inventory      │
│  │       → Returns medication stock levels                │
│  │                                                          │
│  ├─ POST /api/hospital-automation/pharmacy/dispense       │
│  │       { orderId, pharmacistId }                        │
│  │                                                          │
│  └─ POST /api/hospital-automation/pharmacy/generate-bill  │
│          { orderId }                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Integration Points

```
┌──────────────────────────────────────────────────────────┐
│               INTEGRATION ARCHITECTURE                   │
└──────────────────────────────────────────────────────────┘

    FRONTEND                API              MESSAGE BUS           AGENTS
                                                                   
┌──────────────┐      ┌──────────┐      ┌──────────────┐     ┌──────────┐
│   Doctor     │────▶ │   POST   │────▶ │  PUBLISH     │────▶│Pharmacy  │
│  Interface   │      │  /doctor │      │  Message     │     │  Agent   │
└──────────────┘      └──────────┘      └──────────────┘     └──────────┘
                                              │
┌──────────────┐      ┌──────────┐           │               ┌──────────┐
│   Patient    │────▶ │   GET    │           │          ┌───│Reception │
│  Interface   │      │ /patient │           │          │    │  Agent   │
└──────────────┘      └──────────┘           ▼          │    └──────────┘
                                         ┌───────────┐   │
┌──────────────┐      ┌──────────┐      │ SUBSCRIBE │◀──┤    ┌──────────┐
│  Pharmacy    │◀──── │   GET    │◀──── │  & NOTIFY │   └───│  Triage  │
│  Interface   │      │/pharmacy │      └───────────┘        │  Agent   │
└──────────────┘      └──────────┘                           └──────────┘
```

---

**Access Portal:** http://localhost:3001/hospital-portal

**See Quickstart:** `hospital-automation/QUICKSTART.md`

🎉 **System is ready for testing!**
