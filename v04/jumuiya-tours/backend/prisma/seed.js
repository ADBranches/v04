// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const users = [
    {
      email: 'admin@jumuiya.com',
      password_hash: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      role: 'admin',
      guide_status: 'unverified',
    },
    {
      email: 'guide@jumuiya.com',
      password_hash: await bcrypt.hash('guide123', 10),
      name: 'John Guide',
      role: 'guide',
      guide_status: 'verified',
      bio: 'Experienced tour guide with 5 years of experience in Ugandan wildlife and cultural tours.',
      phone_number: '+256712345678',
    },
    {
      email: 'auditor@jumuiya.com',
      password_hash: await bcrypt.hash('auditor123', 10),
      name: 'Auditor User',
      role: 'auditor',
      guide_status: 'unverified',
    },
    {
      email: 'user@jumuiya.com',
      password_hash: await bcrypt.hash('user123', 10),
      name: 'Regular User',
      role: 'user',
      guide_status: 'unverified',
    },
    {
      email: 'pendingguide@jumuiya.com',
      password_hash: await bcrypt.hash('pending123', 10),
      name: 'Pending Guide',
      role: 'guide',
      guide_status: 'pending',
      verification_submitted_at: new Date(),
      verification_documents: ['document1.pdf', 'document2.pdf'], // ← NEW
      bio: 'New guide seeking verification for wildlife tours.',
      phone_number: '+256723456789',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`✅ User created/updated: ${user.email}`);
  }

  // Delete existing data in correct order to avoid foreign key constraints
  console.log('🗑️ Cleaning existing data...');

  try {
    // 1️⃣ Delete dependent child records first (in correct order)
    await prisma.booking.deleteMany();
    await prisma.review.deleteMany();
    await prisma.moderationLog.deleteMany(); // no filter, clears all types
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.guideVerification.deleteMany();

    // 2️⃣ Finally, delete parent entities
    await prisma.destination.deleteMany();

    console.log('✅ Existing data cleaned successfully.');
  } catch (err) {
    console.error('❌ Error cleaning existing data:', err.message);
    if (err.code === 'P2003') {
      console.error(`💡 Hint: Foreign key constraint violation — check dependent ModerationLog or Booking entries before deleting Destination.`);
    }
    throw err; // rethrow to stop further seeding if cleanup fails
  }


  // Fetch user IDs for destinations
  const admin = await prisma.user.findFirst({ where: { email: 'admin@jumuiya.com' } });
  const guide = await prisma.user.findFirst({ where: { email: 'guide@jumuiya.com' } });
  const auditor = await prisma.user.findFirst({ where: { email: 'auditor@jumuiya.com' } });
  const pendingGuide = await prisma.user.findFirst({ where: { email: 'pendingguide@jumuiya.com' } });

  // Add at line ~145 after fetching users:
  await prisma.destination.create({
    data: {
      name: 'Rwenzori Mountains',
      description: 'A great hiking spot.',
      short_description: 'Iconic hiking spot in western Uganda.',
      region: 'Western',
      location: 'Rwenzori Range',
      status: 'draft',
      created_by: guide.id,
    },
  });
  console.log('✅ Draft destination created for guide@jumuiya.com');

  // Create Uganda-specific destinations
  const destinations = [
    {
      name: 'Bwindi Impenetrable Forest',
      description: 'Home to nearly half of the world\'s mountain gorillas, offering an unforgettable trekking experience in Uganda\'s lush rainforest.',
      short_description: 'Gorilla trekking in Uganda\'s lush rainforest.',
      location: 'Kanungu District',
      region: 'Western',
      district: 'Kanungu',
      price_range: '$1000-$2000',
      duration: '3-5 days',
      difficulty_level: 'Challenging',
      best_season: 'June-September',
      highlights: ['Gorilla trekking', 'Bird watching', 'Cultural encounters'],
      included: ['Gorilla permits', 'Local guide', 'Accommodation'],
      not_included: ['International flights', 'Personal expenses'],
      requirements: 'Good physical fitness, hiking boots',
      status: 'approved',
      featured: true,
      view_count: 150,
      images: ['/images/bwindi.jpg'],
      created_by: admin.id,
      approved_by: admin.id,
      approved_at: new Date(),
    },
    {
      name: 'Murchison Falls National Park',
      description: 'Experience the dramatic Murchison Falls, where the Nile River squeezes through a narrow gorge, and enjoy game drives to spot lions, elephants, and giraffes.',
      short_description: 'Wildlife safaris and the mighty Murchison Falls.',
      location: 'Masindi District',
      region: 'Northern',
      district: 'Masindi',
      price_range: '$500-$1200',
      duration: '2-4 days',
      difficulty_level: 'Moderate',
      best_season: 'December-February',
      highlights: ['Boat safari', 'Game drives', 'Waterfall views'],
      included: ['Park fees', 'Guide', 'Boat trip'],
      not_included: ['Travel insurance', 'Tips'],
      requirements: 'Comfortable clothing, binoculars',
      status: 'pending',
      featured: false,
      view_count: 50,
      images: ['/images/murchison.jpg'],
      created_by: guide.id,
      submitted_at: new Date(),
    },
    {
      name: 'Queen Elizabeth National Park',
      description: 'A biodiversity hotspot with tree-climbing lions, hippos, and a variety of bird species, perfect for safaris and boat cruises.',
      short_description: 'Safaris and boat cruises in a biodiversity haven.',
      location: 'Kasese District',
      region: 'Western',
      district: 'Kasese',
      price_range: '$600-$1500',
      duration: '3-5 days',
      difficulty_level: 'Easy',
      best_season: 'January-March',
      highlights: ['Tree-climbing lions', 'Kazinga Channel cruise', 'Bird watching'],
      included: ['Park entry', 'Guide', 'Boat cruise'],
      not_included: ['Flights', 'Personal gear'],
      requirements: 'Sunscreen, hat',
      status: 'approved',
      featured: true,
      view_count: 200,
      images: ['/images/queen-elizabeth.jpg'],
      created_by: admin.id,
      approved_by: auditor.id,
      approved_at: new Date(),
    },
    {
      name: 'Lake Bunyonyi',
      description: 'The second deepest lake in Africa, known for its stunning scenery and 29 islands. Perfect for relaxation and water activities.',
      short_description: 'Serene lake with beautiful islands in southwestern Uganda.',
      location: 'Kabale District',
      region: 'Western',
      district: 'Kabale',
      price_range: '$200-$500',
      duration: '2-3 days',
      difficulty_level: 'Easy',
      best_season: 'Year-round',
      highlights: ['Canoeing', 'Island hopping', 'Bird watching'],
      included: ['Boat rides', 'Guide services', 'Accommodation'],
      not_included: ['Meals', 'Personal expenses'],
      requirements: 'Swimming gear, camera',
      status: 'draft',
      featured: false,
      view_count: 25,
      images: ['/images/bunyonyi.jpg'],
      created_by: pendingGuide.id,
    },
  ];

  for (const destinationData of destinations) {
    const existing = await prisma.destination.findFirst({
      where: { name: destinationData.name }
    });
    
    if (!existing) {
      const destination = await prisma.destination.create({
        data: destinationData
      });
      console.log(`✅ Destination created: ${destination.name}`);
    } else {
      console.log(`✅ Destination already exists: ${existing.name}`);
    }
  }

  // Get destination IDs for moderation logs
  const bwindi = await prisma.destination.findFirst({ where: { name: 'Bwindi Impenetrable Forest' } });
  const murchison = await prisma.destination.findFirst({ where: { name: 'Murchison Falls National Park' } });
  const queenElizabeth = await prisma.destination.findFirst({ where: { name: 'Queen Elizabeth National Park' } });
  const bunyonyi = await prisma.destination.findFirst({ where: { name: 'Lake Bunyonyi' } });

  // Create moderation logs
  const moderationLogs = [
    {
      content_type: 'destination',
      content_id: murchison.id,
      status: 'pending',
      action: 'submitted',
      submitted_by: guide.id,
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // ← NEW
      moderator_id: guide.id,
      notes: 'Destination submitted for review by guide',
      previous_values: { status: 'draft' },
      new_values: { status: 'pending', submitted_at: new Date() },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      content_type: 'destination',
      content_id: bwindi.id,
      status: 'approved',
      action: 'approved',
      submitted_by: admin.id, // ← NEW
      submitted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // ← NEW
      moderator_id: admin.id,
      notes: 'Destination meets all quality standards and requirements for gorilla trekking',
      previous_values: { status: 'pending' },
      new_values: { status: 'approved', approved_by: admin.id, approved_at: new Date() },
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      content_type: 'destination',
      content_id: queenElizabeth.id,
      status: 'approved',
      action: 'approved',
      submitted_by: admin.id, // ← NEW
      submitted_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // ← NEW
      moderator_id: auditor.id,
      notes: 'Excellent destination with proper documentation and safety measures',
      previous_values: { status: 'pending' },
      new_values: { status: 'approved', approved_by: auditor.id, approved_at: new Date() },
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      content_type: 'user',
      content_id: guide.id,
      action: 'verified',
      submitted_by: guide.id, // ← NEW
      submitted_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // ← NEW
      status: 'approved',
      moderator_id: admin.id,
      notes: 'Guide certification and experience verified successfully',
      previous_values: { guide_status: 'pending' },
      new_values: { guide_status: 'verified', verified_by: admin.id, verified_at: new Date() },
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      content_type: 'user',
      content_id: pendingGuide.id,
      status: 'pending',
      action: 'submitted',
      submitted_by: pendingGuide.id, // ← NEW
      submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // ← NEW
      moderator_id: pendingGuide.id,
      notes: 'Guide verification application submitted with required documents',
      previous_values: { guide_status: 'unverified' },
      new_values: { guide_status: 'pending', verification_submitted_at: new Date() },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      content_type: 'destination',
      content_id: bunyonyi.id,
      status: 'pending',
      action: 'created',
      submitted_by: pendingGuide.id, // ← NEW
      submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // ← NEW
      moderator_id: pendingGuide.id,
      notes: 'New destination created as draft',
      previous_values: {},
      new_values: { status: 'draft', created_by: pendingGuide.id },
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      content_type: 'destination',
      content_id: bunyonyi.id,
      status: 'rejected', // ← NEW
      action: 'rejected',
      submitted_by: pendingGuide.id, // ← NEW
      submitted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // ← NEW
      moderator_id: auditor.id,
      notes: 'Destination needs better images and detailed safety information',
      rejection_reason: 'Insufficient documentation and unclear safety protocols', // ← NEW
      previous_values: { status: 'pending' },
      new_values: { status: 'rejected', rejection_reason: 'Insufficient documentation' },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },

    
  ];
  // Create guide verification records
  // Create guide verification records - FIXED VERSION
  const guideVerifications = [
    {
      user_id: pendingGuide.id,
      credentials: {
        experience: "3 years in wildlife tours",
        certifications: ["First Aid", "Tour Guide License"],
        specialties: ["Wildlife", "Cultural Tours"],
        languages: ["English", "Swahili"]
      },
      documents: ["license.pdf", "certificate.pdf", "id_verification.pdf"],
      status: "pending",
      submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: guide.id,
      credentials: {
        experience: "5+ years in Ugandan tourism",
        certifications: ["Advanced First Aid", "Wildlife Guide Certification"],
        specialties: ["Gorilla Trekking", "Bird Watching", "Safari Tours"],
        languages: ["English", "Luganda", "Swahili"]
      },
      documents: ["advanced_license.pdf", "wildlife_cert.pdf"],
      status: "approved",
      submitted_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      reviewed_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      notes: "All documents verified and experience confirmed"
    }
  ];

  // ✅ FIX: Use upsert instead of create to handle existing records
  for (const verification of guideVerifications) {
    await prisma.guideVerification.upsert({
      where: {
        user_id_status: {  // Use the unique constraint name
          user_id: verification.user_id,
          status: verification.status
        }
      },
      update: verification,  // Update if exists
      create: verification,  // Create if doesn't exist
    });
    console.log(`✅ Guide verification ${verification.status} for user ${verification.user_id}`);
  }

  // ✅ SAFE CREATION: Moderation Logs with FK validation and descriptive logging
  console.log('🧾 Creating moderation logs...');
  for (const log of moderationLogs) {
    try {
      // 1️⃣ Validate presence of content_id
      if (!log.content_id) {
        console.warn(`⚠️ Skipping ${log.content_type} moderation log — missing content_id`);
        continue;
      }

      // 2️⃣ Validate destination existence for destination-type logs
      if (log.content_type === 'destination') {
        const destExists = await prisma.destination.findUnique({ where: { id: log.content_id } });
        if (!destExists) {
          console.warn(`⚠️ Skipping destination moderation log — no Destination found with id=${log.content_id}`);
          continue;
        }
      }

      // 3️⃣ Handle user-type logs without violating FK (no destination relation)
      const moderationData = {
        ...log,
        // content_id stays but is safe only if content_type === 'destination'
        ...(log.content_type === 'user' ? { content_id: null } : {}),
      };

      const created = await prisma.moderationLog.create({ data: moderationData });
      console.log(`✅ Moderation log created for ${log.content_type} #${log.content_id || 'N/A'} (ID ${created.id})`);
    } catch (err) {
      console.error(`❌ Failed moderation log for ${log.content_type} #${log.content_id || 'N/A'}: ${err.code || err.message}`);
    }
  }

  // Create sample bookings
  const regularUser = await prisma.user.findUnique({ where: { email: 'user@jumuiya.com' } });
  
  const bookings = [
    {
      user_id: regularUser.id,
      destination_id: bwindi.id,
      guide_id: guide.id,
      booking_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      number_of_people: 2,
      total_amount: 1800.00,
      currency: 'USD',
      status: 'confirmed',
      payment_status: 'paid',
      special_requests: 'Vegetarian meals required for both guests',
    },
    {
      user_id: regularUser.id,
      destination_id: queenElizabeth.id,
      booking_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      number_of_people: 4,
      total_amount: 2400.00,
      currency: 'USD',
      status: 'pending',
      payment_status: 'pending',
      special_requests: 'Need wheelchair accessible vehicle',
    },
  ];

  for (const booking of bookings) {
    await prisma.booking.create({
      data: booking,
    });
    console.log(`✅ Booking created for ${booking.number_of_people} people to destination ${booking.destination_id}`);
  }

  // Create audit logs
  const auditLogs = [
    {
      user_id: admin.id,
      action: 'user_login',
      resource_type: 'user',
      resource_id: admin.id,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      request_method: 'POST',
      request_url: '/api/auth/login',
      status_code: 200,
    },
    {
      user_id: guide.id,
      action: 'destination_created',
      resource_type: 'destination',
      resource_id: murchison.id,
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      request_method: 'POST',
      request_url: '/api/destinations',
      status_code: 201,
    },
    {
      user_id: auditor.id,
      action: 'destination_approved',
      resource_type: 'destination',
      resource_id: queenElizabeth.id,
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      request_method: 'PUT',
      request_url: `/api/destinations/${queenElizabeth.id}/approve`,
      status_code: 200,
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: log,
    });
    console.log(`✅ Audit log created for action: ${log.action}`);
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('📊 Sample data created:');
  console.log('   - 5 Users (Admin, Guide, Auditor, Regular User, Pending Guide)');
  console.log('   - 4 Destinations (2 approved, 1 pending, 1 draft)');
  console.log('   - 6 Moderation Logs');
  console.log('   - 2 Bookings');
  console.log('   - 3 Audit Logs');
  console.log('');
  console.log('🔐 Test Users:');
  console.log('   - Admin: admin@jumuiya.com / admin123');
  console.log('   - Guide: guide@jumuiya.com / guide123');
  console.log('   - Auditor: auditor@jumuiya.com / auditor123');
  console.log('   - User: user@jumuiya.com / user123');
  console.log('   - Pending Guide: pendingguide@jumuiya.com / pending123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });