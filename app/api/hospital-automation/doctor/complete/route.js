import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';
import { db } from '@/lib/prisma';

// POST - Mark consultation as completed
export async function POST(request) {
  try {
    const body = await request.json();
    const { appointmentId, patientId } = body;

    if (!appointmentId || !patientId) {
      return NextResponse.json({ 
        error: 'Appointment ID and Patient ID are required' 
      }, { status: 400 });
    }

    const orch = getOrchestrator();
    if (!orch.isRunning) await orch.initialize();

    const schedulingAgent = orch.getAgent('SchedulingAgent');
    
    // Find and update appointment status
    const appointment = Array.from(schedulingAgent.appointments.values())
      .find(a => a.appointmentId === appointmentId);

    if (appointment) {
      appointment.status = 'completed';
      appointment.completedAt = new Date().toISOString();
      
      // Update database record - ALWAYS
      const user = await db.user.findUnique({ where: { clerkUserId: patientId } });
      if (user?.medical_history) {
        const visits = JSON.parse(user.medical_history);
        const visitIndex = visits.visits?.findIndex(v => v.appointmentId === appointmentId);
        if (visitIndex >= 0) {
          visits.visits[visitIndex].status = 'completed';
          visits.visits[visitIndex].completedAt = new Date().toISOString();
          visits.visits[visitIndex].doctorName = appointment.doctorName;
          visits.visits[visitIndex].roomId = appointment.roomId;
          if (appointment.prescription) {
            visits.visits[visitIndex].prescription = appointment.prescription;
            visits.visits[visitIndex].prescriptionInstructions = appointment.prescriptionInstructions;
            visits.visits[visitIndex].followUp = appointment.followUp;
          }
          // Clear current appointment ID since it's completed
          visits.currentAppointmentId = null;
          
          await db.user.update({
            where: { clerkUserId: patientId },
            data: { medical_history: JSON.stringify(visits) }
          });
          
          console.log('✅ Visit marked as completed in database');
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Consultation marked as completed'
    });

  } catch (error) {
    console.error('Error completing consultation:', error);
    return NextResponse.json({ 
      error: 'Failed to complete consultation',
      details: error.message 
    }, { status: 500 });
  }
}
