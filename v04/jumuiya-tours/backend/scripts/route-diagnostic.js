// scripts/route-diagnostic.js

// ✅ Load environment variables (so JWT_SECRET is available)
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // ✅ ESM import for jsonwebtoken

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';

const endpointsToTest = [
  // Auth endpoints
  { path: '/auth/me', method: 'GET', auth: true },
  { path: '/auth/login', method: 'POST', auth: false },
  { path: '/auth/register', method: 'POST', auth: false },
  
  // User endpoints
  { path: '/users', method: 'GET', auth: true },
  
  // Destination endpoints
  { path: '/destinations', method: 'GET', auth: false },
  { path: '/destinations?status=pending', method: 'GET', auth: true },
  
  // Guide endpoints
  { path: '/guides', method: 'GET', auth: false },
  { path: '/guides/verifications', method: 'GET', auth: true },
  { path: '/guides/pending', method: 'GET', auth: true },
  
  // Moderation endpoints
  { path: '/moderation', method: 'GET', auth: true },
  { path: '/moderation/dashboard/stats', method: 'GET', auth: true },
  { path: '/moderation/pending', method: 'GET', auth: true },
  
  // Admin endpoints
  { path: '/admin', method: 'GET', auth: true },
  { path: '/admin/dashboard', method: 'GET', auth: true },
  { path: '/admin/stats', method: 'GET', auth: true },
  
  // Booking endpoints
  { path: '/bookings', method: 'GET', auth: true },
];

async function testEndpoint(endpoint, token = null) {
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

    if (endpoint.method === 'POST') {
      options.body = JSON.stringify({ test: true });
    }

    const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
    
    return {
      path: endpoint.path,
      method: endpoint.method,
      status: response.status,
      exists: response.status !== 404,
      requiresAuth: response.status === 401,
      error: response.status >= 400 ? await response.text().catch(() => 'Unknown error') : null
    };
  } catch (error) {
    return {
      path: endpoint.path,
      method: endpoint.method,
      status: 0,
      exists: false,
      error: error.message
    };
  }
}

async function runDiagnostic() {
  console.log('🔍 API Route Diagnostic\n');
  
  // Get a token for testing
  const user = await prisma.user.findUnique({
    where: { email: 'user@jumuiya.com' }
  });

  if (!user) {
    console.error('❌ No user found with email user@jumuiya.com');
    return;
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set in the environment');
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('📋 Testing endpoints...\n');
  
  for (const endpoint of endpointsToTest) {
    const result = await testEndpoint(endpoint, token);
    
    const statusIcon =
      result.exists ? '✅' :
      result.requiresAuth ? '🔐' :
      '❌';
    
    console.log(`${statusIcon} ${endpoint.method} ${endpoint.path}`);
    console.log(`   Status: ${result.status}, Exists: ${result.exists}`);
    
    if (result.error && result.status !== 401) {
      console.log(`   Error: ${result.error.substring(0, 100)}...`);
    }
    console.log('');
  }

  console.log('🎯 SUMMARY:');
  const results = await Promise.all(endpointsToTest.map(ep => testEndpoint(ep, token)));
  
  const working = results.filter(r => r.exists && r.status !== 401).length;
  const authRequired = results.filter(r => r.requiresAuth).length;
  const missing = results.filter(r => !r.exists).length;
  
  console.log(`✅ Working: ${working}`);
  console.log(`🔐 Auth Required: ${authRequired}`);
  console.log(`❌ Missing: ${missing}`);
}

runDiagnostic()
  .catch(console.error)
  .finally(() => prisma.$disconnect());