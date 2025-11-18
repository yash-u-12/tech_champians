import { BaseAgent } from './base-agent.js';

export class LabAgent extends BaseAgent {
  constructor(config = {}) {
    super('LabAgent', config);
    
    this.setupHandlers();
    
    this.testOrders = new Map();
    this.testResults = new Map();
    this.equipment = new Map();
    
    this.initializeEquipment();
  }

  setupHandlers() {
    this.on('ORDER_TESTS', this.handleOrderTests.bind(this));
    this.on('TEST_COMPLETE', this.handleTestComplete.bind(this));
    this.on('REQUEST_RESULTS', this.handleRequestResults.bind(this));
  }

  initializeEquipment() {
    const equipment = [
      { id: 'hematology-1', type: 'blood_analyzer', available: true, status: 'operational' },
      { id: 'chemistry-1', type: 'chemistry_analyzer', available: true, status: 'operational' },
      { id: 'xray-1', type: 'x_ray', available: true, status: 'operational' },
      { id: 'xray-2', type: 'x_ray', available: true, status: 'operational' },
      { id: 'ct-1', type: 'ct_scan', available: true, status: 'operational' },
      { id: 'mri-1', type: 'mri', available: true, status: 'operational' },
      { id: 'ultrasound-1', type: 'ultrasound', available: true, status: 'operational' },
      { id: 'ultrasound-2', type: 'ultrasound', available: true, status: 'operational' },
      { id: 'ecg-1', type: 'ecg', available: true, status: 'operational' },
      { id: 'ecg-2', type: 'ecg', available: true, status: 'operational' }
    ];

    equipment.forEach(eq => {
      this.equipment.set(eq.id, eq);
    });
  }

  async handleOrderTests(payload) {
    this.log('info', 'Processing test orders', payload);
    
    const { patientId, tests, urgency } = payload;
    const orderId = `lab-${Date.now()}`;

    const testOrder = {
      orderId,
      patientId,
      tests: [],
      urgency,
      orderTime: new Date().toISOString(),
      status: 'pending'
    };

    // Process each test
    for (const testType of tests) {
      const testInfo = await this.scheduleTest(testType, patientId, urgency);
      testOrder.tests.push(testInfo);
    }

    this.testOrders.set(orderId, testOrder);

    // Simulate test processing
    setTimeout(() => {
      this.processTests(orderId);
    }, this.getProcessingTime(urgency));

    // Notify monitoring agent
    await this.sendMessage('PatientMonitoringAgent', 'TESTS_ORDERED', {
      patientId,
      orderId,
      tests: testOrder.tests,
      estimatedCompletion: new Date(Date.now() + this.getProcessingTime(urgency)).toISOString()
    });

    return testOrder;
  }

  async scheduleTest(testType, patientId, urgency) {
    const testTypeMap = {
      'blood_test': 'blood_analyzer',
      'urine_test': 'chemistry_analyzer',
      'x_ray': 'x_ray',
      'ct_scan': 'ct_scan',
      'mri': 'mri',
      'ultrasound': 'ultrasound',
      'ecg': 'ecg'
    };

    const equipmentType = testTypeMap[testType] || 'blood_analyzer';
    const equipment = this.findAvailableEquipment(equipmentType);

    const testInfo = {
      testType,
      equipmentId: equipment?.id || 'pending',
      status: equipment ? 'scheduled' : 'waiting_for_equipment',
      scheduledTime: new Date().toISOString(),
      urgency
    };

    if (equipment) {
      equipment.available = false;
      equipment.currentPatient = patientId;
    }

    return testInfo;
  }

  findAvailableEquipment(type) {
    return Array.from(this.equipment.values())
      .find(eq => eq.type === type && eq.available && eq.status === 'operational');
  }

  async processTests(orderId) {
    const order = this.testOrders.get(orderId);
    if (!order) return;

    order.status = 'processing';

    // Generate test results
    const results = {
      orderId,
      patientId: order.patientId,
      tests: [],
      completionTime: new Date().toISOString()
    };

    for (const test of order.tests) {
      const result = this.generateTestResult(test.testType);
      results.tests.push(result);

      // Free equipment
      const equipment = this.equipment.get(test.equipmentId);
      if (equipment) {
        equipment.available = true;
        equipment.currentPatient = null;
      }
    }

    order.status = 'completed';
    this.testResults.set(orderId, results);

    // Send results to monitoring agent
    await this.sendMessage('PatientMonitoringAgent', 'TEST_RESULTS_READY', {
      patientId: order.patientId,
      orderId,
      results
    });

    // Check for abnormal results
    const abnormalResults = results.tests.filter(t => t.abnormal);
    if (abnormalResults.length > 0) {
      await this.sendMessage('PatientMonitoringAgent', 'ABNORMAL_RESULTS', {
        patientId: order.patientId,
        orderId,
        abnormalTests: abnormalResults
      });
    }
  }

  generateTestResult(testType) {
    // Generate realistic test results
    const results = {
      blood_test: {
        hemoglobin: this.randomValue(12, 16, 'g/dL'),
        wbc: this.randomValue(4000, 11000, 'cells/μL'),
        platelets: this.randomValue(150000, 400000, 'cells/μL'),
        glucose: this.randomValue(70, 100, 'mg/dL')
      },
      urine_test: {
        pH: this.randomValue(4.5, 8, ''),
        specificGravity: this.randomValue(1.005, 1.030, ''),
        protein: 'Negative',
        glucose: 'Negative'
      },
      x_ray: {
        findings: 'No acute abnormalities detected',
        impression: 'Normal chest X-ray'
      },
      ct_scan: {
        findings: 'No significant abnormalities',
        impression: 'Normal CT scan'
      },
      mri: {
        findings: 'No acute pathology',
        impression: 'Normal MRI'
      },
      ultrasound: {
        findings: 'Normal organ appearance',
        impression: 'No abnormalities detected'
      },
      ecg: {
        heartRate: this.randomValue(60, 100, 'bpm'),
        rhythm: 'Normal sinus rhythm',
        findings: 'Normal ECG'
      }
    };

    const result = results[testType] || { findings: 'Test completed', impression: 'Normal' };
    
    // Randomly mark some as abnormal (10% chance)
    const abnormal = Math.random() < 0.1;

    return {
      testType,
      result,
      abnormal,
      normalRange: this.getNormalRange(testType),
      timestamp: new Date().toISOString()
    };
  }

  randomValue(min, max, unit) {
    const value = (Math.random() * (max - min) + min).toFixed(2);
    return `${value} ${unit}`.trim();
  }

  getNormalRange(testType) {
    const ranges = {
      blood_test: 'Hemoglobin: 12-16 g/dL, WBC: 4000-11000 cells/μL',
      urine_test: 'pH: 4.5-8, Specific Gravity: 1.005-1.030',
      ecg: 'Heart Rate: 60-100 bpm'
    };
    return ranges[testType] || 'See reference ranges';
  }

  getProcessingTime(urgency) {
    const times = {
      critical: 10 * 60 * 1000,  // 10 minutes
      urgent: 30 * 60 * 1000,    // 30 minutes
      routine: 2 * 60 * 60 * 1000 // 2 hours
    };
    return times[urgency] || times.routine;
  }

  async handleTestComplete(payload) {
    this.log('info', 'Test manually completed', payload);
    const { orderId } = payload;
    await this.processTests(orderId);
  }

  async handleRequestResults(payload) {
    const { orderId, patientId } = payload;
    
    if (orderId) {
      return this.testResults.get(orderId);
    }
    
    // Return all results for patient
    return Array.from(this.testResults.values())
      .filter(r => r.patientId === patientId);
  }

  getLabStatus() {
    const equipmentStatus = {};
    
    for (const [id, eq] of this.equipment.entries()) {
      if (!equipmentStatus[eq.type]) {
        equipmentStatus[eq.type] = { total: 0, available: 0, inUse: 0 };
      }
      equipmentStatus[eq.type].total++;
      if (eq.available) {
        equipmentStatus[eq.type].available++;
      } else {
        equipmentStatus[eq.type].inUse++;
      }
    }

    return {
      equipment: equipmentStatus,
      pendingOrders: Array.from(this.testOrders.values())
        .filter(o => o.status === 'pending').length,
      processingOrders: Array.from(this.testOrders.values())
        .filter(o => o.status === 'processing').length,
      completedToday: Array.from(this.testResults.values()).length
    };
  }
}

export default LabAgent;
