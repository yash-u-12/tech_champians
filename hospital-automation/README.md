# Hospital Automation System - AI Agent Workflows

## Overview
This system provides comprehensive automation for offline hospital operations through interconnected AI agents that coordinate to manage various aspects of hospital management.

## Architecture

### AI Agents
1. **Reception Agent** - Patient check-in, registration, and queue management
2. **Triage Agent** - Initial patient assessment and prioritization
3. **Scheduling Agent** - Appointment scheduling and resource allocation
4. **Pharmacy Agent** - Medication management and inventory
5. **Lab Agent** - Test ordering and results management
6. **Billing Agent** - Invoice generation and payment processing
7. **Emergency Agent** - Critical care coordination
8. **Inventory Agent** - Medical supplies and equipment management
9. **Staff Coordinator Agent** - Staff scheduling and task assignment
10. **Patient Monitoring Agent** - Continuous patient care tracking

### Communication Flow
```
Reception Agent → Triage Agent → Scheduling Agent
                     ↓                ↓
                Emergency Agent   Doctor Assignment
                     ↓                ↓
              Lab Agent ← Patient Monitoring Agent
                     ↓                ↓
              Pharmacy Agent → Billing Agent
                     ↓
              Inventory Agent
```

## Features

- **Multi-Agent Coordination**: Agents communicate through a message bus
- **Real-time Decision Making**: AI-powered decision trees for each agent
- **Task Automation**: Automated workflows for common hospital operations
- **Priority Management**: Emergency cases get automatic priority
- **Resource Optimization**: Intelligent allocation of rooms, staff, and equipment
- **Predictive Analytics**: Anticipate needs based on patterns
- **Audit Trail**: Complete logging of all agent actions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
# AI Model Configuration
HOSPITAL_AI_MODEL=gemini-pro
GEMINI_API_KEY=your-key

# Database
HOSPITAL_DB_URL=your-database-url

# Agent Configuration
AGENT_MAX_RETRIES=3
AGENT_TIMEOUT=30000
```

3. Run the automation system:
```bash
npm run hospital:start
```

## Usage

### Starting Individual Agents
```javascript
import { ReceptionAgent } from './agents/reception-agent';

const agent = new ReceptionAgent();
await agent.start();
```

### Running Complete Workflow
```javascript
import { PatientAdmissionWorkflow } from './workflows/patient-admission';

const workflow = new PatientAdmissionWorkflow();
await workflow.execute(patientData);
```

## Workflows

- **Patient Admission**: Complete flow from registration to room assignment
- **Emergency Response**: Fast-track critical care coordination
- **Discharge Process**: Billing, pharmacy, and exit procedures
- **Routine Checkup**: Standard outpatient visit workflow
- **Surgery Preparation**: Pre-op to post-op coordination
- **Lab Test Processing**: Order to result delivery

## Monitoring

Access the dashboard at `/hospital-automation/dashboard` to:
- View active agents status
- Monitor workflow execution
- Track hospital metrics
- Review agent communication logs

## API Integration

The system integrates with your existing Next.js application through API routes.
