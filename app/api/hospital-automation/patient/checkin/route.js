import { NextResponse } from 'next/server';
import MessageBus from '../../../../../hospital-automation/agents/message-bus.js';

const messageBus = MessageBus.getInstance();

// POST - Patient check-in
export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, name, reason, isEmergency } = body;
    
    if (!patientId || !name || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Send check-in message to reception agent
    messageBus.publish({
      type: 'PATIENT_ARRIVAL',
      data: {
        patientId,
        name,
        reason,
        isEmergency: isEmergency || false,
        timestamp: new Date().toISOString()
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Check-in successful. Please wait for your turn.',
      patientId
    });
  } catch (error) {
    console.error('Error processing check-in:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
