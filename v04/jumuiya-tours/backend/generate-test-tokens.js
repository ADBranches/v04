// backend/generate-test-tokens.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
