import { NextResponse } from 'next/server';
import MessageBus from '../../../../../hospital-automation/agents/message-bus.js';

const messageBus = MessageBus.getInstance();

// Store pharmacy orders in memory (use database in production)
const pharmacyOrders = new Map();
let orderCounter = 1;

// Subscribe to prescription messages
messageBus.subscribe('PRESCRIPTION_WRITTEN', (message) => {
  const { appointmentId, patientId, prescription, diagnosis, notes, timestamp } = message.data;
  
  const orderId = `PH${String(orderCounter++).padStart(6, '0')}`;
  
  const order = {
    orderId,
    appointmentId,
    patientId,
    patientName: message.data.patientName || 'Unknown',
    medications: prescription,
    diagnosis,
    notes,
    status: 'pending',
    timestamp,
    billGenerated: false,
    totalAmount: 0
  };
  
  pharmacyOrders.set(orderId, order);
  
  // Auto-process with pharmacy agent
  setTimeout(() => {
    messageBus.publish({
      type: 'PROCESS_PRESCRIPTION',
      data: { orderId, appointmentId, prescription }
    });
  }, 100);
});

messageBus.subscribe('PRESCRIPTION_PROCESSED', (message) => {
  const { orderId, medications, interactions, totalAmount } = message.data;
  
  const order = pharmacyOrders.get(orderId);
  if (order) {
    order.medications = medications;
    order.interactions = interactions;
    order.totalAmount = totalAmount;
    order.status = 'processing';
  }
});

messageBus.subscribe('BILL_GENERATED', (message) => {
  const { orderId, invoice } = message.data;
  
  const order = pharmacyOrders.get(orderId);
  if (order) {
    order.billGenerated = true;
    order.invoice = invoice;
    order.totalAmount = invoice.total;
  }
});

// GET - Fetch all orders
export async function GET(request) {
  try {
    const orders = Array.from(pharmacyOrders.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return NextResponse.json({ 
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching pharmacy orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
