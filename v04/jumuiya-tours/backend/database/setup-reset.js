// database/setup-reset.js
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'jumuiya_tours',
  user: process.env.DB_USER || 'jumuiya_user',
  password: process.env.DB_PASSWORD || ''
};

async function resetDatabase() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔄 Starting database reset...');
    await client.connect();
    console.log('✅ Connected to database successfully!');

    // Drop existing tables in correct order (due to foreign key constraints)
    console.log('🗑️  Dropping existing tables...');
    
    const tables = [
      'notifications',
      'audit_logs',
      'moderation_logs', 
      'reviews',
      'bookings',
      'destinations',
      'users'
    ];

    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${table}: ${error.message}`);
      }
    }

    // Recreate tables using the setup function
    console.log('🗃️ Recreating database tables...');
    
    // Users table
    await client.query(`
      CREATE TABLE users (
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
        
        CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
      );
      
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
      CREATE INDEX idx_users_guide_status ON users(guide_status);
      CREATE INDEX idx_users_created_at ON users(created_at);
    `);
    console.log('✅ Recreated users table');

    // Destinations table
    await client.query(`
      CREATE TABLE destinations (
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
        
        CONSTRAINT destination_name_length CHECK (char_length(name) >= 3)
      );
      
      CREATE INDEX idx_destinations_status ON destinations(status);
      CREATE INDEX idx_destinations_created_by ON destinations(created_by);
      CREATE INDEX idx_destinations_approved_by ON destinations(approved_by);
      CREATE INDEX idx_destinations_featured ON destinations(featured);
      CREATE INDEX idx_destinations_created_at ON destinations(created_at);
      CREATE INDEX idx_destinations_location ON destinations(location);
    `);
    console.log('✅ Recreated destinations table');

    // Bookings table
    await client.query(`
      CREATE TABLE bookings (
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
        
        CONSTRAINT valid_booking_date CHECK (booking_date >= CURRENT_DATE)
      );
      
      CREATE INDEX idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX idx_bookings_destination_id ON bookings(destination_id);
      CREATE INDEX idx_bookings_guide_id ON bookings(guide_id);
      CREATE INDEX idx_bookings_status ON bookings(status);
      CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
      CREATE INDEX idx_bookings_created_at ON bookings(created_at);
    `);
    console.log('✅ Recreated bookings table');

    // Reviews table
    await client.query(`
      CREATE TABLE reviews (
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
        
        CONSTRAINT one_review_per_booking UNIQUE (booking_id)
      );
      
      CREATE INDEX idx_reviews_destination_id ON reviews(destination_id);
      CREATE INDEX idx_reviews_user_id ON reviews(user_id);
      CREATE INDEX idx_reviews_guide_id ON reviews(guide_id);
      CREATE INDEX idx_reviews_rating ON reviews(rating);
      CREATE INDEX idx_reviews_created_at ON reviews(created_at);
    `);
    console.log('✅ Recreated reviews table');

    // Moderation logs table
    await client.query(`
      CREATE TABLE moderation_logs (
        id SERIAL PRIMARY KEY,
        content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('destination', 'guide_verification', 'review', 'user')),
        content_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'suspended', 'featured', 'unfeatured', 'reported', 'hidden')),
        moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notes TEXT,
        previous_values JSONB,
        new_values JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX idx_moderation_logs_content_type ON moderation_logs(content_type);
      CREATE INDEX idx_moderation_logs_content_id ON moderation_logs(content_id);
      CREATE INDEX idx_moderation_logs_moderator_id ON moderation_logs(moderator_id);
      CREATE INDEX idx_moderation_logs_created_at ON moderation_logs(created_at);
    `);
    console.log('✅ Recreated moderation_logs table');

    // Audit logs table
    await client.query(`
      CREATE TABLE audit_logs (
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
        
        CONSTRAINT valid_status_code CHECK (status_code >= 100 AND status_code <= 599)
      );
      
      CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type, resource_id);
      CREATE INDEX idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
      CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
    `);
    console.log('✅ Recreated audit_logs table');

    // Notifications table
    await client.query(`
      CREATE TABLE notifications (
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
        
        CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
      );
      
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_type ON notifications(type);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX idx_notifications_priority ON notifications(priority);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at);
    `);
    console.log('✅ Recreated notifications table');

    // Create initial admin user
    console.log('👨‍💼 Creating initial admin user...');
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
    
    const adminResult = await client.query(`
      INSERT INTO users (email, password_hash, name, role) 
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role
    `, [
      process.env.ADMIN_EMAIL || 'admin@jumuiya.com', 
      hashedPassword, 
      'System Administrator', 
      'admin'
    ]);

    console.log('✅ Admin user created:', adminResult.rows[0]);

    // Create sample guide user
    console.log('👨‍🏫 Creating sample guide user...');
    const guidePassword = await bcrypt.hash('Guide123!', 12);
    const guideResult = await client.query(`
      INSERT INTO users (email, password_hash, name, role, guide_status) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role, guide_status
    `, ['guide@jumuiya.com', guidePassword, 'Sample Guide', 'guide', 'verified']);

    console.log('✅ Guide user created:', guideResult.rows[0]);

    // Create sample auditor user
    console.log('👨‍💻 Creating sample auditor user...');
    const auditorPassword = await bcrypt.hash('Auditor123!', 12);
    const auditorResult = await client.query(`
      INSERT INTO users (email, password_hash, name, role) 
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role
    `, ['auditor@jumuiya.com', auditorPassword, 'Sample Auditor', 'auditor']);

    console.log('✅ Auditor user created:', auditorResult.rows[0]);

    // Create sample destinations
    console.log('🗺️ Creating sample destinations...');
    
    const sampleDestinations = [
      {
        name: 'Bwindi Impenetrable Forest',
        description: 'Home to nearly half of the world\'s mountain gorillas. Experience the thrill of gorilla trekking in one of Africa\'s most biodiverse forests.',
        short_description: 'Gorilla trekking in ancient rainforest',
        location: 'Southwestern Uganda',
        region: 'Western',
        price_range: 'From $700',
        duration: '1-3 days',
        difficulty_level: 'moderate',
        best_season: 'June-August, December-February',
        highlights: ['Gorilla Trekking', 'Bird Watching', 'Primates', 'Rainforest Experience'],
        included: ['Park fees', 'Guide services', 'Lunch'],
        not_included: ['Travel insurance', 'Personal expenses'],
        requirements: 'Good physical fitness, trekking gear',
        status: 'approved',
        featured: true
      },
      {
        name: 'Murchison Falls National Park',
        description: 'Uganda\'s largest national park, famous for the powerful Murchison Falls where the Nile River forces its way through a narrow gorge.',
        short_description: 'Wildlife safari and Nile cruise',
        location: 'Northwestern Uganda',
        region: 'Northern',
        price_range: 'From $500',
        duration: '2-4 days',
        difficulty_level: 'easy',
        best_season: 'December-February',
        highlights: ['Game Drives', 'Nile Cruise', 'Waterfalls', 'Wildlife'],
        included: ['Park fees', 'Accommodation', 'Game drives'],
        not_included: ['Beverages', 'Tips'],
        requirements: 'Camera, binoculars',
        status: 'approved',
        featured: false
      },
      {
        name: 'Queen Elizabeth National Park',
        description: 'Known for its diverse ecosystems including savanna, wetlands, and forests. Home to tree-climbing lions and abundant wildlife.',
        short_description: 'Diverse wildlife and scenic landscapes',
        location: 'Western Uganda',
        region: 'Western',
        price_range: 'From $450',
        duration: '2-3 days',
        difficulty_level: 'easy',
        best_season: 'All year',
        highlights: ['Tree-climbing Lions', 'Kazinga Channel', 'Bird Watching', 'Game Drives'],
        included: ['Park entry', 'Guide', 'Boat cruise'],
        not_included: ['Accommodation', 'Meals'],
        requirements: 'None',
        status: 'approved',
        featured: true
      }
    ];

    for (const destination of sampleDestinations) {
      const result = await client.query(`
        INSERT INTO destinations 
        (name, description, short_description, location, region, price_range, duration, difficulty_level, best_season, highlights, included, not_included, requirements, created_by, status, approved_by, approved_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
        RETURNING id, name
      `, [
        destination.name,
        destination.description,
        destination.short_description,
        destination.location,
        destination.region,
        destination.price_range,
        destination.duration,
        destination.difficulty_level,
        destination.best_season,
        JSON.stringify(destination.highlights),
        JSON.stringify(destination.included),
        JSON.stringify(destination.not_included),
        destination.requirements,
        guideResult.rows[0].id,
        destination.status,
        adminResult.rows[0].id
      ]);
      
      console.log(`✅ Created destination: ${result.rows[0].name}`);
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📧 Default Users Created:');
    console.log('   Admin:    admin@jumuiya.com / Admin123!');
    console.log('   Guide:    guide@jumuiya.com / Guide123!');
    console.log('   Auditor:  auditor@jumuiya.com / Auditor123!');
    console.log('\n🗺️ Sample Destinations: 3 created');
    console.log('\n⚠️  Change these passwords in production!');

  } catch (error) {
    console.error('💥 Database reset error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run reset if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetDatabase();
}

export { resetDatabase };
