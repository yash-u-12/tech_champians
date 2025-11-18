import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET - Fetch patients assigned to a doctor (orchestrator queue + DB appointments)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = (searchParams.get('all') || '').toLowerCase() === 'true';
    
    const patients = [];
    
    // Get ALL patients from database who have active visits
    try {
      const users = await db.user.findMany({
        where: {
          medical_history: { not: null }
        }
      });
      
      for (const user of users) {
        try {
          const visits = JSON.parse(user.medical_history);
          if (visits.currentAppointmentId && visits.visits) {
            const currentVisit = visits.visits.find(v => 
              v.appointmentId === visits.currentAppointmentId && 
              v.status !== 'completed'
            );
            
            if (currentVisit) {
              patients.push({
                appointmentId: currentVisit.appointmentId,
                patientId: user.clerkUserId,
                name: currentVisit.name,
                reason: currentVisit.reason,
                roomId: currentVisit.roomId || 'Waiting',
                priority: currentVisit.urgency || 'routine',
                status: currentVisit.status || 'waiting',
                arrivalTime: currentVisit.arrivalTime,
                doctorName: currentVisit.doctorName,
                symptoms: currentVisit.symptoms,
                possibleConditions: currentVisit.possibleConditions,
                vitals: currentVisit.vitals,
                source: 'database'
              });
            }
          }
        } catch (e) {
          console.log('Parse error for user:', user.clerkUserId);
        }
      }
      
      console.log('✅ Found', patients.length, 'active patients in database');
    } catch (dbError) {
      console.error('❌ Database query failed:', dbError.message);
    }

    // Also check orchestrator as fallback
    try {
      const orch = getOrchestrator();
      if (orch.isRunning) {
        const scheduling = orch.getAgent('SchedulingAgent');
        const reception = orch.getAgent('ReceptionAgent');
        const triage = orch.getAgent('TriageAgent');
        
        reception.registeredPatients.forEach((patient, patientId) => {
          const alreadyAdded = patients.some(p => p.patientId === patientId);
          if (!alreadyAdded) {
            const appointment = Array.from(scheduling.appointments.values())
              .find(a => a.patientId === patientId);
            const assessment = triage.assessments.get(patientId);
            
            patients.push({
              appointmentId: appointment?.appointmentId || null,
              patientId: patient.patientId,
              name: patient.name || 'Patient',
              reason: patient.reason || 'Consultation',
              roomId: appointment?.roomId || 'Waiting',
              priority: patient.urgency || 'routine',
              status: appointment?.status || 'waiting',
              arrivalTime: patient.arrivalTime,
              doctorName: appointment?.doctorName,
              symptoms: assessment?.symptoms,
              possibleConditions: assessment?.possibleConditions,
              vitals: assessment?.vitals,
              source: 'orchestrator'
            });
          }
        });
      }
    } catch (orchError) {
      console.log('Orchestrator check failed:', orchError.message);
    }

    return NextResponse.json({ success: true, patients });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
