import { BaseAgent } from './base-agent.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class ReceptionAgent extends BaseAgent {
  constructor(config = {}) {
    super('ReceptionAgent', config);
    
    // Initialize AI model
    this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.ai.getGenerativeModel({ model: 'gemini-pro' });
    
    // Register message handlers
    this.setupHandlers();
    
    // Patient queue
    this.patientQueue = [];
    this.registeredPatients = new Map();
  }

  setupHandlers() {
    this.on('PATIENT_ARRIVAL', this.handlePatientArrival.bind(this));
    this.on('REGISTRATION_COMPLETE', this.handleRegistrationComplete.bind(this));
    this.on('CHECK_QUEUE', this.handleCheckQueue.bind(this));
  }

  async handlePatientArrival(payload) {
    this.log('info', 'Patient arrived', payload);
    
    const { patientId, name, reason, isEmergency } = payload;

    // Register patient
    const registrationData = {
      patientId,
      name,
      reason,
      isEmergency,
      arrivalTime: new Date().toISOString(),
      status: 'waiting'
    };

    this.registeredPatients.set(patientId, registrationData);
    this.patientQueue.push(patientId);

    // Use AI to determine urgency if not marked as emergency
    if (!isEmergency) {
      const urgency = await this.assessUrgency(reason);
      registrationData.urgency = urgency;
    } else {
      registrationData.urgency = 'critical';
    }

    // Send to appropriate next agent
    if (isEmergency || registrationData.urgency === 'critical') {
      await this.sendMessage('EmergencyAgent', 'EMERGENCY_PATIENT', registrationData);
    } else {
      await this.sendMessage('TriageAgent', 'NEW_PATIENT', registrationData);
    }

    // Notify scheduling
    await this.sendMessage('SchedulingAgent', 'PATIENT_REGISTERED', registrationData);

    return registrationData;
  }

  async handleRegistrationComplete(payload) {
    this.log('info', 'Registration completed', payload);
    const { patientId } = payload;
    
    const patient = this.registeredPatients.get(patientId);
    if (patient) {
      patient.status = 'registered';
      patient.registrationCompleteTime = new Date().toISOString();
    }
  }

  async handleCheckQueue(payload) {
    return {
      queueLength: this.patientQueue.length,
      queue: this.patientQueue.map(id => this.registeredPatients.get(id))
    };
  }

  async assessUrgency(reason) {
    // Check if AI is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-')) {
      this.log('warn', 'AI not configured, using rule-based urgency assessment');
      return this.assessUrgencyRuleBased(reason);
    }

    try {
      const prompt = `As a medical triage AI, assess the urgency of this patient concern on a scale of low/medium/high/critical.
      
Patient Reason: ${reason}

Response should be ONLY one word: low, medium, high, or critical.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().toLowerCase().trim();
      
      if (['low', 'medium', 'high', 'critical'].includes(response)) {
        return response;
      }
      return 'medium'; // Default
    } catch (error) {
      this.log('warn', 'AI assessment failed, using rule-based fallback');
      return this.assessUrgencyRuleBased(reason);
    }
  }

  assessUrgencyRuleBased(reason) {
    const reasonLower = reason.toLowerCase();
    
    // Critical keywords
    if (reasonLower.match(/chest pain|heart attack|severe bleeding|unconscious|stroke|difficulty breathing|seizure/)) {
      return 'critical';
    }
    
    // High urgency keywords
    if (reasonLower.match(/fever|pain|injury|vomiting|headache|severe/)) {
      return 'high';
    }
    
    // Medium urgency
    if (reasonLower.match(/cough|cold|checkup|follow.?up/)) {
      return 'medium';
    }
    
    return 'medium'; // Default
  }

  // Public API for patient check-in
  async checkInPatient(patientData) {
    return await this.handlePatientArrival(patientData);
  }

  // Get current queue status
  getQueueStatus() {
    return {
      total: this.patientQueue.length,
      patients: this.patientQueue.map(id => {
        const patient = this.registeredPatients.get(id);
        return {
          id: patient.patientId,
          name: patient.name,
          urgency: patient.urgency,
          waitTime: this.calculateWaitTime(patient.arrivalTime)
        };
      })
    };
  }

  calculateWaitTime(arrivalTime) {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diffMs = now - arrival;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  }
}

export default ReceptionAgent;
