import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';

let orchestrator = null;

// Initialize orchestrator on first request
async function getOrchestratorInstance() {
  if (!orchestrator) {
    orchestrator = getOrchestrator();
    await orchestrator.initialize();
  }
  return orchestrator;
}

// GET: Get system status
export async function GET(request) {
  try {
    const orch = await getOrchestratorInstance();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'status':
        return NextResponse.json(orch.getSystemStatus());
      
      case 'metrics':
        return NextResponse.json(orch.getHospitalMetrics());
      
      case 'agents':
        const agentName = searchParams.get('agent');
        if (agentName) {
          return NextResponse.json(orch.getAgentStatus(agentName));
        }
        return NextResponse.json({ agents: orch.getAllAgents() });
      
      case 'communications':
        const filters = {
          from: searchParams.get('from'),
          to: searchParams.get('to'),
          type: searchParams.get('messageType')
        };
        return NextResponse.json(orch.getCommunicationLog(filters));
      
      default:
        return NextResponse.json(orch.getSystemStatus());
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Execute workflow or send command
export async function POST(request) {
  try {
    const orch = await getOrchestratorInstance();
    const body = await request.json();
    const { action, workflow, data } = body;

    switch (action) {
      case 'execute-workflow':
        const result = await orch.executeWorkflow(workflow, data);
        return NextResponse.json(result);
      
      case 'patient-checkin':
        const receptionAgent = orch.getAgent('ReceptionAgent');
        const registration = await receptionAgent.checkInPatient(data);
        return NextResponse.json(registration);
      
      case 'process-payment':
        const billingAgent = orch.getAgent('BillingAgent');
        const payment = await billingAgent.receiveMessage({
          type: 'PROCESS_PAYMENT',
          payload: data,
          from: 'api'
        });
        return NextResponse.json(payment);
      
      case 'check-inventory':
        const pharmacyAgent = orch.getAgent('PharmacyAgent');
        const inventory = await pharmacyAgent.handleCheckInventory(data);
        return NextResponse.json(inventory);
      
      case 'request-results':
        const labAgent = orch.getAgent('LabAgent');
        const results = await labAgent.handleRequestResults(data);
        return NextResponse.json(results);
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
