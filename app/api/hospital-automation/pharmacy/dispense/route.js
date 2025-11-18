import { NextResponse } from 'next/server';
import MessageBus from '../../../../../hospital-automation/agents/message-bus.js';

const messageBus = MessageBus.getInstance();

// Initialize global dispensed medications tracking
if (!global.dispensedMedications) {
  global.dispensedMedications = new Map();
}

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
    
    console.log('💊 DISPENSE: Processing order', orderId);
    
    // Update order status to dispensed
    if (global.pharmacyOrders && global.pharmacyOrders.has(orderId)) {
      const order = global.pharmacyOrders.get(orderId);
      order.status = 'dispensed';
      order.dispensedAt = new Date().toISOString();
      order.pharmacistId = pharmacistId;
      
      // Track dispensed medications by appointmentId for patient portal
      if (order.appointmentId) {
        global.dispensedMedications.set(order.appointmentId, {
          orderId,
          appointmentId: order.appointmentId,
          patientId: order.patientId,
          medications: order.medications,
          dispensedAt: order.dispensedAt,
          pharmacistId,
          collected: true
        });
        console.log('💊 DISPENSE: Tracked for patient', order.patientId, 'appointment', order.appointmentId);
      }
      
      // Remove from active orders after 2 seconds
      setTimeout(() => {
        global.pharmacyOrders.delete(orderId);
        console.log('💊 DISPENSE: Order', orderId, 'removed from queue');
      }, 2000);
      
      console.log('💊 DISPENSE: Order marked as dispensed');
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
