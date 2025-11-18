import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';

export async function POST(request) {
  try {
    const { patientId, labTechId } = await request.json();
    
    const orch = getOrchestrator();
    if (!orch.isRunning) await orch.initialize();
    
    const lab = orch.getAgent('LabAgent');
    
    // Get pending test
    const testOrder = lab.pendingTests.get(patientId);
    if (!testOrder) {
      return NextResponse.json({ error: 'Test order not found' }, { status: 404 });
    }

    // Process test (simulate results)
    await lab.processTests(patientId, testOrder.tests);

    return NextResponse.json({
      success: true,
      message: 'Tests processed successfully'
    });
  } catch (error) {
    console.error('Error processing tests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
