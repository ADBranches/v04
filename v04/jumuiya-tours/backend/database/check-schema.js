// database/check-schema.js
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'jumuiya_tours',
  user: process.env.DB_USER || 'jumuiya_user',
  password: process.env.DB_PASSWORD || '',
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('🔍 Checking database schema...\n');

    // Get database information
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version,
        pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    console.log('📊 DATABASE INFORMATION:');
    console.log(`   Database: ${dbInfo.rows[0].database}`);
    console.log(`   User: ${dbInfo.rows[0].user}`);
    console.log(`   Version: ${dbInfo.rows[0].version.split(' ').slice(0, 3).join(' ')}`);
    console.log(`   Size: ${dbInfo.rows[0].size}\n`);

    // Get all tables
    const tables = await client.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('🗃️ DATABASE TABLES:');
    tables.rows.forEach(table => {
      console.log(`   ${table.table_type === 'BASE TABLE' ? '📋' : '👁️'} ${table.table_name}`);
    });
    console.log('');

    // Check each table in detail
    for (const table of tables.rows) {
      if (table.table_type === 'BASE TABLE') {
        await checkTableDetails(table.table_name);
      }
    }

    // Check indexes
    await checkIndexes();

    // Check data counts
    await checkDataCounts();

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await client.end();
  }
}

async function checkTableDetails(tableName) {
  const columns = await client.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns 
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);

  console.log(`📋 ${tableName.toUpperCase()} TABLE STRUCTURE:`);
  columns.rows.forEach(col => {
    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
    const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
    console.log(`   ${col.column_name} ${col.data_type}${length} ${nullable}${defaultValue}`);
  });

  // Get row count
  const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
  console.log(`   📈 Row count: ${countResult.rows[0].count}\n`);
}

async function checkIndexes() {
  const indexes = await client.query(`
    SELECT 
      tablename,
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);

  console.log('🔍 DATABASE INDEXES:');
  indexes.rows.forEach(index => {
    console.log(`   ${index.tablename}.${index.indexname}`);
  });
  console.log('');
}

async function checkDataCounts() {
  console.log('📊 DATA SUMMARY:');
  
  const tables = ['users', 'destinations', 'bookings', 'reviews', 'moderation_logs', 'audit_logs', 'notifications'];
  
  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ${table}: ${result.rows[0].count} records`);
    } catch (error) {
      console.log(`   ${table}: Table does not exist`);
    }
  }
  console.log('');

  // Check user roles distribution
  try {
    const userRoles = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);
    
    console.log('👥 USER ROLES DISTRIBUTION:');
    userRoles.rows.forEach(role => {
      console.log(`   ${role.role}: ${role.count} users`);
    });
  } catch (error) {
    // Table might not exist yet
  }
  console.log('');

  // Check destination status distribution
  try {
    const destinationStatus = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM destinations 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('🗺️ DESTINATION STATUS DISTRIBUTION:');
    destinationStatus.rows.forEach(status => {
      console.log(`   ${status.status}: ${status.count} destinations`);
    });
  } catch (error) {
    // Table might not exist yet
  }
}

// Run check if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSchema();
}

export { checkSchema };
