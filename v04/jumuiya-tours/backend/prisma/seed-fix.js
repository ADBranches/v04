// backend/prisma/seed-fix.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting fixed database seed...');

  // Create sample users (this part works)
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

  // Fetch user IDs for destinations
  const admin = await prisma.user.findUnique({ where: { email: 'admin@jumuiya.com' } });
  const guide = await prisma.user.findUnique({ where: { email: 'guide@jumuiya.com' } });
  const auditor = await prisma.user.findUnique({ where: { email: 'auditor@jumuiya.com' } });
  const pendingGuide = await prisma.user.findUnique({ where: { email: 'pendingguide@jumuiya.com' } });

  console.log('\n🗺️ Creating destinations...');

  // Create Uganda-specific destinations - USE CREATE INSTEAD OF UPSERT
  const destinations = [
    {
      name: 'Bwindi Impenetrable Forest',
      description: 'Home to nearly half of the world\'s mountain gorillas, offering an unforgettable trekking experience in Uganda\'s lush rainforest.',
      short_description: 'Gorilla trekking in Uganda\'s lush rainforest.',
      location: 'Kanungu District',
      region: 'Western',
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

  for (const dest of destinations) {
    try {
      // Use createMany or individual create
      await prisma.destination.create({
        data: dest,
      });
      console.log(`✅ Destination created: ${dest.name}`);
    } catch (error) {
      console.log(`⚠️ Destination ${dest.name} might already exist: ${error.message}`);
    }
  }

  // Get destination IDs for moderation logs
  const bwindi = await prisma.destination.findFirst({ where: { name: 'Bwindi Impenetrable Forest' } });
  const murchison = await prisma.destination.findFirst({ where: { name: 'Murchison Falls National Park' } });
  const queenElizabeth = await prisma.destination.findFirst({ where: { name: 'Queen Elizabeth National Park' } });
  const bunyonyi = await prisma.destination.findFirst({ where: { name: 'Lake Bunyonyi' } });

  console.log('\n📋 Creating moderation logs...');

  // Create moderation logs
  const moderationLogs = [
    {
      content_type: 'destination',
      content_id: murchison.id,
      action: 'submitted',
      moderator_id: guide.id,
      notes: 'Destination submitted for review by guide',
      previous_values: { status: 'draft' },
      new_values: { status: 'pending', submitted_at: new Date() },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      content_type: 'destination',
      content_id: bwindi.id,
      action: 'approved',
      moderator_id: admin.id,
      notes: 'Destination meets all quality standards and requirements for gorilla trekking',
      previous_values: { status: 'pending' },
      new_values: { status: 'approved', approved_by: admin.id, approved_at: new Date() },
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      content_type: 'destination',
      content_id: queenElizabeth.id,
      action: 'approved',
      moderator_id: auditor.id,
      notes: 'Excellent destination with proper documentation and safety measures',
      previous_values: { status: 'pending' },
      new_values: { status: 'approved', approved_by: auditor.id, approved_at: new Date() },
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  ];

  for (const log of moderationLogs) {
    await prisma.moderationLog.create({
      data: log,
    });
    console.log(`✅ Moderation log created for ${log.content_type} #${log.content_id}`);
  }

  console.log('\n🎉 Fixed seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error in fixed seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
