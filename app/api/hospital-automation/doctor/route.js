import { NextResponse } from 'next/server';
import MessageBus from '../../../../hospital-automation/agents/message-bus.js';

const messageBus = MessageBus.getInstance();

// Store doctor-patient assignments in memory (use database in production)
const doctorPatients = new Map();
const patientDetails = new Map();

// Subscribe to relevant messages
messageBus.subscribe('DOCTOR_ASSIGNED', (message) => {
  const { doctorName, appointmentId, patientId, patientName, reason, roomId } = message.data;
  
  if (!doctorPatients.has(doctorName)) {
    doctorPatients.set(doctorName, []);
  }
  
  const patient = {
    appointmentId,
    patientId,
    patientName,
    reason,
    roomId,
    status: 'waiting',
    assignedAt: new Date().toISOString(),
    labResults: [],
    prescription: null
  };
  
  doctorPatients.get(doctorName).push(patient);
  patientDetails.set(patientId, patient);
});

messageBus.subscribe('LAB_RESULTS_READY', (message) => {
  const { appointmentId, results } = message.data;
  
  // Find patient by appointmentId and update lab results
  for (const [doctorName, patients] of doctorPatients.entries()) {
    const patient = patients.find(p => p.appointmentId === appointmentId);
    if (patient) {
      patient.labResults = results || [];
      const stored = patientDetails.get(patient.patientId);
      if (stored) {
        stored.labResults = results || [];
      }
      break;
    }
  }
});

messageBus.subscribe('CONSULTATION_STARTED', (message) => {
  const { appointmentId } = message.data;
  
  for (const [doctorName, patients] of doctorPatients.entries()) {
    const patient = patients.find(p => p.appointmentId === appointmentId);
    if (patient) {
      patient.status = 'in_consultation';
      const stored = patientDetails.get(patient.patientId);
      if (stored) stored.status = 'in_consultation';
      break;
    }
  }
});

// GET - Fetch patients assigned to a doctor
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorName = searchParams.get('doctorName');
    
    if (!doctorName) {
      return NextResponse.json({ error: 'Doctor name required' }, { status: 400 });
    }
    
    const patients = doctorPatients.get(doctorName) || [];
    
    // Filter out completed patients older than 2 hours
    const activePatients = patients.filter(p => {
      if (p.status === 'completed') {
        const assignedTime = new Date(p.assignedAt).getTime();
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        return assignedTime > twoHoursAgo;
      }
      return true;
    });
    
    return NextResponse.json({ 
      success: true,
      patients: activePatients
    });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Submit prescription or complete consultation
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, appointmentId, patientId, prescription, diagnosis, notes } = body;
    
    if (action === 'submit_prescription') {
      // Store prescription
      const patient = patientDetails.get(patientId);
      if (patient) {
        patient.prescription = prescription;
        patient.diagnosis = diagnosis;
        patient.notes = notes;
      }
      
      // Send prescription to pharmacy agent
      messageBus.publish({
        type: 'PRESCRIPTION_WRITTEN',
        data: {
          appointmentId,
          patientId,
          prescription,
          diagnosis,
          notes,
          timestamp: new Date().toISOString()
        }
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Prescription submitted to pharmacy'
      });
    }
    
    if (action === 'complete_consultation') {
      // Update patient status
      const patient = patientDetails.get(patientId);
      if (patient) {
        patient.status = 'completed';
      }
      
      // Remove from doctor's active list after delay
      setTimeout(() => {
        for (const [doctorName, patients] of doctorPatients.entries()) {
          const index = patients.findIndex(p => p.appointmentId === appointmentId);
          if (index !== -1) {
            patients.splice(index, 1);
            break;
          }
        }
      }, 5000);
      
      // Notify scheduling agent
      messageBus.publish({
        type: 'CONSULTATION_COMPLETE',
        data: {
          appointmentId,
          patientId,
          timestamp: new Date().toISOString()
        }
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Consultation completed'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing doctor request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
