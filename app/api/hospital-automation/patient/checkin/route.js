import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';
import { db } from '@/lib/prisma';

// POST - Patient check-in via orchestrator (ReceptionAgent)
export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, name, reason, isEmergency } = body;

    if (!patientId || !name || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orch = getOrchestrator();
    if (!orch.isRunning) await orch.initialize();
    const reception = orch.getAgent('ReceptionAgent');
    const scheduling = orch.getAgent('SchedulingAgent');
    
    // Check if patient already has an active appointment
    const existingReg = reception.registeredPatients.get(patientId);
    const existingAppt = Array.from(scheduling.appointments.values())
      .find(a => a.patientId === patientId && a.status !== 'completed');
    
    if (existingReg && existingAppt) {
      return NextResponse.json({
        success: false,
        error: 'You already have an active appointment. Please wait for your turn.',
        existingAppointment: true
      }, { status: 400 });
    }
    
    // Proceed with check-in
    const registration = await reception.checkInPatient({
      patientId,
      name,
      reason,
      isEmergency: !!isEmergency
    });

    // Store visit data in database - PRIMARY STORAGE
    const appointmentId = `apt-${Date.now()}`;
    try {
      const user = await db.user.findUnique({ where: { clerkUserId: patientId } });
      const visitData = {
        appointmentId,
        name,
        reason,
        urgency: registration.urgency || (isEmergency ? 'critical' : 'normal'),
        arrivalTime: new Date().toISOString(),
        status: 'waiting',
        doctorName: 'Not assigned yet',
        roomId: 'Waiting area'
      };
      
      const existingHistory = user?.medical_history || '{"visits":[]}';
      let visits;
      try {
        visits = JSON.parse(existingHistory);
      } catch {
        visits = { visits: [] };
      }
      if (!visits.visits) visits.visits = [];
      visits.visits.push(visitData);
      visits.currentAppointmentId = appointmentId;
      
      await db.user.upsert({
        where: { clerkUserId: patientId },
        update: { 
          medical_history: JSON.stringify(visits),
          name: name
        },
        create: {
          clerkUserId: patientId,
          email: `${patientId}@temp.com`,
          name: name,
          medical_history: JSON.stringify(visits)
        }
      });
      
      console.log('✅ Check-in saved to database:', appointmentId);
    } catch (dbError) {
      console.error('❌ DB storage failed:', dbError.message);
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in successful. Please wait for your turn.',
      patientId: registration.patientId,
      urgency: registration.urgency,
    });
  } catch (error) {
    console.error('Error processing check-in:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
