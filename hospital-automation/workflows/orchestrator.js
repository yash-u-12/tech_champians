import { MessageBus } from '../agents/message-bus.js';
import { ReceptionAgent } from '../agents/reception-agent.js';
import { TriageAgent } from '../agents/triage-agent.js';
import { SchedulingAgent } from '../agents/scheduling-agent.js';
import { PharmacyAgent } from '../agents/pharmacy-agent.js';
import { LabAgent } from '../agents/lab-agent.js';
import { BillingAgent } from '../agents/billing-agent.js';

export class HospitalOrchestrator {
  constructor() {
    this.agents = new Map();
    this.messageBus = MessageBus.getInstance();
    this.isRunning = false;
  }

  async initialize() {
    console.log('🏥 Initializing Hospital Automation System...');

    // Create all agents
    this.agents.set('ReceptionAgent', new ReceptionAgent());
    this.agents.set('TriageAgent', new TriageAgent());
    this.agents.set('SchedulingAgent', new SchedulingAgent());
    this.agents.set('PharmacyAgent', new PharmacyAgent());
    this.agents.set('LabAgent', new LabAgent());
    this.agents.set('BillingAgent', new BillingAgent());

    // Subscribe agents to message bus
    for (const [name, agent] of this.agents.entries()) {
      this.messageBus.subscribe(
        name,
        ['ALL'], // Subscribe to all message types for now
        (message) => {
          if (message.to === name) {
            agent.receiveMessage(message);
          }
        }
      );
    }

    // Start all agents
    for (const agent of this.agents.values()) {
      await agent.start();
    }

    this.isRunning = true;
    console.log('✅ Hospital Automation System initialized');
    console.log(`📊 Active Agents: ${this.agents.size}`);
  }

  async shutdown() {
    console.log('🛑 Shutting down Hospital Automation System...');

    for (const agent of this.agents.values()) {
      await agent.stop();
    }

    this.isRunning = false;
    console.log('✅ System shut down successfully');
  }

  getAgent(agentName) {
    return this.agents.get(agentName);
  }

  getAllAgents() {
    return Array.from(this.agents.keys());
  }

  getSystemStatus() {
    const agentStatuses = {};
    
    for (const [name, agent] of this.agents.entries()) {
      agentStatuses[name] = agent.getStatus();
    }

    return {
      isRunning: this.isRunning,
      activeAgents: this.agents.size,
      agents: agentStatuses,
      messageHistory: this.messageBus.getHistory().length
    };
  }

  getAgentStatus(agentName) {
    const agent = this.agents.get(agentName);
    if (!agent) return null;

    let detailedStatus = agent.getStatus();

    // Add agent-specific status
    if (agentName === 'ReceptionAgent') {
      detailedStatus.queue = agent.getQueueStatus();
    } else if (agentName === 'SchedulingAgent') {
      detailedStatus.resources = agent.getResourceStatus();
    } else if (agentName === 'PharmacyAgent') {
      detailedStatus.inventory = agent.getInventoryStatus();
    } else if (agentName === 'LabAgent') {
      detailedStatus.lab = agent.getLabStatus();
    } else if (agentName === 'BillingAgent') {
      detailedStatus.financial = agent.getFinancialSummary();
    }

    return detailedStatus;
  }

  getCommunicationLog(filters = {}) {
    return this.messageBus.getHistory(filters);
  }

  async executeWorkflow(workflowName, data) {
    console.log(`🔄 Executing workflow: ${workflowName}`);
    
    const workflows = {
      'patient-admission': this.patientAdmissionWorkflow.bind(this),
      'emergency-response': this.emergencyResponseWorkflow.bind(this),
      'routine-checkup': this.routineCheckupWorkflow.bind(this),
      'discharge': this.dischargeWorkflow.bind(this)
    };

    const workflow = workflows[workflowName];
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    return await workflow(data);
  }

  async patientAdmissionWorkflow(patientData) {
    console.log('📋 Starting Patient Admission Workflow...');
    
    const receptionAgent = this.getAgent('ReceptionAgent');
    
    // Step 1: Check-in patient
    const registration = await receptionAgent.checkInPatient(patientData);
    console.log(`✅ Patient registered: ${registration.patientId}`);

    // Wait for triage (automated)
    await this.waitForCondition(() => {
      const triageAgent = this.getAgent('TriageAgent');
      return triageAgent.assessments.has(patientData.patientId);
    }, 10000);

    console.log('✅ Triage completed');

    // Wait for doctor assignment
    await this.waitForCondition(() => {
      const schedulingAgent = this.getAgent('SchedulingAgent');
      return Array.from(schedulingAgent.appointments.values())
        .some(apt => apt.patientId === patientData.patientId);
    }, 15000);

    console.log('✅ Doctor assigned');
    console.log('✅ Patient Admission Workflow completed');

    return {
      success: true,
      patientId: patientData.patientId,
      status: 'admitted'
    };
  }

  async emergencyResponseWorkflow(emergencyData) {
    console.log('🚨 Starting Emergency Response Workflow...');
    
    const receptionAgent = this.getAgent('ReceptionAgent');
    
    // Fast-track emergency patient
    const registration = await receptionAgent.checkInPatient({
      ...emergencyData,
      isEmergency: true
    });

    console.log('✅ Emergency patient registered with priority');
    console.log('✅ Emergency Response Workflow completed');

    return {
      success: true,
      patientId: registration.patientId,
      priority: 'critical'
    };
  }

  async routineCheckupWorkflow(patientData) {
    console.log('📋 Starting Routine Checkup Workflow...');
    
    return await this.patientAdmissionWorkflow(patientData);
  }

  async dischargeWorkflow(dischargeData) {
    console.log('👋 Starting Patient Discharge Workflow...');
    
    const { patientId, appointmentId, prescription, followUp } = dischargeData;
    
    // Mark consultation complete
    const schedulingAgent = this.getAgent('SchedulingAgent');
    await schedulingAgent.receiveMessage({
      type: 'CONSULTATION_COMPLETE',
      payload: { appointmentId, patientId, prescription, followUp },
      from: 'system'
    });

    // Wait for billing
    await this.waitForCondition(() => {
      const billingAgent = this.getAgent('BillingAgent');
      const invoice = Array.from(billingAgent.invoices.values())
        .find(inv => inv.patientId === patientId);
      return invoice && invoice.status === 'paid';
    }, 20000, false); // Don't throw error if not paid

    console.log('✅ Patient Discharge Workflow completed');

    return {
      success: true,
      patientId,
      status: 'discharged'
    };
  }

  async waitForCondition(condition, timeout = 10000, throwOnTimeout = true) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (throwOnTimeout) {
      throw new Error('Workflow step timeout');
    }
    return false;
  }

  // Analytics and Reporting
  getHospitalMetrics() {
    const receptionAgent = this.getAgent('ReceptionAgent');
    const schedulingAgent = this.getAgent('SchedulingAgent');
    const billingAgent = this.getAgent('BillingAgent');
    const pharmacyAgent = this.getAgent('PharmacyAgent');
    const labAgent = this.getAgent('LabAgent');

    return {
      patients: {
        waiting: receptionAgent.getQueueStatus().total,
        inConsultation: schedulingAgent.getResourceStatus().activeAppointments
      },
      resources: schedulingAgent.getResourceStatus(),
      financial: billingAgent.getFinancialSummary(),
      pharmacy: pharmacyAgent.getInventoryStatus(),
      laboratory: labAgent.getLabStatus(),
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
let orchestratorInstance = null;

export function getOrchestrator() {
  if (!orchestratorInstance) {
    orchestratorInstance = new HospitalOrchestrator();
  }
  return orchestratorInstance;
}

export default HospitalOrchestrator;
