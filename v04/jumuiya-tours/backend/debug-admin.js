// backend/debug-admin.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';

async function debugAdminEndpoints() {
  console.log('🔍 Debugging Admin Endpoints\n');
  
  const admin = await prisma.user.findUnique({ where: { email: 'admin@jumuiya.com' } });
  const token = jwt.sign(
    { userId: admin.id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Test admin endpoints directly
  console.log('1. Testing /api/admin/users...');
  const usersResponse = await fetch(`${BASE_URL}/admin/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const usersData = await usersResponse.json();
  console.log(`   Status: ${usersResponse.status}`);
  console.log(`   Response:`, usersData);
  
  console.log('\n2. Testing /api/admin/stats...');
  const statsResponse = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsData = await statsResponse.json();
  console.log(`   Status: ${statsResponse.status}`);
  console.log(`   Response:`, statsData);

  // Let's also check what's in the admin route file
  console.log('\n3. Checking admin route implementation...');
  try {
    const adminRoutes = await import('./routes/admin.js');
    console.log('   ✅ Admin routes loaded successfully');
  } catch (error) {
    console.log('   ❌ Error loading admin routes:', error.message);
  }

  // Check database connectivity for admin endpoints
  console.log('\n4. Testing database queries that admin endpoints might use...');
  
  try {
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`   ✅ User count: ${userCount}`);
    
    // Test destination count by status
    const destCounts = await prisma.destination.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log(`   ✅ Destination counts:`, destCounts);
    
    // Test guide status counts
    const guideCounts = await prisma.user.groupBy({
      by: ['guide_status'],
      where: { role: 'guide' },
      _count: { id: true }
    });
    console.log(`   ✅ Guide status counts:`, guideCounts);
    
    // Test booking counts
    const bookingCount = await prisma.booking.count();
    console.log(`   ✅ Booking count: ${bookingCount}`);
    
  } catch (error) {
    console.log('   ❌ Database query error:', error.message);
  }
}

debugAdminEndpoints()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
