import { NextResponse } from 'next/server';
import MessageBus from '../../../../hospital-automation/agents/message-bus.js';

const messageBus = MessageBus.getInstance();

// Store patient data in memory (use database in production)
const patientData = new Map();
const patientStatus = new Map();

// Subscribe to relevant messages
messageBus.subscribe('PATIENT_CHECKED_IN', (message) => {
  const { patientId, name, reason, urgency, timestamp } = message.data;
  
  patientData.set(patientId, {
    patientId,
    name,
    reason,
    urgency,
    arrivalTime: timestamp,
    status: 'waiting',
    queuePosition: null
  });
  
  patientStatus.set(patientId, {
    status: 'waiting',
    triageComplete: false,
    consultationStarted: false,
    labTestsComplete: false,
    prescriptionReady: false,
    billingComplete: false,
    waitTime: 0
  });
});

messageBus.subscribe('TRIAGE_COMPLETE', (message) => {
  const { patientId } = message.data;
  const status = patientStatus.get(patientId);
  if (status) {
    status.triageComplete = true;
  }
});

messageBus.subscribe('DOCTOR_ASSIGNED', (message) => {
  const { patientId, doctorName, roomId, appointmentId } = message.data;
  const patient = patientData.get(patientId);
  if (patient) {
    patient.doctorName = doctorName;
    patient.roomId = roomId;
    patient.appointmentId = appointmentId;
    patient.status = 'assigned_doctor';
  }
});

messageBus.subscribe('CONSULTATION_STARTED', (message) => {
  const { patientId } = message.data;
  const status = patientStatus.get(patientId);
  if (status) {
    status.status = 'in_consultation';
    status.consultationStarted = true;
  }
});

messageBus.subscribe('LAB_RESULTS_READY', (message) => {
  const { patientId, results } = message.data;
  const status = patientStatus.get(patientId);
  if (status) {
    status.labResults = results;
    status.labTestsComplete = true;
  }
});

messageBus.subscribe('PRESCRIPTION_WRITTEN', (message) => {
  const { patientId, prescription } = message.data;
  const status = patientStatus.get(patientId);
  if (status) {
    status.prescription = prescription;
    status.prescriptionReady = true;
    status.status = 'ready_for_pharmacy';
  }
});

messageBus.subscribe('BILL_GENERATED', (message) => {
  const { patientId, invoice } = message.data;
  const status = patientStatus.get(patientId);
  if (status) {
    status.invoice = invoice;
    status.billingComplete = true;
  }
});

messageBus.subscribe('CONSULTATION_COMPLETE', (message) => {
  const { patientId } = message.data;
  const status = patientStatus.get(patientId);
  if (status) {
    status.status = 'completed';
  }
});

// GET - Fetch patient status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }
    
    const patient = patientData.get(patientId);
    const status = patientStatus.get(patientId);
    
    if (!patient) {
      return NextResponse.json({ 
        error: 'Patient not found. Please check in first.' 
      }, { status: 404 });
    }
    
    // Calculate wait time
    if (status && patient.arrivalTime) {
      const arrivalTime = new Date(patient.arrivalTime).getTime();
      status.waitTime = Math.floor((Date.now() - arrivalTime) / 60000); // minutes
    }
    
    return NextResponse.json({ 
      success: true,
      patient,
      status
    });
  } catch (error) {
    console.error('Error fetching patient status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
