// backend/check-tables.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Found tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Check if specific tables exist and have data
    console.log('\n🔍 Checking specific tables:');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table exists with ${userCount} records`);
    } catch (error) {
      console.log('❌ Users table error:', error.message);
    }

    try {
      const destinationCount = await prisma.destination.count();
      console.log(`✅ Destinations table exists with ${destinationCount} records`);
    } catch (error) {
      console.log('❌ Destinations table error:', error.message);
    }

    try {
      const moderationCount = await prisma.moderationLog.count();
      console.log(`✅ ModerationLogs table exists with ${moderationCount} records`);
    } catch (error) {
      console.log('❌ ModerationLogs table error:', error.message);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
