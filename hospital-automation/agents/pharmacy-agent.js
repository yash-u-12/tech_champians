import { BaseAgent } from './base-agent.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class PharmacyAgent extends BaseAgent {
  constructor(config = {}) {
    super('PharmacyAgent', config);
    
    this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.ai.getGenerativeModel({ model: 'gemini-pro' });
    
    this.setupHandlers();
    
    this.inventory = new Map();
    this.prescriptions = new Map();
    this.dispensedMedications = [];
    
    this.initializeInventory();
  }

  setupHandlers() {
    this.on('PRESCRIPTION_ORDER', this.handlePrescriptionOrder.bind(this));
    this.on('PRESCRIPTION_WRITTEN', this.handlePrescriptionWritten.bind(this));
    this.on('PROCESS_PRESCRIPTION', this.handleProcessPrescription.bind(this));
    this.on('CHECK_INVENTORY', this.handleCheckInventory.bind(this));
    this.on('MEDICATION_DISPENSED', this.handleMedicationDispensed.bind(this));
    this.on('DISPENSE_MEDICATION', this.handleDispenseMedication.bind(this));
    this.on('GENERATE_PHARMACY_BILL', this.handleGenerateBill.bind(this));
  }

  initializeInventory() {
    // Sample medication inventory
    const medications = [
      { name: 'Paracetamol', quantity: 1000, unit: 'tablets', threshold: 200 },
      { name: 'Ibuprofen', quantity: 800, unit: 'tablets', threshold: 150 },
      { name: 'Amoxicillin', quantity: 500, unit: 'capsules', threshold: 100 },
      { name: 'Aspirin', quantity: 600, unit: 'tablets', threshold: 100 },
      { name: 'Metformin', quantity: 400, unit: 'tablets', threshold: 100 },
      { name: 'Lisinopril', quantity: 300, unit: 'tablets', threshold: 80 },
      { name: 'Omeprazole', quantity: 350, unit: 'capsules', threshold: 80 },
      { name: 'Insulin', quantity: 50, unit: 'vials', threshold: 10 },
      { name: 'Albuterol', quantity: 100, unit: 'inhalers', threshold: 20 },
      { name: 'Antibiotic Ointment', quantity: 200, unit: 'tubes', threshold: 50 }
    ];

    medications.forEach(med => {
      this.inventory.set(med.name.toLowerCase(), med);
    });
  }

  async handlePrescriptionOrder(payload) {
    this.log('info', 'Processing prescription order', payload);
    
    const { patientId, appointmentId, medications } = payload;

    const prescriptionId = `rx-${Date.now()}`;
    const prescription = {
      prescriptionId,
      patientId,
      appointmentId,
      medications: [],
      timestamp: new Date().toISOString(),
      status: 'processing'
    };

    // Process each medication
    for (const medication of medications) {
      const medicationInfo = await this.processMedication(medication);
      prescription.medications.push(medicationInfo);

      // Check for drug interactions
      if (prescription.medications.length > 1) {
        const interactions = await this.checkDrugInteractions(prescription.medications);
        if (interactions.length > 0) {
          prescription.warnings = interactions;
          
          // Alert monitoring agent
          await this.sendMessage('PatientMonitoringAgent', 'DRUG_INTERACTION_WARNING', {
            patientId,
            prescriptionId,
            interactions
          });
        }
      }
    }

    // Check inventory availability
    const availabilityCheck = this.checkAvailability(prescription.medications);
    prescription.availability = availabilityCheck;

    if (availabilityCheck.allAvailable) {
      prescription.status = 'ready';
      
      // Reserve medications
      this.reserveMedications(prescription.medications);
      
      // Notify billing
      await this.sendMessage('BillingAgent', 'PRESCRIPTION_READY', {
        patientId,
        prescriptionId,
        medications: prescription.medications,
        totalCost: this.calculateMedicationCost(prescription.medications)
      });
    } else {
      prescription.status = 'pending';
      prescription.unavailableItems = availabilityCheck.unavailable;
      
      // Notify inventory agent to reorder
      await this.sendMessage('InventoryAgent', 'MEDICATION_SHORTAGE', {
        items: availabilityCheck.unavailable
      });
    }

    this.prescriptions.set(prescriptionId, prescription);
    return prescription;
  }

  async processMedication(medication) {
    const { name, dosage, frequency, duration, instructions } = medication;

    // Get medication details from AI
    const details = await this.getMedicationDetails(name, dosage);

    return {
      name,
      dosage,
      frequency,
      duration,
      instructions: instructions || details.instructions,
      sideEffects: details.sideEffects,
      contraindications: details.contraindications,
      quantity: this.calculateQuantity(frequency, duration)
    };
  }

  async getMedicationDetails(medicationName, dosage) {
    // Check if AI is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-')) {
      return this.getMedicationDetailsRuleBased(medicationName);
    }

    try {
      const prompt = `Provide brief information about the medication "${medicationName}" at dosage "${dosage}".

Include:
1. Common instructions for use
2. Top 3 side effects
3. Main contraindications

Respond in JSON format with keys: instructions, sideEffects (array), contraindications (array).`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      this.log('warn', 'AI medication info failed, using fallback');
      return this.getMedicationDetailsRuleBased(medicationName);
    }

    return this.getMedicationDetailsRuleBased(medicationName);
  }

  getMedicationDetailsRuleBased(medicationName) {
    return {
      instructions: `Take ${medicationName} as prescribed by physician`,
      sideEffects: ['Nausea', 'Dizziness', 'Headache'],
      contraindications: ['Consult physician for allergies and interactions']
    };
  }

  async checkDrugInteractions(medications) {
    // Check if AI is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your-')) {
      return []; // No interactions detected without AI
    }

    try {
      const medicationList = medications.map(m => `${m.name} (${m.dosage})`).join(', ');
      
      const prompt = `Check for drug interactions between these medications: ${medicationList}

If there are any significant interactions, list them. If none, respond with "No significant interactions found."

Keep response brief and list only critical interactions.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      if (response.toLowerCase().includes('no significant')) {
        return [];
      }

      return [response];
    } catch (error) {
      this.log('warn', 'Drug interaction check failed');
      return [];
    }
  }

  checkAvailability(medications) {
    const unavailable = [];
    let allAvailable = true;

    for (const medication of medications) {
      const inventoryItem = this.inventory.get(medication.name.toLowerCase());
      
      if (!inventoryItem || inventoryItem.quantity < medication.quantity) {
        allAvailable = false;
        unavailable.push({
          name: medication.name,
          requested: medication.quantity,
          available: inventoryItem?.quantity || 0
        });
      }
    }

    return { allAvailable, unavailable };
  }

  reserveMedications(medications) {
    medications.forEach(medication => {
      const inventoryItem = this.inventory.get(medication.name.toLowerCase());
      if (inventoryItem) {
        inventoryItem.quantity -= medication.quantity;
        
        // Check if below threshold
        if (inventoryItem.quantity <= inventoryItem.threshold) {
          this.sendMessage('InventoryAgent', 'REORDER_NEEDED', {
            medication: inventoryItem.name,
            currentQuantity: inventoryItem.quantity,
            threshold: inventoryItem.threshold
          });
        }
      }
    });
  }

  calculateQuantity(frequency, duration) {
    // frequency: "2x daily", "3x daily", "once daily"
    // duration: "7 days", "14 days", "30 days"
    
    const freqMatch = frequency.match(/(\d+)/);
    const durationMatch = duration.match(/(\d+)/);
    
    const timesPerDay = freqMatch ? parseInt(freqMatch[1]) : 1;
    const days = durationMatch ? parseInt(durationMatch[1]) : 7;
    
    return timesPerDay * days;
  }

  calculateMedicationCost(medications) {
    // Simplified cost calculation
    return medications.reduce((total, med) => {
      return total + (med.quantity * 2.5); // $2.5 per unit average
    }, 0);
  }

  async handleCheckInventory(payload) {
    const { medicationName } = payload;
    
    if (medicationName) {
      return this.inventory.get(medicationName.toLowerCase());
    }
    
    return Array.from(this.inventory.values());
  }

  async handleMedicationDispensed(payload) {
    this.log('info', 'Medication dispensed', payload);
    
    const { prescriptionId, patientId } = payload;
    const prescription = this.prescriptions.get(prescriptionId);
    
    if (prescription) {
      prescription.status = 'dispensed';
      prescription.dispensedTime = new Date().toISOString();
      
      this.dispensedMedications.push({
        prescriptionId,
        patientId,
        timestamp: new Date().toISOString()
      });

      // Notify patient monitoring
      await this.sendMessage('PatientMonitoringAgent', 'MEDICATION_DISPENSED', {
        patientId,
        prescriptionId,
        medications: prescription.medications
      });
    }
  }

  // New handlers for interface integration
  async handlePrescriptionWritten(payload) {
    this.log('info', 'Doctor prescription received', payload);
    
    const { appointmentId, patientId, prescription, diagnosis, notes } = payload;
    
    // Process the prescription
    await this.handlePrescriptionOrder({
      appointmentId,
      patientId,
      medications: prescription
    });
  }

  async handleProcessPrescription(payload) {
    this.log('info', 'Processing prescription from API', payload);
    
    const { orderId, appointmentId, prescription } = payload;
    
    // Get medication details and check interactions
    const processedMeds = [];
    let totalAmount = 0;

    for (const med of prescription) {
      const details = await this.getMedicationDetailsRuleBased(med.name);
      if (details) {
        const medWithPrice = {
          ...med,
          price: details.price || 10.0,
          quantity: details.quantity || 1
        };
        processedMeds.push(medWithPrice);
        totalAmount += medWithPrice.price;
      }
    }

    // Check drug interactions
    const interactions = this.checkDrugInteractions(prescription.map(m => m.name));

    // Send processed prescription info
    await this.sendMessage('ALL', 'PRESCRIPTION_PROCESSED', {
      orderId,
      appointmentId,
      medications: processedMeds,
      interactions,
      totalAmount
    });
  }

  async handleDispenseMedication(payload) {
    this.log('info', 'Dispensing medication from interface', payload);
    
    const { orderId, pharmacistId } = payload;
    
    // Mark as dispensed in system
    await this.sendMessage('ALL', 'MEDICATION_DISPENSED_FROM_PHARMACY', {
      orderId,
      pharmacistId,
      timestamp: new Date().toISOString()
    });

    // Update inventory (deduct quantities)
    // In a real system, this would update the database
  }

  async handleGenerateBill(payload) {
    this.log('info', 'Generating pharmacy bill', payload);
    
    const { orderId } = payload;
    
    // Send to billing agent
    await this.sendMessage('BillingAgent', 'GENERATE_PHARMACY_BILL', {
      orderId,
      timestamp: new Date().toISOString()
    });
  }

  getInventoryStatus() {
    const lowStock = [];
    const outOfStock = [];
    
    for (const [name, item] of this.inventory.entries()) {
      if (item.quantity === 0) {
        outOfStock.push(item);
      } else if (item.quantity <= item.threshold) {
        lowStock.push(item);
      }
    }

    return {
      totalItems: this.inventory.size,
      lowStock,
      outOfStock,
      prescriptionsProcessed: this.prescriptions.size,
      medicationsDispensed: this.dispensedMedications.length
    };
  }
}

export default PharmacyAgent;
