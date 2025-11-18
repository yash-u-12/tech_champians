import { getOrchestrator } from './workflows/orchestrator.js';

// Main entry point for hospital automation system
async function main() {
  console.log('🏥 MedSync Hospital Automation System');
  console.log('=====================================\n');

  const orchestrator = getOrchestrator();

  try {
    // Initialize the system
    await orchestrator.initialize();

    // Display initial status
    console.log('\n📊 Initial System Status:');
    console.log(JSON.stringify(orchestrator.getSystemStatus(), null, 2));

    // Example: Run a patient admission workflow
    console.log('\n🔄 Running example workflows...\n');

    // Example 1: Regular patient admission
    const result1 = await orchestrator.executeWorkflow('patient-admission', {
      patientId: 'P001',
      name: 'John Doe',
      reason: 'Fever and headache for 3 days',
      isEmergency: false
    });
    console.log('\nWorkflow Result:', result1);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example 2: Emergency case
    const result2 = await orchestrator.executeWorkflow('emergency-response', {
      patientId: 'P002',
      name: 'Jane Smith',
      reason: 'Severe chest pain',
      isEmergency: true
    });
    console.log('\nEmergency Workflow Result:', result2);

    // Display metrics
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('\n📈 Hospital Metrics:');
    console.log(JSON.stringify(orchestrator.getHospitalMetrics(), null, 2));

    // Display communication log (last 10 messages)
    const messages = orchestrator.getCommunicationLog();
    console.log(`\n💬 Recent Agent Communications (${messages.length} total):`);
    messages.slice(-10).forEach(msg => {
      console.log(`  ${msg.from} → ${msg.to}: ${msg.type}`);
    });

    // Keep running for demonstration
    console.log('\n✅ System is running. Press Ctrl+C to stop.');
    
    // In production, this would run indefinitely
    // For demo, we'll keep it running for a while
    await new Promise(resolve => setTimeout(resolve, 60000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cleanup
    await orchestrator.shutdown();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received shutdown signal...');
  const orchestrator = getOrchestrator();
  await orchestrator.shutdown();
  process.exit(0);
});

// Always run main (path normalization issues on Windows with import.meta.url)
main().catch(console.error);

export { main };
