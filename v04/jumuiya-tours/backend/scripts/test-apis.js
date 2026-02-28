// backend/test-api.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';

// Store tokens for different users
const tokens = {};

async function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function setupTestUsers() {
  console.log('🔐 Setting up test users and generating tokens...\n');
  
  const users = [
    { email: 'admin@jumuiya.com', role: 'admin' },
    { email: 'guide@jumuiya.com', role: 'guide' },
    { email: 'auditor@jumuiya.com', role: 'auditor' },
    { email: 'user@jumuiya.com', role: 'user' },
    { email: 'pendingguide@jumuiya.com', role: 'guide' }
  ];

  for (const userData of users) {
    const user = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (user) {
      const token = await generateToken(user);
      tokens[userData.role] = token;
      console.log(`✅ ${userData.role.toUpperCase()} Token: ${token.substring(0, 50)}...`);
    } else {
      console.log(`❌ User not found: ${userData.email}`);
    }
  }
  console.log('');
}

async function testAPI(endpoint, method = 'GET', data = null, role = 'admin') {
  const token = tokens[role];
  if (!token) {
    console.log(`❌ No token for role: ${role}`);
    return null;
  }

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    return {
      status: response.status,
      data: result
    };
  } catch (error) {
    console.error(`❌ API call failed: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');

  await setupTestUsers();

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  const health = await testAPI('/health');
  console.log(`   Status: ${health?.status}, Message: ${health?.data?.message}\n`);

  // Test 2: Get Destinations (Public)
  console.log('2. Testing Get Destinations (Public)...');
  const destinations = await testAPI('/destinations');
  console.log(`   Status: ${destinations?.status}, Found: ${destinations?.data?.destinations?.length} destinations\n`);

  // Test 3: Get User Profile (Authenticated)
  console.log('3. Testing Get User Profile...');
  const profile = await testAPI('/auth/me', 'GET', null, 'user');
  console.log(`   Status: ${profile?.status}, User: ${profile?.data?.user?.email}\n`);

  // Test 4: Test RBAC - Guide trying to access admin endpoint
  console.log('4. Testing RBAC - Guide accessing admin endpoint...');
  const guideAccess = await testAPI('/admin/dashboard', 'GET', null, 'guide');
  console.log(`   Status: ${guideAccess?.status}, Should be 403: ${guideAccess?.status === 403}\n`);

  // Test 5: Test RBAC - Admin accessing admin endpoint
  console.log('5. Testing RBAC - Admin accessing admin endpoint...');
  const adminAccess = await testAPI('/admin/dashboard', 'GET', null, 'admin');
  console.log(`   Status: ${adminAccess?.status}, Success: ${adminAccess?.status === 200}\n`);

  // Test 6: Get Pending Destinations (Auditor/Admin only)
  console.log('6. Testing Get Pending Destinations (Auditor)...');
  const pendingDests = await testAPI('/destinations?status=pending', 'GET', null, 'auditor');
  console.log(`   Status: ${pendingDests?.status}, Pending: ${pendingDests?.data?.destinations?.length}\n`);

  // Test 7: Get Moderation Dashboard (Admin/Auditor only)
  console.log('7. Testing Moderation Dashboard...');
  const moderationStats = await testAPI('/moderation/dashboard/stats', 'GET', null, 'admin');
  console.log(`   Status: ${moderationStats?.status}, Stats: ${JSON.stringify(moderationStats?.data?.stats)}\n`);

  // Test 8: Get Guide Verifications (Admin/Auditor only)
  console.log('8. Testing Guide Verifications...');
  const verifications = await testAPI('/guides/verifications?status=pending', 'GET', null, 'admin');
  console.log(`   Status: ${verifications?.status}, Pending Verifications: ${verifications?.data?.verifications?.length}\n`);

  // Test 9: Create a test destination as Guide
  console.log('9. Testing Destination Creation as Guide...');
  const newDestination = {
    name: 'Test API Destination',
    description: 'Created via API test',
    location: 'Test Location',
    region: 'Western',
    price_range: '$100-200',
    duration: '2 days',
    difficulty_level: 'Easy',
    highlights: ['Test highlight 1', 'Test highlight 2'],
    included: ['Guide', 'Transport'],
    not_included: ['Meals', 'Accommodation']
  };
  const createdDest = await testAPI('/destinations', 'POST', newDestination, 'guide');
  console.log(`   Status: ${createdDest?.status}, Created: ${createdDest?.data?.destination?.name}\n`);

  console.log('🎉 API Tests Completed!');
  console.log('\n📊 Token Summary:');
  Object.keys(tokens).forEach(role => {
    console.log(`   ${role.toUpperCase()}: ✅ Available`);
  });
}

// Run the tests
runTests()
  .catch(error => {
    console.error('❌ Test suite failed:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
