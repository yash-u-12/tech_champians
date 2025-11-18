import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';

export async function GET(request) {
  try {
    const orch = getOrchestrator();
    if (!orch.isRunning) await orch.initialize();
    
    const lab = orch.getAgent('LabAgent');
    const reception = orch.getAgent('ReceptionAgent');
    
    // Get pending orders
    const pending = Array.from(lab.pendingTests.values()).map(order => {
      const patient = reception.registeredPatients.get(order.patientId);
      return {
        ...order,
        patientName: patient?.name || 'Unknown'
      };
    });

    // Get completed tests
    const completed = Array.from(lab.testResults.values())
      .filter(result => {
        const time = new Date(result.timestamp).getTime();
        const dayStart = new Date().setHours(0, 0, 0, 0);
        return time >= dayStart;
      })
      .map(result => {
        const patient = reception.registeredPatients.get(result.patientId);
        return {
          ...result,
          patientName: patient?.name || 'Unknown'
        };
      });

    const stats = {
      pending: pending.length,
      completed: completed.length,
      urgent: pending.filter(p => p.urgency === 'urgent').length
    };

    return NextResponse.json({
      success: true,
      pending,
      completed,
      stats
    });
  } catch (error) {
    console.error('Error fetching lab data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
