import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET - Fetch patient status from orchestrator state + DB appointments
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }

    // ALWAYS check database first (primary source)
    try {
      const { userId } = await auth();
      const user = await db.user.findUnique({
        where: { clerkUserId: userId || patientId },
        include: {
          patientAppointments: {
            where: { 
              status: 'SCHEDULED',
              startTime: { gte: new Date() }
            },
            include: { doctor: true },
            orderBy: { startTime: 'asc' },
            take: 1
          }
        }
      });

      if (user?.medical_history) {
        const visits = JSON.parse(user.medical_history);
        const currentAppointmentId = visits.currentAppointmentId;
        
        if (currentAppointmentId && visits.visits) {
          const currentVisit = visits.visits.find(v => v.appointmentId === currentAppointmentId && v.status !== 'completed');
          if (currentVisit) {
            // Return current active visit from DATABASE
            return NextResponse.json({
              success: true,
              patient: {
                patientId: userId || patientId,
                name: currentVisit.name,
                reason: currentVisit.reason,
                urgency: currentVisit.urgency,
                arrivalTime: currentVisit.arrivalTime,
                doctorName: currentVisit.doctorName || 'Not assigned yet',
                roomId: currentVisit.roomId || 'Waiting area',
                appointmentId: currentVisit.appointmentId,
              },
              status: {
                status: currentVisit.status || 'waiting',
                triageComplete: !!currentVisit.triageData,
                consultationStarted: currentVisit.status === 'in_consultation',
                labTestsComplete: !!currentVisit.labResults,
                prescriptionReady: !!currentVisit.prescription,
                medicationsCollected: false,
                billingComplete: !!currentVisit.invoice,
                waitTime: Math.floor((Date.now() - new Date(currentVisit.arrivalTime).getTime()) / 60000),
                queuePosition: null,
                labResults: currentVisit.labResults,
                prescription: currentVisit.prescription,
                prescriptionInstructions: currentVisit.prescriptionInstructions,
                followUp: currentVisit.followUp,
                invoice: currentVisit.invoice
              },
              history: visits.visits || []
            });
          }
        }
        
        // No active visit but has history
        return NextResponse.json({ 
          success: true,
          noActiveAppointment: true,
          message: 'No active appointment',
          history: visits.visits || []
        });
      }

      // Check for scheduled appointments
      if (user?.patientAppointments?.[0]) {
        const appt = user.patientAppointments[0];
        return NextResponse.json({
          success: true,
          patient: {
            patientId: user.id,
            name: user.name,
            reason: appt.patientDescription || 'Consultation',
            urgency: 'scheduled',
            arrivalTime: appt.startTime,
            doctorName: appt.doctor.name,
            appointmentId: appt.id,
          },
          status: {
            status: 'scheduled_appointment',
            scheduledTime: appt.startTime,
          },
          history: user.medical_history ? JSON.parse(user.medical_history).visits || [] : []
        });
      }
      
      return NextResponse.json({ 
        success: false,
        noActiveAppointment: true,
        message: 'No active appointment. Check in or book an appointment.'
      });
    } catch (error) {
      console.error('Database lookup failed:', error);
    }

    // Fallback to orchestrator only if database fails
    const orch = getOrchestrator();
    if (!orch.isRunning) await orch.initialize();
    const reception = orch.getAgent('ReceptionAgent');
    const scheduling = orch.getAgent('SchedulingAgent');
    const reg = reception.registeredPatients.get(patientId);
    const appt = Array.from(scheduling.appointments.values()).find(a => a.patientId === patientId);
    
    if (reg && appt) {
      // Patient is registered - return their info (with or without appointment)
      const assessment = triage.assessments.get(patientId);
      const labResults = Array.from(lab.testResults.values()).flatMap(r => (r.patientId === patientId ? [r] : []));
      const invoice = Array.from(billing.invoices?.values?.() || []).find(inv => inv.patientId === patientId);

      const prescription = appt?.prescription || null;
      const prescriptionReady = appt?.prescriptionReady || false;
      
      // Check if medications have been dispensed/collected
      const dispensedInfo = appt ? global.dispensedMedications?.get(appt.appointmentId) : null;
      const medicationsCollected = !!dispensedInfo;

      const status = {
        status: appt?.status === 'in_progress' ? 'in_consultation' : 
                appt?.status === 'completed' ? 'completed' : 
                assessment ? 'in_triage' : 'waiting',
        triageComplete: !!assessment,
        consultationStarted: appt?.status === 'in_progress',
        labTestsComplete: labResults.length > 0,
        prescriptionReady: prescriptionReady,
        medicationsCollected: medicationsCollected,
        collectionTime: dispensedInfo?.dispensedAt,
        billingComplete: invoice?.status === 'paid' || false,
        waitTime: reg.arrivalTime ? Math.floor((Date.now() - new Date(reg.arrivalTime).getTime()) / 60000) : 0,
        queuePosition: reception.patientQueue?.indexOf(patientId) ?? null,
        labResults: labResults.length > 0 ? labResults[0].tests : undefined,
        prescription: prescription,
        prescriptionInstructions: appt?.prescriptionInstructions,
        followUp: appt?.followUp,
        invoice
      };

      const patient = {
        patientId,
        name: reg.name,
        reason: reg.reason,
        urgency: reg.urgency,
        arrivalTime: reg.arrivalTime,
        doctorName: appt?.doctorName || 'Not assigned yet',
        roomId: appt?.roomId || 'Waiting area',
        appointmentId: appt?.appointmentId || 'Pending',
      };

      console.log('Returning patient data:', patient);
      return NextResponse.json({ success: true, patient, status });
    }
    
    // No active orchestrator appointment - check DB for stored visit data
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ 
          success: false,
          noActiveAppointment: true,
          message: 'No active appointment. Check in or book an appointment.'
        }, { status: 200 });
      }

      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
        include: {
          patientAppointments: {
            where: { 
              status: 'SCHEDULED',
              startTime: { gte: new Date() }
            },
            include: { doctor: true },
            orderBy: { startTime: 'asc' },
            take: 1
          }
        }
      });

      // Check for stored walk-in visit data
      if (user?.medical_history) {
        try {
          const visits = JSON.parse(user.medical_history);
          const currentAppointmentId = visits.currentAppointmentId;
          
          if (currentAppointmentId && visits.visits) {
            const currentVisit = visits.visits.find(v => v.appointmentId === currentAppointmentId);
            if (currentVisit && currentVisit.status !== 'completed') {
              // Check if medications were dispensed
              const dispensedInfo = global.dispensedMedications?.get(currentAppointmentId);
              
              return NextResponse.json({
                success: true,
                patient: {
                  patientId: userId,
                  name: currentVisit.name,
                  reason: currentVisit.reason,
                  urgency: currentVisit.urgency,
                  arrivalTime: currentVisit.arrivalTime,
                  doctorName: currentVisit.doctorName,
                  roomId: currentVisit.roomId,
                  appointmentId: currentVisit.appointmentId,
                },
                status: {
                  status: currentVisit.status || 'checked_in',
                  triageComplete: !!currentVisit.triageData,
                  consultationStarted: currentVisit.status === 'in_consultation',
                  labTestsComplete: !!currentVisit.labResults,
                  prescriptionReady: !!currentVisit.prescription,
                  medicationsCollected: !!dispensedInfo,
                  collectionTime: dispensedInfo?.dispensedAt,
                  billingComplete: !!currentVisit.invoice,
                  waitTime: Math.floor((Date.now() - new Date(currentVisit.arrivalTime).getTime()) / 60000),
                  queuePosition: null,
                  labResults: currentVisit.labResults,
                  prescription: currentVisit.prescription,
                  prescriptionInstructions: currentVisit.prescriptionInstructions,
                  followUp: currentVisit.followUp,
                  invoice: currentVisit.invoice
                },
                history: visits.visits || []
              });
            }
          }
        } catch (parseError) {
          console.log('Parse error:', parseError.message);
        }
      }

      // Check for scheduled appointments
      if (user?.patientAppointments?.[0]) {
        const appt = user.patientAppointments[0];
        return NextResponse.json({
          success: true,
          patient: {
            patientId: user.id,
            name: user.name,
            reason: appt.patientDescription || 'Consultation',
            urgency: 'scheduled',
            arrivalTime: appt.startTime,
            doctorName: appt.doctor.name,
            appointmentId: appt.id,
          },
          status: {
            status: 'scheduled_appointment',
            triageComplete: true,
            consultationStarted: false,
            labTestsComplete: false,
            prescriptionReady: false,
            billingComplete: false,
            waitTime: 0,
            queuePosition: null,
            scheduledTime: appt.startTime,
            prescription: null,
            prescriptionInstructions: null,
            followUp: null
          },
          history: user.medical_history ? JSON.parse(user.medical_history).visits || [] : []
        });
      }
      
      // No active appointment but user exists - return history
      if (user) {
        const history = user.medical_history ? JSON.parse(user.medical_history).visits || [] : [];
        return NextResponse.json({ 
          success: true,
          noActiveAppointment: true,
          message: 'No active appointment',
          history
        }, { status: 200 });
      }
    } catch (dbError) {
      console.log('DB check failed:', dbError.message);
    }
    
    return NextResponse.json({ 
      success: false,
      noActiveAppointment: true,
      message: 'No active appointment. Check in or book an appointment.'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching patient status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
