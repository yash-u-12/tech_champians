import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';

export async function POST(request) {
  try {
    const { patientId, billingStaffId } = await request.json();
    
    const orch = getOrchestrator();
    if (!orch.isRunning) await orch.initialize();
    
    const billing = orch.getAgent('BillingAgent');
    
    // Find and update invoice
    const invoice = Array.from(billing.invoices?.values?.() || [])
      .find(inv => inv.patientId === patientId);
    
    if (invoice) {
      invoice.status = 'paid';
      invoice.paidAt = new Date().toISOString();
      invoice.paidBy = billingStaffId;
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice marked as paid'
    });
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
