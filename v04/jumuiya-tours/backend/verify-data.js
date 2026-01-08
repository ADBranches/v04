// backend/verify-data.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying seeded data...\n');
  
  try {
    // Count users
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount}`);
    
    const users = await prisma.user.findMany({
      select: { email: true, role: true, guide_status: true }
    });
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}, ${user.guide_status})`);
    });

    // Count destinations
    const destCount = await prisma.destination.count();
    console.log(`\n🗺️ Destinations: ${destCount}`);
    
    const destinations = await prisma.destination.findMany({
      select: { name: true, status: true, created_by: true }
    });
    destinations.forEach(dest => {
      console.log(`   - ${dest.name} (${dest.status})`);
    });

    // Count moderation logs
    const modLogCount = await prisma.moderationLog.count();
    console.log(`\n📋 Moderation Logs: ${modLogCount}`);

    // Count bookings
    const bookingCount = await prisma.booking.count();
    console.log(`\n📅 Bookings: ${bookingCount}`);

    console.log('\n✅ Data verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
