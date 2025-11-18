const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkMedicalHistory() {
  try {
    const users = await db.user.findMany({
      where: {
        medical_history: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        clerkUserId: true,
        medical_history: true
      }
    });

    console.log(`\n📊 Found ${users.length} users with medical_history:\n`);
    
    users.forEach(user => {
      console.log(`User: ${user.name} (${user.clerkUserId})`);
      if (user.medical_history) {
        try {
          const visits = JSON.parse(user.medical_history);
          console.log(`  - Total visits: ${visits.visits?.length || 0}`);
          console.log(`  - Current appointment: ${visits.currentAppointmentId || 'None'}`);
          if (visits.visits && visits.visits.length > 0) {
            visits.visits.forEach((v, i) => {
              console.log(`  - Visit ${i + 1}: ${v.appointmentId} - Status: ${v.status}`);
            });
          }
        } catch (e) {
          console.log(`  - Error parsing: ${e.message}`);
        }
      }
      console.log('');
    });

    // Also check all users
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        clerkUserId: true,
        medical_history: true
      }
    });

    console.log(`\n📋 Total users in database: ${allUsers.length}`);
    console.log(`👥 Users without medical_history: ${allUsers.filter(u => !u.medical_history).length}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkMedicalHistory();
