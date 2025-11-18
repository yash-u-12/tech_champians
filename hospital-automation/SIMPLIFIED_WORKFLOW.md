# Simplified Hospital Automation Workflow

## 🎯 Goal
Create a simple, automated hospital system where patients describe problems, AI assigns them to doctors, and doctors can upload prescriptions.

## 📊 Three Main Workflows

### 1. **Patient Workflow**
```
Patient Opens App
    ↓
Describes Health Issue
    ↓
AI Analyzes Problem (Triage Agent)
    ↓
Assigns to Available Doctor (Scheduling Agent)
    ↓
Patient Waits & Tracks Status
    ↓
Receives Prescription
    ↓
Profile Saved with History
```

### 2. **Doctor Workflow**
```
Doctor Logs In
    ↓
Sees Assigned Patients Queue
    ↓
Selects Patient
    ↓
Reviews Problem Description
    ↓
Writes Prescription
    ↓
Uploads to Patient Profile
    ↓
Marks Consultation Complete
```

### 3. **Pharmacy Workflow** (Optional/Future)
```
Receives Prescription
    ↓
Prepares Medications
    ↓
Notifies Patient
    ↓
Dispenses Medicine
```

## 🤖 AI Agents Involved

### Core Agents (Essential)
1. **Reception Agent** - Receives patient, creates profile
2. **Triage Agent** - Analyzes symptoms, determines urgency
3. **Scheduling Agent** - Assigns to available doctor
4. **Pharmacy Agent** - Handles prescriptions (optional)

### Data Flow
```
Patient Input
    ↓
[Reception Agent] Creates patient record
    ↓
[Triage Agent] Analyzes symptoms → Determines urgency
    ↓
[Scheduling Agent] Finds available doctor → Assigns
    ↓
Doctor Interface shows patient
    ↓
Doctor writes prescription
    ↓
Saves to patient profile
```

## 📁 Data Structure

### Patient Profile
```json
{
  "patientId": "PAT001",
  "name": "John Doe",
  "age": 35,
  "contactInfo": {
    "phone": "1234567890",
    "email": "john@email.com"
  },
  "currentVisit": {
    "visitId": "VIS001",
    "checkInTime": "2025-11-18T10:00:00Z",
    "problem": "Fever and headache for 2 days",
    "urgency": "medium",
    "assignedDoctor": "Dr. Smith",
    "status": "in_consultation",
    "prescription": null,
    "notes": null
  },
  "visitHistory": [
    {
      "visitId": "VIS000",
      "date": "2025-10-15",
      "problem": "Regular checkup",
      "doctor": "Dr. Jones",
      "prescription": "Multivitamin",
      "diagnosis": "Healthy"
    }
  ]
}
```

### Doctor Profile
```json
{
  "doctorId": "DR001",
  "name": "Dr. Smith",
  "specialty": "General Medicine",
  "available": true,
  "currentPatients": ["PAT001", "PAT003"],
  "maxPatients": 5,
  "stats": {
    "patientsToday": 3,
    "totalPatients": 150
  }
}
```

## 🚀 Implementation Steps

### Step 1: Patient Check-In
- Patient opens app
- Fills form: Name, Age, Contact, Problem Description
- Clicks "Check-In"
- System creates patient profile

### Step 2: AI Processing
- Reception Agent receives data
- Triage Agent analyzes problem using keywords/AI
- Determines urgency (low/medium/high/critical)
- Scheduling Agent finds available doctor
- Assigns patient to doctor

### Step 3: Doctor Consultation
- Doctor sees patient in queue
- Clicks on patient to see details
- Reviews problem description
- Writes prescription
- Adds diagnosis notes
- Clicks "Complete Consultation"

### Step 4: Data Persistence
- All data saved to patient profile
- Visit added to history
- Doctor stats updated
- Patient notified

## 🔧 Technical Architecture

### Database Schema (Simple)
```
Patients Table:
- patientId (PK)
- name
- age
- phone
- email
- createdAt

Visits Table:
- visitId (PK)
- patientId (FK)
- checkInTime
- problem
- urgency
- assignedDoctorId
- status (waiting/in_consultation/completed)
- prescription
- diagnosis
- completedAt

Doctors Table:
- doctorId (PK)
- name
- specialty
- available
- maxPatients
```

### API Endpoints
```
POST /api/hospital/patient/checkin
GET  /api/hospital/patient/:patientId
POST /api/hospital/doctor/prescription
GET  /api/hospital/doctor/:doctorId/patients
POST /api/hospital/doctor/complete/:visitId
```

## 🎨 User Interface Flow

### Patient App Screen
1. **Check-In Screen**: Form to enter details
2. **Waiting Screen**: Shows queue position, doctor assigned
3. **Status Screen**: Live updates on consultation
4. **Result Screen**: View prescription and diagnosis
5. **History Screen**: Past visits

### Doctor App Screen
1. **Dashboard**: Today's stats, active patients
2. **Queue Screen**: List of assigned patients
3. **Patient Detail**: Problem, history, vitals
4. **Prescription Form**: Write prescription
5. **History**: Past patients

## 🔄 Real-Time Updates
- Patient status updates automatically
- Doctor queue updates when new patient assigned
- WebSocket/Polling for live updates

## ✅ Key Features
- ✅ Multiple doctors work simultaneously
- ✅ AI-powered patient assignment
- ✅ Complete patient history saved
- ✅ Simple, intuitive interfaces
- ✅ Real-time status updates
- ✅ Scalable architecture

## 🎯 Next Steps
1. Set up database (PostgreSQL with Prisma)
2. Create API endpoints
3. Build patient check-in interface
4. Build doctor dashboard
5. Test with multiple doctors and patients
