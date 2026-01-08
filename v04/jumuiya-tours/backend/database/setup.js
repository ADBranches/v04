// database/setup.js
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'jumuiya_user',
  password: process.env.DB_PASSWORD || '',
  database: 'postgres'
});

async function setupDatabase() {
  try {
    console.log('🔄 Starting database setup...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'jumuiya_tours']
    );

    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating database...');
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'jumuiya_tours'}`);
      console.log(`✅ Database ${process.env.DB_NAME || 'jumuiya_tours'} created successfully`);
    } else {
      console.log(`✅ Database ${process.env.DB_NAME || 'jumuiya_tours'} already exists`);
    }

    await client.end();

    // Connect to our database to create tables
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'jumuiya_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jumuiya_tours'
    });

    await dbClient.connect();
    console.log('✅ Connected to application database');

    // Enable UUID extension
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');

    // Create tables
    console.log('🗃️ Creating database tables...');

    // Users table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'auditor', 'guide', 'user')),
        guide_status VARCHAR(50) DEFAULT 'unverified' CHECK (guide_status IN ('unverified', 'pending', 'verified', 'suspended')),
        verification_submitted_at TIMESTAMP WITH TIME ZONE,
        verified_at TIMESTAMP WITH TIME ZONE,
        verified_by INTEGER REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        avatar_url VARCHAR(500),
        phone_number VARCHAR(20),
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes for better performance
        CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_guide_status ON users(guide_status);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `);
    console.log('✅ Created users table');

    // Destinations table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS destinations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        location VARCHAR(255) NOT NULL,
        region VARCHAR(100),
        coordinates POINT,
        price_range VARCHAR(50) DEFAULT 'Contact for price',
        duration VARCHAR(50),
        difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'moderate', 'difficult', 'expert')),
        best_season VARCHAR(100),
        images JSONB DEFAULT '[]',
        highlights JSONB DEFAULT '[]',
        included JSONB DEFAULT '[]',
        not_included JSONB DEFAULT '[]',
        requirements TEXT,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        submitted_at TIMESTAMP WITH TIME ZONE,
        approved_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        featured BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        CONSTRAINT destination_name_length CHECK (char_length(name) >= 3)
      );
      
      CREATE INDEX IF NOT EXISTS idx_destinations_status ON destinations(status);
      CREATE INDEX IF NOT EXISTS idx_destinations_created_by ON destinations(created_by);
      CREATE INDEX IF NOT EXISTS idx_destinations_approved_by ON destinations(approved_by);
      CREATE INDEX IF NOT EXISTS idx_destinations_featured ON destinations(featured);
      CREATE INDEX IF NOT EXISTS idx_destinations_created_at ON destinations(created_at);
      CREATE INDEX IF NOT EXISTS idx_destinations_location ON destinations(location);
    `);
    console.log('✅ Created destinations table');

    // Bookings table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
        guide_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        booking_date DATE NOT NULL,
        number_of_people INTEGER NOT NULL CHECK (number_of_people > 0),
        total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
        currency VARCHAR(3) DEFAULT 'UGX',
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')),
        special_requests TEXT,
        customer_notes TEXT,
        internal_notes TEXT,
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        payment_method VARCHAR(50),
        payment_reference VARCHAR(255),
        cancellation_reason TEXT,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        CONSTRAINT valid_booking_date CHECK (booking_date >= CURRENT_DATE)
      );
      
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_destination_id ON bookings(destination_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_guide_id ON bookings(guide_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
      CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
    `);
    console.log('✅ Created bookings table');

    // Reviews table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        guide_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(200),
        comment TEXT,
        guide_rating INTEGER CHECK (guide_rating >= 1 AND guide_rating <= 5),
        guide_comment TEXT,
        is_verified BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'reported')),
        reported_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        CONSTRAINT one_review_per_booking UNIQUE (booking_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_reviews_destination_id ON reviews(destination_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_guide_id ON reviews(guide_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
      CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
    `);
    console.log('✅ Created reviews table');

    // Moderation logs table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id SERIAL PRIMARY KEY,
        content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('destination', 'guide_verification', 'review', 'user')),
        content_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'suspended', 'featured', 'unfeatured', 'reported', 'hidden')),
        moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notes TEXT,
        previous_values JSONB,
        new_values JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        CONSTRAINT valid_content_reference CHECK (
          (content_type = 'destination' AND content_id IN (SELECT id FROM destinations)) OR
          (content_type = 'guide_verification' AND content_id IN (SELECT id FROM users)) OR
          (content_type = 'review' AND content_id IN (SELECT id FROM reviews)) OR
          (content_type = 'user' AND content_id IN (SELECT id FROM users))
        )
      );
      
      CREATE INDEX IF NOT EXISTS idx_moderation_logs_content_type ON moderation_logs(content_type);
      CREATE INDEX IF NOT EXISTS idx_moderation_logs_content_id ON moderation_logs(content_id);
      CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON moderation_logs(moderator_id);
      CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at);
    `);
    console.log('✅ Created moderation_logs table');

    // Audit logs table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        request_method VARCHAR(10),
        request_url TEXT,
        status_code INTEGER,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        CONSTRAINT valid_status_code CHECK (status_code >= 100 AND status_code <= 599)
      );
      
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type, resource_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
    `);
    console.log('✅ Created audit_logs table');

    // Notifications table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('booking', 'destination', 'guide', 'system', 'message')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP WITH TIME ZONE,
        action_url VARCHAR(500),
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `);
    console.log('✅ Created notifications table');

    // Create admin user if not exists
    console.log('👨‍💼 Setting up default users...');
    
    const adminCheck = await dbClient.query(
      'SELECT id FROM users WHERE email = $1',
      [process.env.ADMIN_EMAIL || 'admin@jumuiya.com']
    );

    if (adminCheck.rows.length === 0) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
      
      await dbClient.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, 'admin')`,
        [process.env.ADMIN_EMAIL || 'admin@jumuiya.com', passwordHash, 'System Administrator']
      );
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create sample guide user
    const guideCheck = await dbClient.query(
      'SELECT id FROM users WHERE email = $1',
      ['guide@jumuiya.com']
    );

    if (guideCheck.rows.length === 0) {
      const guidePassword = await bcrypt.hash('Guide123!', 12);
      
      await dbClient.query(
        `INSERT INTO users (email, password_hash, name, role, guide_status) 
         VALUES ($1, $2, $3, 'guide', 'verified')`,
        ['guide@jumuiya.com', guidePassword, 'Sample Guide']
      );
      console.log('✅ Sample guide user created');
    }

    // Create sample auditor user
    const auditorCheck = await dbClient.query(
      'SELECT id FROM users WHERE email = $1',
      ['auditor@jumuiya.com']
    );

    if (auditorCheck.rows.length === 0) {
      const auditorPassword = await bcrypt.hash('Auditor123!', 12);
      
      await dbClient.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, 'auditor')`,
        ['auditor@jumuiya.com', auditorPassword, 'Sample Auditor']
      );
      console.log('✅ Sample auditor user created');
    }

    // Create sample destinations
    console.log('🗺️ Creating sample destinations...');
    
    const destinationsCheck = await dbClient.query('SELECT COUNT(*) FROM destinations');
    
    if (parseInt(destinationsCheck.rows[0].count) === 0) {
      const guideResult = await dbClient.query('SELECT id FROM users WHERE email = $1', ['guide@jumuiya.com']);
      const guideId = guideResult.rows[0]?.id;

      if (guideId) {
        const sampleDestinations = [
          {
            name: 'Bwindi Impenetrable Forest',
            description: 'Home to nearly half of the world\'s mountain gorillas. Experience the thrill of gorilla trekking in one of Africa\'s most biodiverse forests.',
            location: 'Southwestern Uganda',
            region: 'Western',
            price_range: 'From $700',
            duration: '1-3 days',
            difficulty_level: 'moderate',
            best_season: 'June-August, December-February',
            highlights: ['Gorilla Trekking', 'Bird Watching', 'Primates', 'Rainforest Experience'],
            status: 'approved'
          },
          {
            name: 'Murchison Falls National Park',
            description: 'Uganda\'s largest national park, famous for the powerful Murchison Falls where the Nile River forces its way through a narrow gorge.',
            location: 'Northwestern Uganda',
            region: 'Northern',
            price_range: 'From $500',
            duration: '2-4 days',
            difficulty_level: 'easy',
            best_season: 'December-February',
            highlights: ['Game Drives', 'Nile Cruise', 'Waterfalls', 'Wildlife'],
            status: 'approved'
          }
        ];

        for (const destination of sampleDestinations) {
          await dbClient.query(
            `INSERT INTO destinations 
             (name, description, location, region, price_range, duration, difficulty_level, best_season, highlights, created_by, status, approved_by, approved_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)`,
            [
              destination.name,
              destination.description,
              destination.location,
              destination.region,
              destination.price_range,
              destination.duration,
              destination.difficulty_level,
              destination.best_season,
              JSON.stringify(destination.highlights),
              guideId,
              destination.status,
              guideId
            ]
          );
        }
        console.log('✅ Sample destinations created');
      }
    } else {
      console.log('✅ Destinations already exist');
    }

    await dbClient.end();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Setup Summary:');
    console.log('   ✅ Database & tables created');
    console.log('   ✅ Indexes optimized');
    console.log('   ✅ Default users created');
    console.log('   ✅ Sample data added');
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Admin:    admin@jumuiya.com / Admin123!');
    console.log('   Guide:    guide@jumuiya.com / Guide123!');
    console.log('   Auditor:  auditor@jumuiya.com / Auditor123!');
    console.log('\n⚠️  Change these passwords in production!');

  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };