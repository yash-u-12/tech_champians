import { NextResponse } from 'next/server';
import MessageBus from '../../../../../hospital-automation/agents/message-bus.js';

// Pharmacy orders are managed by orchestrator subscription
// This route only handles GET requests to fetch orders

// GET - Fetch all orders
export async function GET(request) {
  try {
    console.log('\n═══════════════════════════════════════');
    console.log('📦 PHARMACY GET API: Request received');
    console.log('📦 PHARMACY GET API: global.pharmacyOrders exists?', !!global.pharmacyOrders);
    console.log('📦 PHARMACY GET API: global.pharmacyOrders size:', global.pharmacyOrders?.size || 0);
    
    if (!global.pharmacyOrders) {
      console.log('📦 PHARMACY GET API: Initializing global.pharmacyOrders');
      global.pharmacyOrders = new Map();
    }
    
    const orders = Array.from(global.pharmacyOrders.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log('📦 PHARMACY GET API: Orders to return:', orders.length);
    console.log('═══════════════════════════════════════\n');
    
    return NextResponse.json({ 
      success: true,
      orders
    });
  } catch (error) {
    console.error('📦 PHARMACY GET API: ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
