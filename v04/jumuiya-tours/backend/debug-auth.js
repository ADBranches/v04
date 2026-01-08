// backend/debug-auth.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function debugAuth() {
  console.log('🔐 Debugging authentication...\n');
  
  try {
    // Get a user
    const user = await prisma.user.findUnique({
      where: { email: 'user@jumuiya.com' }
    });
    
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('\n🔑 Generated token:');
    console.log(token);
    
    // Verify the token
    console.log('\n✅ Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Test the token with the API
    console.log('\n🌐 Testing token with API...');
    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response status:', response.status);
    const data = await response.json();
    console.log('API Response data:', data);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();
