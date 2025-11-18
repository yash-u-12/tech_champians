import { NextResponse } from 'next/server';
import { HospitalDataStore } from '@/hospital-automation/utils/data-store';

export async function GET(request, { params }) {
  try {
    // Next.js 15 requires awaiting params
    const { visitId } = await params;

    if (!visitId) {
      return NextResponse.json(
        { error: 'Visit ID is required' },
        { status: 400 }
      );
    }

    const store = HospitalDataStore.getInstance();
    const visit = store.getVisit(visitId);

    if (!visit) {
      return NextResponse.json(
        { error: 'Visit not found' },
        { status: 404 }
      );
    }

    // Get patient details
    const patient = store.getPatient(visit.patientId);
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get assigned doctor details if available
    let assignedDoctor = null;
    if (visit.assignedDoctorId) {
      assignedDoctor = store.doctors.get(visit.assignedDoctorId);
    }

    // Get AI analysis (simulated based on problem description)
    const aiAnalysis = generateAIAnalysis(visit.problem, visit.urgency);

    return NextResponse.json({
      success: true,
      visit: {
        visitId: visit.id,
        status: visit.status,
        problem: visit.problem,
        urgency: visit.urgency,
        checkInTime: visit.checkInTime,
        aiAnalysis,
      },
      patient: {
        patientId: patient.id,
        name: patient.name,
        age: patient.age,
        phone: patient.phone,
        email: patient.email,
      },
      assignedDoctor: assignedDoctor ? {
        doctorId: assignedDoctor.id,
        name: assignedDoctor.name,
        specialty: assignedDoctor.specialty,
        currentPatients: assignedDoctor.currentPatients,
      } : null,
    });

  } catch (error) {
    console.error('Get visit error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve visit information' },
      { status: 500 }
    );
  }
}

// Generate AI analysis based on problem and urgency
function generateAIAnalysis(problem, urgency) {
  const analyses = {
    high: [
      'Immediate medical attention required',
      'Potential urgent condition detected',
      'Priority case - fast-tracked to specialist',
    ],
    medium: [
      'Standard medical consultation recommended',
      'Symptoms require professional evaluation',
      'Scheduled for timely medical review',
    ],
    low: [
      'General consultation advised',
      'Routine medical check recommended',
      'Scheduled for regular appointment',
    ],
  };

  const baseAnalysis = analyses[urgency] || analyses.low;
  
  return {
    summary: baseAnalysis[Math.floor(Math.random() * baseAnalysis.length)],
    urgencyLevel: urgency,
    estimatedWaitTime: urgency === 'high' ? '5-10 minutes' : 
                       urgency === 'medium' ? '15-30 minutes' : 
                       '30-60 minutes',
    recommendedActions: [
      'Patient registered in system',
      'Medical history reviewed',
      'Assigned to appropriate specialist',
      'Waiting for doctor consultation',
    ],
  };
}
