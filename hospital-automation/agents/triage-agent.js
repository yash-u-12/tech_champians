import { BaseAgent } from './base-agent.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class TriageAgent extends BaseAgent {
  constructor(config = {}) {
    super('TriageAgent', config);
    
    this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.ai.getGenerativeModel({ model: 'gemini-pro' });
    
    this.setupHandlers();
    this.triageQueue = [];
    this.assessments = new Map();
  }

  setupHandlers() {
    this.on('NEW_PATIENT', this.handleNewPatient.bind(this));
    this.on('VITALS_RECORDED', this.handleVitalsRecorded.bind(this));
  }

  async handleNewPatient(payload) {
    this.log('info', 'New patient for triage', payload);
    
    const { patientId, name, reason, urgency } = payload;
    
    this.triageQueue.push(patientId);
    
    // Perform initial assessment
    const assessment = await this.performTriage({
      patientId,
      name,
      reason,
      urgency,
      timestamp: new Date().toISOString()
    });

    this.assessments.set(patientId, assessment);

    // Determine required tests
    const requiredTests = await this.determineRequiredTests(assessment);
    assessment.requiredTests = requiredTests;

    // Send to lab agent if tests needed
    if (requiredTests.length > 0) {
      await this.sendMessage('LabAgent', 'ORDER_TESTS', {
        patientId,
        tests: requiredTests,
        urgency: assessment.priority
      });
    }

    // Request vital signs monitoring
    await this.sendMessage('PatientMonitoringAgent', 'START_MONITORING', {
      patientId,
      priority: assessment.priority,
      vitalSigns: ['temperature', 'blood_pressure', 'heart_rate', 'oxygen_saturation']
    });

    // Determine specialty needed
    const specialty = await this.determineSpecialty(assessment);
    assessment.recommendedSpecialty = specialty;

    // Send to scheduling for doctor assignment
    await this.sendMessage('SchedulingAgent', 'ASSIGN_DOCTOR', {
      patientId,
      specialty,
      priority: assessment.priority,
      estimatedConsultationTime: assessment.estimatedTime
    });

    return assessment;
  }

  async handleVitalsRecorded(payload) {
    this.log('info', 'Vitals recorded', payload);
    
    const { patientId, vitals } = payload;
    const assessment = this.assessments.get(patientId);
    
    if (assessment) {
      assessment.vitals = vitals;
      
      // Re-evaluate priority based on vitals
      const updatedPriority = await this.evaluateVitals(vitals, assessment);
      
      if (updatedPriority !== assessment.priority) {
        assessment.priority = updatedPriority;
        
        // Notify scheduling of priority change
        await this.sendMessage('SchedulingAgent', 'UPDATE_PRIORITY', {
          patientId,
          newPriority: updatedPriority
        });
      }
    }
  }

  async performTriage(patientData) {
    const { patientId, name, reason, urgency } = patientData;

    // Check if AI is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-')) {
      this.log('warn', 'AI not configured, using rule-based triage');
      return this.performTriageRuleBased(patientData);
    }

    try {
      const prompt = `As a medical triage AI, analyze this patient case and provide a structured assessment.

Patient Information:
- Name: ${name}
- Chief Complaint: ${reason}
- Initial Urgency: ${urgency}

Provide a JSON response with:
1. priority: (routine/urgent/critical)
2. estimatedTime: (consultation time in minutes)
3. symptoms: (list of key symptoms)
4. possibleConditions: (list of potential diagnoses)
5. immediateActions: (list of immediate care steps)

Response should be valid JSON only.`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const assessment = JSON.parse(jsonMatch[0]);
        return {
          patientId,
          ...assessment,
          assessmentTime: new Date().toISOString()
        };
      }
    } catch (error) {
      this.log('warn', 'AI triage failed, using rule-based fallback');
      return this.performTriageRuleBased(patientData);
    }

    // Fallback assessment
    return this.performTriageRuleBased(patientData);
  }

  performTriageRuleBased(patientData) {
    const { patientId, reason, urgency } = patientData;
    
    return {
      patientId,
      priority: urgency === 'critical' ? 'critical' : urgency === 'high' ? 'urgent' : 'routine',
      estimatedTime: urgency === 'critical' ? 15 : 30,
      symptoms: [reason],
      possibleConditions: ['Requires physician evaluation'],
      immediateActions: ['Standard patient intake', 'Vital signs monitoring'],
      assessmentTime: new Date().toISOString()
    };
  }

  async determineRequiredTests(assessment) {
    // Check if AI is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-')) {
      return this.determineRequiredTestsRuleBased(assessment);
    }

    try {
      const prompt = `Based on this patient assessment, what medical tests should be ordered?

Symptoms: ${assessment.symptoms?.join(', ')}
Possible Conditions: ${assessment.possibleConditions?.join(', ')}

List only essential tests, separated by commas. Common tests include: blood_test, urine_test, x_ray, ecg, ultrasound, ct_scan, mri.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().toLowerCase();
      
      const tests = response
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .slice(0, 5); // Limit to 5 tests
      
      return tests.length > 0 ? tests : this.determineRequiredTestsRuleBased(assessment);
    } catch (error) {
      this.log('warn', 'AI test determination failed, using rule-based fallback');
      return this.determineRequiredTestsRuleBased(assessment);
    }
  }

  determineRequiredTestsRuleBased(assessment) {
    const tests = [];
    const symptoms = assessment.symptoms?.join(' ').toLowerCase() || '';
    
    // Basic blood test for most cases
    if (symptoms.match(/fever|infection|weakness|fatigue/)) {
      tests.push('blood_test');
    }
    
    // ECG for heart-related
    if (symptoms.match(/chest|heart|palpitation/)) {
      tests.push('ecg');
    }
    
    // X-ray for respiratory or bone issues
    if (symptoms.match(/cough|breathing|fracture|bone/)) {
      tests.push('x_ray');
    }
    
    // Urine test for kidney/urinary issues
    if (symptoms.match(/urinary|kidney|bladder/)) {
      tests.push('urine_test');
    }
    
    return tests.length > 0 ? tests : ['blood_test']; // Default
  }

  async determineSpecialty(assessment) {
    // Check if AI is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-')) {
      return this.determineSpecialtyRuleBased(assessment);
    }

    try {
      const prompt = `Based on this assessment, which medical specialty should handle this case?

Symptoms: ${assessment.symptoms?.join(', ')}
Possible Conditions: ${assessment.possibleConditions?.join(', ')}

Choose ONE from: general, cardiology, neurology, orthopedic, pediatrics, dermatology, emergency, internal_medicine.`;

      const result = await this.model.generateContent(prompt);
      const specialty = result.response.text().toLowerCase().trim().replace(/[^a-z_]/g, '');
      
      const validSpecialties = ['general', 'cardiology', 'neurology', 'orthopedic', 'pediatrics', 'dermatology', 'emergency', 'internal_medicine'];
      
      return validSpecialties.includes(specialty) ? specialty : this.determineSpecialtyRuleBased(assessment);
    } catch (error) {
      this.log('warn', 'AI specialty determination failed, using rule-based fallback');
      return this.determineSpecialtyRuleBased(assessment);
    }
  }

  determineSpecialtyRuleBased(assessment) {
    const symptoms = assessment.symptoms?.join(' ').toLowerCase() || '';
    const priority = assessment.priority || 'routine';
    
    if (priority === 'critical') return 'emergency';
    if (symptoms.match(/heart|chest|cardiac/)) return 'cardiology';
    if (symptoms.match(/brain|head|nerve|seizure/)) return 'neurology';
    if (symptoms.match(/bone|joint|fracture|sprain/)) return 'orthopedic';
    if (symptoms.match(/skin|rash|acne/)) return 'dermatology';
    
    return 'general';
  }

  async evaluateVitals(vitals, assessment) {
    // Critical vital signs
    const isCritical = 
      vitals.temperature > 39.5 ||
      vitals.temperature < 35 ||
      vitals.heart_rate > 120 ||
      vitals.heart_rate < 50 ||
      vitals.blood_pressure_systolic > 180 ||
      vitals.blood_pressure_systolic < 90 ||
      vitals.oxygen_saturation < 92;

    if (isCritical) {
      return 'critical';
    }

    const isUrgent = 
      vitals.temperature > 38.5 ||
      vitals.heart_rate > 100 ||
      vitals.blood_pressure_systolic > 140 ||
      vitals.oxygen_saturation < 95;

    if (isUrgent) {
      return 'urgent';
    }

    return 'routine';
  }

  getTriageQueue() {
    return this.triageQueue.map(id => this.assessments.get(id));
  }
}

export default TriageAgent;
