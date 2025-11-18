import { NextResponse } from 'next/server';
import { HospitalDataStore } from '@/hospital-automation/utils/data-store';

export async function POST(request) {
  try {
    const body = await request.json();
    const { visitId, patientId, diagnosis, medications, notes } = body;

    // Validate required fields
    if (!visitId || !patientId || !diagnosis || !medications || medications.length === 0) {
      return NextResponse.json(
        { error: 'Visit ID, patient ID, diagnosis, and at least one medication are required' },
        { status: 400 }
      );
    }

    const store = HospitalDataStore.getInstance();

    // Verify visit exists
    const visit = store.getVisit(visitId);
    if (!visit) {
      return NextResponse.json(
        { error: 'Visit not found' },
        { status: 404 }
      );
    }

    // Verify patient exists
    const patient = store.getPatient(patientId);
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create prescription
    const prescription = store.createPrescription({
      patientId,
      visitId,
      diagnosis,
      medications,
      notes,
      doctorId: visit.assignedDoctorId,
    });

    // Complete the visit
    store.completeVisit(visitId);

    // Update patient record with diagnosis history
    store.updatePatient(patientId, {
      diagnoses: [...(patient.diagnoses || []), {
        date: new Date().toISOString(),
        diagnosis,
        prescriptionId: prescription.id,
      }],
    });

    return NextResponse.json({
      success: true,
      prescriptionId: prescription.id,
      message: 'Prescription saved successfully and visit completed',
      data: {
        prescription: {
          id: prescription.id,
          diagnosis,
          medications: medications.length,
          prescribedDate: prescription.prescribedDate,
        },
        visit: {
          id: visitId,
          status: 'completed',
          completedAt: new Date().toISOString(),
        },
      },
    });

  } catch (error) {
    console.error('Prescription save error:', error);
    return NextResponse.json(
      { error: 'Failed to save prescription' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve prescriptions for a patient
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const prescriptionId = searchParams.get('prescriptionId');

    const store = HospitalDataStore.getInstance();

    if (prescriptionId) {
      // Get specific prescription
      const prescription = store.getPrescription(prescriptionId);
      
      if (!prescription) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        prescription,
      });
    }

    if (patientId) {
      // Get all prescriptions for a patient
      const allPrescriptions = Array.from(store.prescriptions.values());
      const patientPrescriptions = allPrescriptions.filter(
        p => p.patientId === patientId
      );

      return NextResponse.json({
        success: true,
        count: patientPrescriptions.length,
        prescriptions: patientPrescriptions,
      });
    }

    return NextResponse.json(
      { error: 'Either patientId or prescriptionId is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get prescription error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve prescription' },
      { status: 500 }
    );
  }
}
