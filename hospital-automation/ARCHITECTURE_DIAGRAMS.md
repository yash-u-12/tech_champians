# Hospital Automation System - Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOSPITAL AUTOMATION SYSTEM                    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     MESSAGE BUS                          │   │
│  │            (Central Communication Hub)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│    ┌────▼────┐         ┌────▼────┐        ┌────▼────┐         │
│    │Reception│         │ Triage  │        │Scheduling│         │
│    │  Agent  │────────▶│  Agent  │───────▶│  Agent  │         │
│    └─────────┘         └─────────┘        └────┬────┘         │
│         │                   │                   │               │
│         │              ┌────▼────┐         ┌────▼────┐         │
│         │              │   Lab   │         │Pharmacy │         │
│         │              │  Agent  │         │  Agent  │         │
│         │              └─────────┘         └─────────┘         │
│         │                                        │               │
│         └────────────────┬───────────────────────┘              │
│                          │                                       │
│                     ┌────▼────┐                                 │
│                     │ Billing │                                 │
│                     │  Agent  │                                 │
│                     └─────────┘                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Patient Admission Workflow

```
START: Patient Arrives
         │
         ▼
┌─────────────────┐
│ Reception Agent │
│  - Register     │
│  - Check-in     │
│  - AI Urgency   │
└────────┬────────┘
         │
         ▼
    Emergency?
         │
    ┌────┴────┐
   YES       NO
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│Emergency│ │ Triage Agent │
│Fast Track│ │ - Assessment │
└────────┘ │ - AI Analysis│
           │ - Tests Order│
           └──────┬───────┘
                  │
         ┌────────┴─────────┐
         │                  │
         ▼                  ▼
    ┌─────────┐      ┌────────────┐
    │Lab Agent│      │ Scheduling │
    │- Tests  │      │  - Doctor  │
    │- Results│      │  - Room    │
    └────┬────┘      └─────┬──────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Consultation   │
         │   In Progress   │
         └────────┬────────┘
                  │
                  ▼
            Prescription?
                  │
             ┌────┴────┐
            YES       NO
             │         │
             ▼         │
      ┌──────────┐    │
      │Pharmacy  │    │
      │Agent     │    │
      │-Medicine │    │
      └────┬─────┘    │
           └─────┬────┘
                 │
                 ▼
         ┌──────────────┐
         │Billing Agent │
         │ - Invoice    │
         │ - Payment    │
         └──────┬───────┘
                │
                ▼
         Patient Discharged
              END
```

## Agent Communication Pattern

```
Agent A                Message Bus               Agent B
   │                        │                      │
   │─── Send Message ──────▶│                      │
   │   {type, payload}      │                      │
   │                        │────── Route ────────▶│
   │                        │                      │
   │                        │                  ┌───▼───┐
   │                        │                  │Process│
   │                        │                  │Handler│
   │                        │                  └───┬───┘
   │                        │◀──── Response ───────│
   │◀─── Acknowledgment ────│                      │
   │                        │                      │
```

## Data Flow: Patient Check-in to Consultation

```
1. Patient Data Input
   ├─ Name
   ├─ Reason for visit
   ├─ Emergency flag
   └─ Patient ID

2. Reception Agent Processing
   ├─ Register in system
   ├─ AI urgency assessment
   ├─ Add to queue
   └─ Send to Triage

3. Triage Agent Analysis
   ├─ Symptom analysis (AI)
   ├─ Priority determination
   ├─ Test recommendations
   ├─ Specialty identification
   └─ Send to Lab & Scheduling

4. Parallel Processing
   ├─ Lab Agent
   │  ├─ Order tests
   │  ├─ Allocate equipment
   │  └─ Generate results
   └─ Scheduling Agent
      ├─ Find available doctor
      ├─ Allocate room
      └─ Create appointment

5. Consultation Phase
   ├─ Doctor-Patient interaction
   ├─ Diagnosis
   ├─ Prescription (if needed)
   └─ Treatment plan

6. Post-Consultation
   ├─ Pharmacy Agent
   │  ├─ Process prescription
   │  ├─ Check interactions
   │  └─ Dispense medication
   └─ Billing Agent
      ├─ Generate invoice
      ├─ Calculate charges
      └─ Process payment

7. Discharge
   └─ Patient exit with records
```

## Resource Management Architecture

```
┌──────────────────────────────────────────────────┐
│           SCHEDULING AGENT                       │
│                                                   │
│  ┌────────────────┐      ┌──────────────────┐  │
│  │   Doctors      │      │      Rooms       │  │
│  │                │      │                  │  │
│  │ General: 2     │      │ Emergency: 5     │  │
│  │ Cardiology: 2  │      │ Consultation: 10 │  │
│  │ Neurology: 2   │      │ Observation: 5   │  │
│  │ ...etc         │      │                  │  │
│  └────────┬───────┘      └────────┬─────────┘  │
│           │                       │             │
│           └───────┬───────────────┘             │
│                   │                             │
│            ┌──────▼──────┐                      │
│            │  Allocation │                      │
│            │   Engine    │                      │
│            │             │                      │
│            │ - Priority  │                      │
│            │ - Available │                      │
│            │ - Matching  │                      │
│            └─────────────┘                      │
└──────────────────────────────────────────────────┘
```

## AI Integration Points

```
┌─────────────────────────────────────────────────┐
│              GOOGLE GEMINI AI                    │
└────────┬─────────────────────────────┬──────────┘
         │                             │
    ┌────▼────┐                   ┌────▼────┐
    │ Triage  │                   │Pharmacy │
    │  Agent  │                   │  Agent  │
    └─────────┘                   └─────────┘
         │                             │
    ┌────▼─────────────┐         ┌────▼──────────────┐
    │ - Symptom        │         │ - Drug            │
    │   analysis       │         │   interactions    │
    │ - Priority       │         │ - Medication      │
    │   determination  │         │   information     │
    │ - Test           │         │ - Side effects    │
    │   recommendations│         │ - Dosage guidance │
    │ - Specialty      │         └───────────────────┘
    │   matching       │
    └──────────────────┘
```

## Dashboard Data Flow

```
┌──────────────────────────────────────────────────┐
│              BROWSER / DASHBOARD                  │
└────────┬────────────────────────────┬────────────┘
         │                            │
         │ HTTP Request               │ WebSocket (future)
         │                            │
    ┌────▼────────────────────────────▼───┐
    │    API Route: /api/hospital-automation│
    └────────┬───────────────────────┬─────┘
             │                       │
        ┌────▼────┐             ┌────▼────┐
        │GET      │             │POST     │
        │- Status │             │- Execute│
        │- Metrics│             │- Actions│
        └────┬────┘             └────┬────┘
             │                       │
             └───────┬───────────────┘
                     │
            ┌────────▼─────────┐
            │   Orchestrator   │
            │                  │
            │ - getStatus()    │
            │ - getMetrics()   │
            │ - executeWorkflow()│
            └────────┬─────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
    │Agent A│   │Agent B│   │Agent C│
    └───────┘   └───────┘   └───────┘
```

## Scalability Model

```
Single Hospital             Multi-Hospital
     │                           │
     ▼                           ▼
┌─────────┐                ┌──────────┐
│Hospital │                │  Master  │
│Automation│                │Orchestrator│
│  System │                └─────┬────┘
└─────────┘                      │
                     ┌────────────┼────────────┐
                     │            │            │
                ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
                │Hospital │  │Hospital │  │Hospital │
                │    A    │  │    B    │  │    C    │
                └─────────┘  └─────────┘  └─────────┘
```

## Message Flow Visualization

```
Time ──────────────────────────────────────────────▶

Reception     Triage      Scheduling     Lab      Billing
   │             │            │           │          │
   │─PATIENT────▶│            │           │          │
   │  ARRIVAL    │            │           │          │
   │             │            │           │          │
   │             │─NEW────────▶           │          │
   │             │ PATIENT    │           │          │
   │             │            │           │          │
   │             │─ORDER──────┼──────────▶│          │
   │             │ TESTS      │           │          │
   │             │            │           │          │
   │             │            │─ASSIGN────┤          │
   │             │            │ DOCTOR    │          │
   │             │            │           │          │
   │             │            │           │─RESULTS─▶│
   │             │            │           │          │
   │             │            │           │          │─INVOICE
   │◀────────────┴────────────┴───────────┴──────────┤
   │                    CONSULTATION COMPLETE         │
```

## Technology Stack Integration

```
┌────────────────────────────────────────────────┐
│            Next.js Application                 │
│  ┌──────────────────────────────────────────┐ │
│  │         Frontend Components              │ │
│  │  - Dashboard                             │ │
│  │  - Patient Portal                        │ │
│  │  - Doctor Portal                         │ │
│  └────────────┬─────────────────────────────┘ │
│               │                                │
│  ┌────────────▼─────────────────────────────┐ │
│  │         API Routes                        │ │
│  │  - /api/hospital-automation              │ │
│  │  - /api/appointments                     │ │
│  │  - /api/chat                             │ │
│  └────────────┬─────────────────────────────┘ │
└───────────────┼────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────┐
│     Hospital Automation System (Node.js)       │
│  ┌──────────────────────────────────────────┐ │
│  │         Orchestrator                      │ │
│  └────────────┬─────────────────────────────┘ │
│               │                                │
│  ┌────────────▼─────────────────────────────┐ │
│  │         AI Agents Layer                   │ │
│  │  [Reception][Triage][Schedule][Lab]...   │ │
│  └────────────┬─────────────────────────────┘ │
│               │                                │
│  ┌────────────▼─────────────────────────────┐ │
│  │         Message Bus                       │ │
│  └────────────┬─────────────────────────────┘ │
└───────────────┼────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────┐
│         External Services                      │
│  - Google Gemini AI                           │
│  - PostgreSQL Database                        │
│  - Prisma ORM                                 │
│  - Clerk Auth                                 │
└────────────────────────────────────────────────┘
```
