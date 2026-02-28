// backend/check-database.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database with your .env credentials...');
    
    // Test connection
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('✅ Database connection successful');

    // Check all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\n📊 Tables found in database:');
    if (tables.length === 0) {
      console.log('   No tables found!');
    } else {
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // Try to count records in each expected table
    console.log('\n🔍 Checking table records:');
    
    const expectedTables = ['users', 'destinations', 'moderation_logs', 'audit_logs', 'bookings', 'reviews', 'notifications'];
    
    for (const tableName of expectedTables) {
      try {
        // Convert table name to Prisma model name
        const modelName = tableName === 'users' ? 'user' : 
                         tableName === 'moderation_logs' ? 'moderationLog' :
                         tableName === 'audit_logs' ? 'auditLog' :
                         tableName.slice(0, -1); // Remove 's' for plural
        
        const count = await prisma[modelName].count();
        console.log(`✅ ${tableName}: ${count} records`);
      } catch (error) {
        if (error.code === 'P2021') {
          console.log(`❌ ${tableName}: Table does not exist`);
        } else if (error.message.includes('prisma[') || error.message.includes('is not a function')) {
          console.log(`❌ ${tableName}: Model not available in Prisma client`);
        } else {
          console.log(`❌ ${tableName}: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
