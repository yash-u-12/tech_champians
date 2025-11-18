import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/hospital-automation/workflows/orchestrator';

export async function GET(request) {
  try {
    const orch = getOrchestrator();
    if (!orch.isRunning) await orch.initialize();
    
    const reception = orch.getAgent('ReceptionAgent');
    const scheduling = orch.getAgent('SchedulingAgent');
    
    // Get all registered patients and deduplicate by patientId
    const patientsMap = new Map();
    Array.from(reception.registeredPatients.values()).forEach(patient => {
      const appointment = Array.from(scheduling.appointments.values())
        .find(a => a.patientId === patient.patientId);
      
      // Only add if not already in map, or if this one has more recent info
      if (!patientsMap.has(patient.patientId)) {
        patientsMap.set(patient.patientId, {
          ...patient,
          waitTime: Math.floor((Date.now() - new Date(patient.arrivalTime).getTime()) / 60000),
          status: appointment?.status || 'waiting',
          doctorName: appointment?.doctorName,
          roomId: appointment?.roomId
        });
      }
    });
    
    const patients = Array.from(patientsMap.values());

    // Calculate stats
    const stats = {
      totalRegistered: patients.length,
      inQueue: reception.patientQueue?.length || 0,
      emergencies: patients.filter(p => p.urgency === 'critical').length,
      averageWaitTime: patients.length > 0 
        ? Math.floor(patients.reduce((sum, p) => sum + p.waitTime, 0) / patients.length)
        : 0
    };

    return NextResponse.json({
      success: true,
      patients,
      queue: reception.patientQueue || [],
      stats
    });
  } catch (error) {
    console.error('Error fetching reception data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
