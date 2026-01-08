// database/fix-users.js
import { Client } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'jumuiya_tours',
  user: process.env.DB_USER || 'jumuiya_user',
  password: process.env.DB_PASSWORD || '',
});

async function fixUsersTable() {
  try {
    await client.connect();
    console.log('🔧 Starting users table fix...');

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist. Run setup script first.');
      return;
    }

    // Check if password_hash column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('➕ Adding password_hash column to users table...');
      
      // Add the password_hash column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN password_hash VARCHAR(255)
      `);
      
      console.log('✅ Added password_hash column');
      
      // Check if old password column exists and migrate data
      const oldPasswordCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
      `);

      if (oldPasswordCheck.rows.length > 0) {
        console.log('🔄 Migrating old passwords to password_hash...');
        
        // Get users with old passwords
        const users = await client.query(`
          SELECT id, password 
          FROM users 
          WHERE password IS NOT NULL AND password_hash IS NULL
        `);
        
        console.log(`📋 Found ${users.rows.length} users to migrate`);
        
        for (const user of users.rows) {
          try {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            await client.query(
              'UPDATE users SET password_hash = $1 WHERE id = $2',
              [hashedPassword, user.id]
            );
          } catch (error) {
            console.error(`❌ Error migrating user ${user.id}:`, error.message);
          }
        }
        console.log(`✅ Migrated ${users.rows.length} user passwords`);
      } else {
        // Set default passwords for existing users without passwords
        console.log('🔑 Setting default passwords for existing users...');
        
        const usersWithoutPassword = await client.query(`
          SELECT id, email 
          FROM users 
          WHERE password_hash IS NULL
        `);
        
        console.log(`📋 Found ${usersWithoutPassword.rows.length} users without passwords`);
        
        for (const user of usersWithoutPassword.rows) {
          const defaultPassword = await bcrypt.hash('TempPassword123!', 12);
          await client.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [defaultPassword, user.id]
          );
        }
        console.log(`⚠️  Set temporary passwords for ${usersWithoutPassword.rows.length} users`);
      }

      // Make password_hash NOT NULL after populating
      await client.query(`
        ALTER TABLE users 
        ALTER COLUMN password_hash SET NOT NULL
      `);
      console.log('✅ Set password_hash as NOT NULL');
    } else {
      console.log('✅ password_hash column already exists');
    }

    // Check and fix other required columns
    const requiredColumns = [
      { name: 'email', type: 'VARCHAR(255)', nullable: false },
      { name: 'name', type: 'VARCHAR(255)', nullable: false },
      { name: 'role', type: 'VARCHAR(50)', nullable: false, default: "'user'" },
      { name: 'guide_status', type: 'VARCHAR(50)', nullable: true, default: "'unverified'" },
      { name: 'is_active', type: 'BOOLEAN', nullable: true, default: 'true' }
    ];

    for (const column of requiredColumns) {
      const check = await client.query(`
        SELECT column_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = $1
      `, [column.name]);

      if (check.rows.length === 0) {
        console.log(`➕ Adding missing column: ${column.name}`);
        
        let query = `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`;
        if (column.default) query += ` DEFAULT ${column.default}`;
        if (!column.nullable) query += ' NOT NULL';
        
        await client.query(query);
        console.log(`✅ Added column: ${column.name}`);
      } else {
        const current = check.rows[0];
        
        // Check if nullable status needs updating
        if (!column.nullable && current.is_nullable === 'YES') {
          console.log(`🔄 Making column NOT NULL: ${column.name}`);
          await client.query(`ALTER TABLE users ALTER COLUMN ${column.name} SET NOT NULL`);
        }
        
        // Check if default needs updating
        if (column.default && current.column_default !== column.default) {
          console.log(`🔄 Setting default for column: ${column.name}`);
          await client.query(`ALTER TABLE users ALTER COLUMN ${column.name} SET DEFAULT ${column.default}`);
        }
      }
    }

    // Create admin user if it doesn't exist
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [process.env.ADMIN_EMAIL || 'admin@jumuiya.com']
    );

    if (adminCheck.rows.length === 0) {
      console.log('👨‍💼 Creating admin user...');
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
      
      await client.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, 'admin')`,
        [process.env.ADMIN_EMAIL || 'admin@jumuiya.com', passwordHash, 'System Administrator']
      );
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create indexes if they don't exist
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_guide_status ON users(guide_status)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)'
    ];

    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    console.log('✅ Database indexes created/verified');

    // Verify the fix
    const verification = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as users_with_password,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'guide' THEN 1 END) as guide_users,
        COUNT(CASE WHEN role = 'auditor' THEN 1 END) as auditor_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
      FROM users
    `);

    const stats = verification.rows[0];
    console.log('\n📊 USERS TABLE STATUS:');
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   Users with passwords: ${stats.users_with_password}`);
    console.log(`   Admin users: ${stats.admin_users}`);
    console.log(`   Guide users: ${stats.guide_users}`);
    console.log(`   Auditor users: ${stats.auditor_users}`);
    console.log(`   Regular users: ${stats.regular_users}`);

    console.log('\n🎉 Users table fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing users table:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

// Run fix if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixUsersTable();
}

export { fixUsersTable };