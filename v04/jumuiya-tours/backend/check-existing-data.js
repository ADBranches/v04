// backend/check-existing-data.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExistingData() {
  try {
    console.log('🔍 Checking existing data in current tables...');
    
    // Check User table (capital U)
    const users = await prisma.$queryRaw`SELECT * FROM "User"`;
    console.log(`📊 User table has ${users.length} records`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.name})`);
    });
    
    // Check Destination table (capital D)
    const destinations = await prisma.$queryRaw`SELECT * FROM "Destination"`;
    console.log(`📊 Destination table has ${destinations.length} records`);
    destinations.forEach(dest => {
      console.log(`   - ${dest.name} (${dest.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking existing data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingData();
