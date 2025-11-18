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
    
    console.log('💵 BILL: Generating bill for order', orderId);
    
    // Get order and calculate bill
    if (global.pharmacyOrders && global.pharmacyOrders.has(orderId)) {
      const order = global.pharmacyOrders.get(orderId);
      
      // Calculate total (simple calculation: $10 per medication)
      const total = (order.medications?.length || 0) * 10;
      
      const invoice = {
        orderId,
        items: order.medications.map(med => ({
          description: `${med.name} ${med.dosage} - ${med.frequency} for ${med.duration}`,
          amount: 10
        })),
        subtotal: total,
        tax: total * 0.1,
        total: total * 1.1,
        status: 'pending'
      };
      
      order.billGenerated = true;
      order.invoice = invoice;
      order.totalAmount = invoice.total;
      order.status = 'ready';
      
      console.log('💵 BILL: Bill generated, total:', invoice.total);
      
      // Send message to billing agent
      messageBus.publish({
        type: 'GENERATE_PHARMACY_BILL',
        data: {
          orderId,
          invoice,
          timestamp: new Date().toISOString()
        }
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Bill generated successfully',
        invoice
      });
    } else {
      return NextResponse.json({ 
        error: 'Order not found' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error generating bill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
