import { NextResponse } from 'next/server';
import MessageBus from '../../../../../hospital-automation/agents/message-bus.js';

const messageBus = MessageBus.getInstance();

// POST - Dispense medication
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, pharmacistId } = body;
    
    if (!orderId || !pharmacistId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Send dispense message to pharmacy agent
    messageBus.publish({
      type: 'DISPENSE_MEDICATION',
      data: {
        orderId,
        pharmacistId,
        timestamp: new Date().toISOString()
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Medication dispensed successfully'
    });
  } catch (error) {
    console.error('Error dispensing medication:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
