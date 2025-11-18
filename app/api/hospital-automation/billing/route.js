import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';

export async function GET(request) {
  try {
    const orch = getOrchestrator();
    if (!orch.isRunning) await orch.initialize();
    
    const billing = orch.getAgent('BillingAgent');
    const reception = orch.getAgent('ReceptionAgent');
    
    // Get all invoices
    const invoices = Array.from(billing.invoices?.values?.() || []).map(invoice => {
      const patient = reception.registeredPatients.get(invoice.patientId);
      return {
        ...invoice,
        patientName: patient?.name || 'Unknown'
      };
    });

    const stats = {
      pending: invoices.filter(i => i.status === 'pending').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      totalRevenue: invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total || 0), 0),
      averageAmount: invoices.length > 0
        ? invoices.reduce((sum, i) => sum + (i.total || 0), 0) / invoices.length
        : 0
    };

    return NextResponse.json({
      success: true,
      invoices,
      stats
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
