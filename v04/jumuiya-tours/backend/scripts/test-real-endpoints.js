// backend/test-real-endpoints.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';

// REAL endpoints that actually exist based on route files
const realEndpoints = [
  // Auth
  { path: '/auth/me', method: 'GET', auth: true, role: 'user' },
  { path: '/auth/validate', method: 'GET', auth: true, role: 'user' },
  { path: '/auth/test-token', method: 'GET', auth: true, role: 'user' },
  
  // Destinations
  { path: '/destinations', method: 'GET', auth: false },
  { path: '/destinations?status=pending', method: 'GET', auth: true, role: 'auditor' },
  
  // Guides
  { path: '/guides', method: 'GET', auth: false },
  { path: '/guides/pending', method: 'GET', auth: true, role: 'admin' },
  
  // Moderation
  { path: '/moderation/dashboard/stats', method: 'GET', auth: true, role: 'auditor' },
  { path: '/moderation/pending', method: 'GET', auth: true, role: 'admin' },
  { path: '/moderation/logs/activity', method: 'GET', auth: true, role: 'admin' },
  
  // Admin
  { path: '/admin/users', method: 'GET', auth: true, role: 'admin' },
  { path: '/admin/stats', method: 'GET', auth: true, role: 'admin' },
];

async function testEndpoint(endpoint, token) {
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token && endpoint.auth) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
    const data = await response.json().catch(() => ({}));
    
    return {
      path: endpoint.path,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
      data: data
    };
  } catch (error) {
    return {
      path: endpoint.path,
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Testing REAL API Endpoints\n');
  
  // Generate tokens for all roles
  const tokens = {};
  const roles = ['user', 'guide', 'auditor', 'admin'];
  
  for (const role of roles) {
    const user = await prisma.user.findFirst({ where: { role } });
    if (user) {
      tokens[role] = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    }
  }

  console.log('🔐 Testing endpoints with proper roles...\n');
  
  for (const endpoint of realEndpoints) {
    const role = endpoint.role || 'user';
    const token = tokens[role];
    
    console.log(`🔍 ${endpoint.method} ${endpoint.path}`);
    console.log(`   Role: ${role}, Auth: ${endpoint.auth ? 'Yes' : 'No'}`);
    
    const result = await testEndpoint(endpoint, token);
    
    if (result.success) {
      console.log(`   ✅ SUCCESS: Status ${result.status}`);
      if (result.data.message) {
        console.log(`   Message: ${result.data.message}`);
      }
    } else {
      console.log(`   ❌ FAILED: Status ${result.status}`);
      if (result.data.error) {
        console.log(`   Error: ${result.data.error}`);
      }
    }
    console.log('');
  }

  console.log('🎯 RBAC Testing (Role-Based Access Control)\n');
  
  // Test RBAC specifically
  const rbacTests = [
    { path: '/admin/users', method: 'GET', allowed: ['admin'], denied: ['user', 'guide'] },
    { path: '/moderation/dashboard/stats', method: 'GET', allowed: ['admin', 'auditor'], denied: ['user', 'guide'] },
    { path: '/guides/pending', method: 'GET', allowed: ['admin'], denied: ['user', 'guide', 'auditor'] },
  ];

  for (const test of rbacTests) {
    console.log(`🔐 ${test.method} ${test.path}`);
    
    // Test allowed roles
    for (const role of test.allowed) {
      const result = await testEndpoint(test, tokens[role]);
      console.log(`   ${role.toUpperCase()}: ${result.success ? '✅ ALLOWED' : '❌ DENIED'} (${result.status})`);
    }
    
    // Test denied roles  
    for (const role of test.denied) {
      const result = await testEndpoint(test, tokens[role]);
      console.log(`   ${role.toUpperCase()}: ${result.success ? '❌ WRONGLY ALLOWED' : '✅ CORRECTLY DENIED'} (${result.status})`);
    }
    console.log('');
  }
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
