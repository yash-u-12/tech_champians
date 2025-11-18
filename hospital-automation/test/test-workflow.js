// Test file for hospital automation workflows
import { getOrchestrator } from '../workflows/orchestrator.js';

async function testWorkflows() {
  console.log('🧪 Testing Hospital Automation Workflows\n');

  const orchestrator = getOrchestrator();

  try {
    // Initialize
    await orchestrator.initialize();
    console.log('✅ System initialized\n');

    // Test 1: Patient Admission
    console.log('Test 1: Regular Patient Admission');
    console.log('==================================');
    const admission1 = await orchestrator.executeWorkflow('patient-admission', {
      patientId: 'TEST-P001',
      name: 'Alice Johnson',
      reason: 'Persistent cough and mild fever',
      isEmergency: false
    });
    console.log('Result:', admission1);
    console.log('');

    await delay(2000);

    // Test 2: Emergency Case
    console.log('Test 2: Emergency Patient');
    console.log('==================================');
    const emergency = await orchestrator.executeWorkflow('emergency-response', {
      patientId: 'TEST-P002',
      name: 'Bob Wilson',
      reason: 'Severe chest pain and difficulty breathing',
      isEmergency: true
    });
    console.log('Result:', emergency);
    console.log('');

    await delay(2000);

    // Test 3: Multiple Patients
    console.log('Test 3: Multiple Patient Admissions');
    console.log('==================================');
    const patients = [
      { patientId: 'TEST-P003', name: 'Carol Davis', reason: 'Regular checkup' },
      { patientId: 'TEST-P004', name: 'David Brown', reason: 'Knee pain' },
      { patientId: 'TEST-P005', name: 'Eve Martinez', reason: 'Skin rash' }
    ];

    for (const patient of patients) {
      const result = await orchestrator.executeWorkflow('patient-admission', {
        ...patient,
        isEmergency: false
      });
      console.log(`✅ ${patient.name} admitted`);
      await delay(1000);
    }
    console.log('');

    await delay(3000);

    // Test 4: Agent Status Check
    console.log('Test 4: Agent Status Check');
    console.log('==================================');
    const agents = orchestrator.getAllAgents();
    for (const agentName of agents) {
      const status = orchestrator.getAgentStatus(agentName);
      console.log(`${agentName}: ${status.state} (Queue: ${status.queueLength})`);
    }
    console.log('');

    // Test 5: Hospital Metrics
    console.log('Test 5: Hospital Metrics');
    console.log('==================================');
    const metrics = orchestrator.getHospitalMetrics();
    console.log(JSON.stringify(metrics, null, 2));
    console.log('');

    // Test 6: Communication Log
    console.log('Test 6: Agent Communication Log');
    console.log('==================================');
    const messages = orchestrator.getCommunicationLog();
    console.log(`Total messages: ${messages.length}`);
    console.log('Last 5 messages:');
    messages.slice(-5).forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg.from} → ${msg.to}: ${msg.type}`);
    });
    console.log('');

    // Test 7: Resource Status
    console.log('Test 7: Resource Status');
    console.log('==================================');
    const schedulingAgent = orchestrator.getAgent('SchedulingAgent');
    const resources = schedulingAgent.getResourceStatus();
    console.log('Doctors:', resources.doctors);
    console.log('Rooms:', resources.rooms);
    console.log('Waiting List:', resources.waitingList);
    console.log('');

    // Test 8: Pharmacy Inventory
    console.log('Test 8: Pharmacy Inventory');
    console.log('==================================');
    const pharmacyAgent = orchestrator.getAgent('PharmacyAgent');
    const inventory = pharmacyAgent.getInventoryStatus();
    console.log(`Total medications: ${inventory.totalItems}`);
    console.log(`Low stock items: ${inventory.lowStock.length}`);
    console.log(`Out of stock: ${inventory.outOfStock.length}`);
    console.log('');

    // Test 9: Lab Equipment Status
    console.log('Test 9: Lab Equipment Status');
    console.log('==================================');
    const labAgent = orchestrator.getAgent('LabAgent');
    const labStatus = labAgent.getLabStatus();
    console.log('Equipment:', labStatus.equipment);
    console.log(`Pending orders: ${labStatus.pendingOrders}`);
    console.log('');

    // Test 10: Financial Summary
    console.log('Test 10: Financial Summary');
    console.log('==================================');
    const billingAgent = orchestrator.getAgent('BillingAgent');
    const financial = billingAgent.getFinancialSummary();
    console.log(JSON.stringify(financial, null, 2));
    console.log('');

    console.log('✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await orchestrator.shutdown();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
testWorkflows().catch(console.error);
