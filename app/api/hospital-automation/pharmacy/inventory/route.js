import { NextResponse } from 'next/server';

// Mock inventory data (in production, use database)
const inventory = [
  { name: 'Amoxicillin', category: 'antibiotic', quantity: 150, price: 12.99, reorderThreshold: 50 },
  { name: 'Ibuprofen', category: 'painkiller', quantity: 200, price: 8.99, reorderThreshold: 50 },
  { name: 'Lisinopril', category: 'blood_pressure', quantity: 30, price: 15.99, reorderThreshold: 50 },
  { name: 'Metformin', category: 'diabetes', quantity: 120, price: 10.99, reorderThreshold: 50 },
  { name: 'Omeprazole', category: 'antacid', quantity: 80, price: 14.99, reorderThreshold: 50 },
  { name: 'Atorvastatin', category: 'cholesterol', quantity: 45, price: 18.99, reorderThreshold: 50 },
  { name: 'Levothyroxine', category: 'thyroid', quantity: 90, price: 13.99, reorderThreshold: 50 },
  { name: 'Albuterol', category: 'respiratory', quantity: 60, price: 22.99, reorderThreshold: 30 },
  { name: 'Gabapentin', category: 'nerve_pain', quantity: 70, price: 16.99, reorderThreshold: 40 },
  { name: 'Sertraline', category: 'antidepressant', quantity: 55, price: 19.99, reorderThreshold: 40 }
];

export async function GET(request) {
  try {
    return NextResponse.json({ 
      success: true,
      inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
