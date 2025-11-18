import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';
import MessageBus from '@/hospital-automation/agents/message-bus.js';

// POST - Submit prescription from doctor
export async function POST(request) {
  try {
    console.log('\n═══════════════════════════════════════');
    console.log('💊 PRESCRIPTION API: Starting submission');
    const body = await request.json();
    console.log('💊 PRESCRIPTION API: Body received:', JSON.stringify(body, null, 2));
    const { patientId, appointmentId, doctorId, prescription, instructions, followUp } = body;

    if (!patientId || !appointmentId || !prescription || prescription.length === 0) {
      console.log('💊 PRESCRIPTION API: Validation failed');
      return NextResponse.json({ 
        error: 'Patient ID, appointment ID, and prescription medications are required' 
      }, { status: 400 });
    }
    console.log('💊 PRESCRIPTION API: Validation passed');

    console.log('💊 PRESCRIPTION API: Getting orchestrator');
    const orch = getOrchestrator();
    console.log('💊 PRESCRIPTION API: Orchestrator running?', orch.isRunning);
    if (!orch.isRunning) {
      console.log('💊 PRESCRIPTION API: Initializing orchestrator...');
      await orch.initialize();
      console.log('💊 PRESCRIPTION API: Orchestrator initialized');
    }

    // Get agents
    console.log('💊 PRESCRIPTION API: Getting agents');
    const pharmacyAgent = orch.getAgent('PharmacyAgent');
    const schedulingAgent = orch.getAgent('SchedulingAgent');
    const receptionAgent = orch.getAgent('ReceptionAgent');
    console.log('💊 PRESCRIPTION API: Agents retrieved');

    // Get patient name from reception records
    const patientRecord = receptionAgent.registeredPatients.get(patientId);
    const patientName = patientRecord?.name || 'Unknown Patient';

    // Store prescription with patient record
    const prescriptionData = {
      prescriptionId: `RX-${Date.now()}`,
      patientId,
      appointmentId,
      doctorId,
      medications: prescription,
      instructions,
      followUp,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Send to pharmacy agent for processing
    await pharmacyAgent.handlePrescriptionOrder({
      patientId,
      appointmentId,
      medications: prescription
    });

    // Update appointment with prescription info
    const appointment = Array.from(schedulingAgent.appointments.values())
      .find(a => a.appointmentId === appointmentId);

    if (appointment) {
      appointment.prescription = prescription;
      appointment.prescriptionInstructions = instructions;
      appointment.followUp = followUp;
      appointment.prescriptionReady = true;
    }

    // Store prescription in global orchestrator state
    if (!orch.prescriptions) {
      orch.prescriptions = new Map();
    }
    orch.prescriptions.set(prescriptionData.prescriptionId, prescriptionData);

    // Publish to MessageBus for pharmacy interface
    console.log('💊 PRESCRIPTION API: Getting MessageBus instance');
    const messageBus = MessageBus.getInstance();
    console.log('💊 PRESCRIPTION API: MessageBus instance obtained');
    console.log('💊 PRESCRIPTION API: MessageBus subscribers:', messageBus.getSubscribers());
    
    const messageData = {
      type: 'PRESCRIPTION_WRITTEN',
      data: {
        appointmentId,
        patientId,
        patientName,
        prescription,
        diagnosis: instructions,
        notes: followUp,
        timestamp: prescriptionData.timestamp
      }
    };
    console.log('💊 PRESCRIPTION API: Publishing message:', JSON.stringify(messageData, null, 2));
    await messageBus.publish(messageData);
    console.log('💊 PRESCRIPTION API: Message published successfully');
    console.log('═══════════════════════════════════════\n');

    return NextResponse.json({ 
      success: true, 
      message: 'Prescription submitted successfully',
      prescriptionId: prescriptionData.prescriptionId
    });

  } catch (error) {
    console.error('Error submitting prescription:', error);
    return NextResponse.json({ 
      error: 'Failed to submit prescription',
      details: error.message 
    }, { status: 500 });
  }
}
