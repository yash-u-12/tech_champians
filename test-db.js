// Quick DB connectivity and minimal queries for demo
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Testing database connectivity...');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    const appointmentCount = await prisma.appointment.count();
    console.log('Appointment count:', appointmentCount);
    console.log('DB test OK');
  } catch (e) {
    console.error('DB test failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();