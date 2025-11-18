# Hospital Automation System - Usage Guide

## Quick Start

### 1. Installation

```bash
cd hospital-automation
npm install
```

### 2. Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Update the Gemini API key in `.env.local`:
```
GEMINI_API_KEY=your-actual-api-key
```

### 3. Running the System

**Standalone Mode:**
```bash
npm start
```

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Test Mode:**
```bash
npm test
```

## System Architecture

### AI Agents

#### 1. **Reception Agent**
- **Purpose**: Patient check-in and initial registration
- **Key Functions**:
  - Register new patients
  - Manage patient queue
  - Assess initial urgency using AI
  - Route to appropriate next agent

**Example Usage:**
```javascript
const receptionAgent = orchestrator.getAgent('ReceptionAgent');
await receptionAgent.checkInPatient({
  patientId: 'P001',
  name: 'John Doe',
  reason: 'Fever and headache',
  isEmergency: false
});
```

#### 2. **Triage Agent**
- **Purpose**: Medical assessment and prioritization
- **Key Functions**:
  - Perform AI-powered triage assessment
  - Determine required medical tests
  - Identify appropriate medical specialty
  - Evaluate vital signs

**AI Capabilities:**
- Symptom analysis
- Priority determination
- Test recommendation
- Specialty matching

#### 3. **Scheduling Agent**
- **Purpose**: Resource allocation and appointment management
- **Key Functions**:
  - Assign doctors based on specialty and availability
  - Allocate examination rooms
  - Manage waiting lists
  - Handle priority changes

**Resource Management:**
- 2 doctors per specialty (configurable)
- 20 rooms (5 emergency, 10 consultation, 5 observation)
- Priority-based scheduling
- Real-time resource tracking

#### 4. **Lab Agent**
- **Purpose**: Medical testing and results management
- **Key Functions**:
  - Process test orders
  - Manage lab equipment
  - Generate test results
  - Identify abnormal findings

**Supported Tests:**
- Blood tests
- Urine tests
- X-rays
- CT scans
- MRI
- Ultrasound
- ECG

#### 5. **Pharmacy Agent**
- **Purpose**: Medication management and dispensing
- **Key Functions**:
  - Process prescriptions
  - Check drug interactions using AI
  - Manage inventory
  - Alert on low stock

**AI Features:**
- Drug interaction checking
- Medication information lookup
- Side effect warnings
- Contraindication alerts

#### 6. **Billing Agent**
- **Purpose**: Financial management and invoicing
- **Key Functions**:
  - Generate invoices
  - Track payments
  - Calculate charges
  - Financial reporting

**Pricing Structure:**
- Consultation fees by specialty
- Test charges
- Medication costs
- Room charges

## Workflows

### Patient Admission Workflow

Complete flow from check-in to doctor assignment:

```javascript
await orchestrator.executeWorkflow('patient-admission', {
  patientId: 'P001',
  name: 'John Doe',
  reason: 'Persistent cough',
  isEmergency: false
});
```

**Steps:**
1. Reception: Patient registration
2. Triage: Medical assessment
3. Lab: Order necessary tests
4. Scheduling: Assign doctor and room
5. Monitoring: Track patient status

### Emergency Response Workflow

Fast-track for critical cases:

```javascript
await orchestrator.executeWorkflow('emergency-response', {
  patientId: 'P002',
  name: 'Jane Smith',
  reason: 'Chest pain',
  isEmergency: true
});
```

**Features:**
- Immediate priority escalation
- Emergency room allocation
- Critical care coordination
- Rapid resource mobilization

### Discharge Workflow

Complete patient discharge process:

```javascript
await orchestrator.executeWorkflow('discharge', {
  patientId: 'P001',
  appointmentId: 'apt-123',
  prescription: [
    { name: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', duration: '7 days' }
  ],
  followUp: { days: 7, specialty: 'general' }
});
```

**Steps:**
1. Consultation completion
2. Prescription processing
3. Invoice generation
4. Payment processing
5. Follow-up scheduling

## API Integration

### REST API Endpoints

**Get System Status:**
```http
GET /api/hospital-automation?type=status
```

**Get Hospital Metrics:**
```http
GET /api/hospital-automation?type=metrics
```

**Get Agent Status:**
```http
GET /api/hospital-automation?type=agents&agent=ReceptionAgent
```

**Execute Workflow:**
```http
POST /api/hospital-automation
Content-Type: application/json

{
  "action": "execute-workflow",
  "workflow": "patient-admission",
  "data": {
    "patientId": "P001",
    "name": "John Doe",
    "reason": "Checkup"
  }
}
```

**Patient Check-In:**
```http
POST /api/hospital-automation
Content-Type: application/json

{
  "action": "patient-checkin",
  "data": {
    "patientId": "P001",
    "name": "John Doe",
    "reason": "Fever",
    "isEmergency": false
  }
}
```

## Dashboard Access

Access the real-time dashboard at:
```
http://localhost:3001/hospital-automation/dashboard
```

**Dashboard Features:**
- Real-time agent status
- Patient queue visualization
- Resource utilization
- Financial metrics
- Pharmacy inventory
- Lab status

## Monitoring and Logging

### View Communication Logs

```javascript
const messages = orchestrator.getCommunicationLog({
  from: 'ReceptionAgent',
  to: 'TriageAgent',
  type: 'NEW_PATIENT'
});
```

### Get Hospital Metrics

```javascript
const metrics = orchestrator.getHospitalMetrics();
console.log(metrics);
```

### Agent-Specific Status

```javascript
const status = orchestrator.getAgentStatus('SchedulingAgent');
console.log(status.resources); // Doctor and room availability
```

## Customization

### Adding New Agents

1. Create new agent class extending `BaseAgent`:
```javascript
import { BaseAgent } from './base-agent.js';

export class CustomAgent extends BaseAgent {
  constructor(config = {}) {
    super('CustomAgent', config);
    this.setupHandlers();
  }

  setupHandlers() {
    this.on('CUSTOM_MESSAGE', this.handleCustom.bind(this));
  }

  async handleCustom(payload) {
    // Your logic here
  }
}
```

2. Register in orchestrator:
```javascript
this.agents.set('CustomAgent', new CustomAgent());
```

### Modifying Workflows

Create custom workflows in the orchestrator:

```javascript
async customWorkflow(data) {
  // Step 1
  await this.sendMessage('AgentA', 'ACTION', data);
  
  // Wait for condition
  await this.waitForCondition(() => {
    // Check condition
    return true;
  }, 10000);
  
  // Step 2
  await this.sendMessage('AgentB', 'NEXT_ACTION', data);
  
  return { success: true };
}
```

## Best Practices

1. **Error Handling**: All workflows include proper error handling
2. **Timeout Management**: Configure appropriate timeouts for workflows
3. **Resource Monitoring**: Regularly check resource availability
4. **Inventory Management**: Set up automatic reorder alerts
5. **Priority Management**: Use priority levels appropriately
6. **Communication Logging**: Enable logging for debugging

## Troubleshooting

### Agent Not Responding
- Check agent status: `orchestrator.getAgentStatus('AgentName')`
- Review message queue length
- Check for error messages in logs

### Workflow Timeout
- Increase timeout in workflow configuration
- Check if dependent agents are running
- Review resource availability

### Resource Unavailable
- Check scheduling agent status
- Review room and doctor allocation
- Consider adding more resources in configuration

## Performance Optimization

1. **Message Queue**: Monitor queue lengths
2. **AI Calls**: Cache AI responses when possible
3. **Resource Pooling**: Optimize doctor/room allocation
4. **Batch Processing**: Process similar requests together

## Security Considerations

1. **API Authentication**: Add authentication to API endpoints
2. **Data Validation**: Validate all input data
3. **Access Control**: Implement role-based access
4. **Audit Logging**: Enable comprehensive audit trails

## Integration with Main App

The hospital automation system integrates seamlessly with your existing MedSync application:

1. **Shared Database**: Use the same Prisma database
2. **User Authentication**: Integrate with Clerk
3. **Real-time Updates**: Use webhooks for notifications
4. **Unified Dashboard**: Combine with existing admin panel

## Support and Maintenance

For issues or questions:
1. Check the troubleshooting guide
2. Review communication logs
3. Monitor system metrics
4. Test workflows in isolation
