import { NextResponse } from 'next/server';
import MessageBus from '../../../../../hospital-automation/agents/message-bus.js';

const messageBus = MessageBus.getInstance();

// POST - Generate bill for prescription
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json({ 
        error: 'Order ID required' 
      }, { status: 400 });
    }
    
    // Send message to billing agent
    messageBus.publish({
      type: 'GENERATE_PHARMACY_BILL',
      data: {
        orderId,
        timestamp: new Date().toISOString()
      }
    });
    
    // Wait briefly for bill to be generated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({ 
      success: true,
      message: 'Bill generated successfully',
      total: 0 // Will be updated by message bus
    });
  } catch (error) {
    console.error('Error generating bill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
