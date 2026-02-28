// backend/generate-test-tokens.js
import 'dotenv/config'; 

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fs from 'fs';            
import path from 'path';        
const prisma = new PrismaClient();

async function generateAllTokens() {
  console.log('🔐 Generating tokens for all users...\n');
  
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
    
    tokens[user.role] = {
      token: token,
      email: user.email,
      name: user.name
    };
    
    console.log(`✅ ${user.role.toUpperCase()}:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Token: ${token}\n`);
  }
  
  return tokens;
}

async function runTests() {
  const tokens = await generateAllTokens();
  
  updateEnvWithTokens(tokens);

  console.log('🚀 COPY AND PASTE THESE COMMANDS TO TEST:\n');
  
  Object.entries(tokens).forEach(([role, data]) => {
    console.log(`export ${role.toUpperCase()}_TOKEN='${data.token}'`);
  });
  
  console.log('\n📋 TEST COMMANDS:\n');
  
  // Health check
  console.log('# 1. Health Check');
  console.log('curl -X GET http://localhost:5000/api/health\n');
  
  // Destinations (public)
  console.log('# 2. Get Destinations (Public)');
  console.log('curl -X GET http://localhost:5000/api/destinations\n');
  
  // User profile
  console.log('# 3. User Profile');
  console.log('curl -X GET http://localhost:5000/api/auth/me \\');
  console.log('  -H "Authorization: Bearer $USER_TOKEN"\n');
  
  // Admin dashboard
  console.log('# 4. Admin Dashboard');
  console.log('curl -X GET http://localhost:5000/api/admin/dashboard \\');
  console.log('  -H "Authorization: Bearer $ADMIN_TOKEN"\n');
  
  // RBAC test - guide trying admin
  console.log('# 5. RBAC Test - Guide accessing admin');
  console.log('curl -X GET http://localhost:5000/api/admin/dashboard \\');
  console.log('  -H "Authorization: Bearer $GUIDE_TOKEN"\n');
  
  // Moderation dashboard
  console.log('# 6. Moderation Dashboard');
  console.log('curl -X GET http://localhost:5000/api/moderation/dashboard/stats \\');
  console.log('  -H "Authorization: Bearer $AUDITOR_TOKEN"\n');
  
  // Guide verifications
  console.log('# 7. Guide Verifications');
  console.log('curl -X GET "http://localhost:5000/api/guides/verifications?status=pending" \\');
  console.log('  -H "Authorization: Bearer $ADMIN_TOKEN"\n');
}

// ✅ Helper: write generated tokens into .env
function updateEnvWithTokens(tokens) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';

  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch {
    // .env might not exist yet; we'll create it
    envContent = '';
  }

  const lines = envContent.split('\n');

  // Keys we are going to manage, e.g. ADMIN_TOKEN, AUDITOR_TOKEN, USER_TOKEN...
  const keys = Object.keys(tokens).map((role) => `${role.toUpperCase()}_TOKEN`);

  // Keep all existing lines except the ones we’re about to replace
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return true;
    return !keys.some((k) => trimmed.startsWith(`${k}=`));
  });

  // Append fresh token lines
  for (const [role, data] of Object.entries(tokens)) {
    const key = `${role.toUpperCase()}_TOKEN`;
    filtered.push(`${key}='${data.token}'`);
  }

  fs.writeFileSync(envPath, filtered.join('\n'), 'utf8');
  console.log(`\n📝 .env updated with: ${keys.join(', ')}`);
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
