// backend/test-with-tokens.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';

async function generateTokens() {
  console.log('🔐 Generating tokens for testing...\n');
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true }
  });

  const tokens = {};
  
  for (const user of users) {
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    tokens[user.role] = token;
    console.log(`✅ ${user.role.toUpperCase()}: ${user.email}`);
    console.log(`   Token: ${token}\n`);
  }
  
  return tokens;
}

async function testEndpoint(endpoint, method = 'GET', token, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    return {
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests with Fresh Tokens...\n');
  
  const tokens = await generateTokens();
  
  // Test 1: User profile
  console.log('1. Testing User Profile...');
  const profile = await testEndpoint('/auth/me', 'GET', tokens.user);
  console.log(`   Status: ${profile.status}, User: ${profile.data?.user?.email || profile.data?.error}\n`);
  
  // Test 2: Admin dashboard
  console.log('2. Testing Admin Dashboard...');
  const adminDash = await testEndpoint('/admin/dashboard', 'GET', tokens.admin);
  console.log(`   Status: ${adminDash.status}, Data: ${adminDash.data?.message || adminDash.data?.error}\n`);
  
  // Test 3: Guide trying admin endpoint
  console.log('3. Testing RBAC - Guide accessing admin...');
  const guideAccess = await testEndpoint('/admin/dashboard', 'GET', tokens.guide);
  console.log(`   Status: ${guideAccess.status}, Should be 403: ${guideAccess.status === 403}\n`);
  
  // Test 4: Moderation dashboard
  console.log('4. Testing Moderation Dashboard...');
  const modStats = await testEndpoint('/moderation/dashboard/stats', 'GET', tokens.auditor);
  console.log(`   Status: ${modStats.status}, Stats: ${JSON.stringify(modStats.data?.stats) || modStats.data?.error}\n`);

  console.log('🎉 Tests completed!');
  
  // Print tokens for curl testing
  console.log('\n🔑 Tokens for manual testing:');
  Object.entries(tokens).forEach(([role, token]) => {
    console.log(`export ${role.toUpperCase()}_TOKEN='${token}'`);
  });
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
