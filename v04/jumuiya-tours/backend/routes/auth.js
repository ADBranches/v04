// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-middleware.js';
import { auditLogger } from '../middleware/audit.js';

const prisma = new PrismaClient();
const router = express.Router();

// User Registration
router.post('/register', auditLogger('USER_REGISTER'), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'All fields are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    if (name.length < 2) {
      return res.status(400).json({ 
        error: 'Name must be at least 2 characters',
        code: 'NAME_TOO_SHORT'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Check if user exists using Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user using Prisma
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name.trim(),
        role: 'user'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        guide_status: true,
        created_at: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'jumuiya-tours-api',
        subject: user.id.toString()
      }
    );

    // Log successful registration using Prisma
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'REGISTER',
        resource_type: 'user',
        resource_id: user.id,
        new_values: { email: user.email, name: user.name }
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        guide_status: user.guide_status
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// User Login
router.post('/login', auditLogger('USER_LOGIN'), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user with Prisma
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password_hash: true,
        name: true,
        role: true,
        guide_status: true,
        is_active: true,
        verification_submitted_at: true,
        verified_at: true
      }
    });

    if (!user) {
      // Log failed login attempt using Prisma
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          resource_type: 'user',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          error_message: 'Invalid email'
        }
      });

      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Log failed login attempt using Prisma
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: 'LOGIN_FAILED',
          resource_type: 'user',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          error_message: 'Invalid password'
        }
      });

      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'jumuiya-tours-api',
        subject: user.id.toString()
      }
    );

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { updated_at: new Date() }
    });

    // Log successful login using Prisma
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'LOGIN_SUCCESS',
        resource_type: 'user',
        resource_id: user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        guide_status: user.guide_status,
        is_verified_guide: user.role === 'guide' && user.guide_status === 'verified'
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, auditLogger('GET_PROFILE'), async (req, res) => {
  try {
    // Get fresh user data using Prisma
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        guide_status: true,
        is_active: true,
        verification_submitted_at: true,
        verified_at: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        guide_status: user.guide_status,
        is_active: user.is_active,
        is_verified_guide: user.role === 'guide' && user.guide_status === 'verified',
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, auditLogger('UPDATE_PROFILE'), async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Name must be at least 2 characters',
        code: 'INVALID_NAME'
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        name: name.trim(),
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        guide_status: true,
        updated_at: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, auditLogger('CHANGE_PASSWORD'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Get current password hash using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validCurrentPassword) {
      return res.status(401).json({ 
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password using Prisma
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password_hash: newPasswordHash,
        updated_at: new Date()
      }
    });

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Logout (client-side token destruction - this endpoint is for logging)
router.post('/logout', authenticateToken, auditLogger('USER_LOGOUT'), async (req, res) => {
  try {
    // Log logout action using Prisma
    await prisma.auditLog.create({
      data: {
        user_id: req.user.id,
        action: 'LOGOUT',
        resource_type: 'user',
        resource_id: req.user.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Validate token (for checking if token is still valid)
router.get('/validate', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Add this to routes/auth.js
router.get('/test-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

// Reset password (Admin only)
router.post('/reset-password/:userId', 
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters',
          code: 'INVALID_PASSWORD'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { 
          password_hash: hashedPassword,
          updated_at: new Date()
        }
      });

      // Log password reset using Prisma
      await prisma.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'RESET_PASSWORD',
          resource_type: 'user',
          resource_id: parseInt(userId),
          notes: `Admin reset password for user ID ${userId}`
        }
      });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to reset password',
        code: 'RESET_PASSWORD_ERROR'
      });
    }
  }
);

export default router;
