import { NextResponse } from 'next/server';
import { HospitalDataStore } from '@/hospital-automation/utils/data-store';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, age, phone, email, problem } = body;

    // Validate required fields
    if (!name || !problem) {
      return NextResponse.json(
        { error: 'Name and problem description are required' },
        { status: 400 }
      );
    }

    const store = HospitalDataStore.getInstance();

    // Create patient
    const patient = store.createPatient({
      name,
      age: age ? parseInt(age) : undefined,
      phone,
      email,
    });

    // Create visit
    const visit = store.createVisit(patient.id, {
      problem,
      urgency: determineUrgency(problem),
    });

    // Simulate AI agent processing delay
    setTimeout(() => {
      // Get available doctors
      const availableDoctors = store.getAvailableDoctors();
      
      if (availableDoctors.length === 0) {
        console.log('No available doctors at the moment');
        return;
      }

      // Simple doctor assignment logic based on urgency and specialization
      const assignedDoctor = selectBestDoctor(availableDoctors, problem, visit.urgency);
      
      if (assignedDoctor) {
        store.assignVisitToDoctor(visit.id, assignedDoctor.id);
        console.log(`Patient ${patient.name} assigned to Dr. ${assignedDoctor.name}`);
      }
    }, 2000); // 2 second delay to simulate AI processing

    return NextResponse.json({
      success: true,
      patientId: patient.id,
      visitId: visit.id,
      message: 'Check-in successful. AI agents are processing your request...',
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    );
  }
}

// Helper function to determine urgency based on problem description
function determineUrgency(problem) {
  const urgentKeywords = ['severe', 'acute', 'emergency', 'chest pain', 'breathing', 'blood', 'unconscious'];
  const mediumKeywords = ['fever', 'pain', 'infection', 'injury', 'persistent'];
  
  const lowerProblem = problem.toLowerCase();
  
  if (urgentKeywords.some(keyword => lowerProblem.includes(keyword))) {
    return 'high';
  }
  
  if (mediumKeywords.some(keyword => lowerProblem.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
}

// Helper function to select best doctor based on problem and availability
function selectBestDoctor(doctors, problem, urgency) {
  const lowerProblem = problem.toLowerCase();
  
  // Specialty matching keywords
  const specialtyKeywords = {
    'Cardiology': ['heart', 'chest pain', 'cardiac', 'blood pressure'],
    'Pediatrics': ['child', 'baby', 'infant', 'kid'],
    'Orthopedics': ['bone', 'fracture', 'joint', 'muscle', 'back pain', 'injury'],
    'General Medicine': ['fever', 'cold', 'cough', 'headache', 'general'],
  };

  // Try to match with specialist
  for (const [specialty, keywords] of Object.entries(specialtyKeywords)) {
    if (keywords.some(keyword => lowerProblem.includes(keyword))) {
      const specialist = doctors.find(doc => doc.specialty === specialty);
      if (specialist) return specialist;
    }
  }

  // If high urgency, pick doctor with least patients
  if (urgency === 'high') {
    return doctors.reduce((min, doc) => 
      doc.currentPatients < min.currentPatients ? doc : min
    );
  }

  // Default: pick first available general medicine doctor or any available
  return doctors.find(doc => doc.specialty === 'General Medicine') || doctors[0];
}
