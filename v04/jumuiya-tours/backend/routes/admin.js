// backend/routes/admin.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication and admin role middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// User Management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          guide_status: true,
          is_active: true,
          created_at: true,
          verified_at: true
        },
        orderBy: { created_at: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users', 
      details: error.message 
    });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password || !role) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    if (!['admin', 'auditor', 'guide', 'user'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid role' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name,
        role,
        guide_status: role === 'guide' ? 'verified' : 'unverified'
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

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create user', 
      details: error.message 
    });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role, is_active, guide_status } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID' 
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(is_active !== undefined && { is_active }),
        ...(guide_status && { guide_status })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        guide_status: true,
        is_active: true,
        created_at: true
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user', 
      details: error.message 
    });
  }
});

// Update user role (specific endpoint)
router.put('/users/:id/role', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID' 
      });
    }

    if (!role || !['admin', 'auditor', 'guide', 'user'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid role is required' 
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        role,
        guide_status: role === 'guide' ? 'verified' : 'unverified'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        guide_status: true,
        is_active: true
      }
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user role', 
      details: error.message 
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID' 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete your own account' 
      });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user', 
      details: error.message 
    });
  }
});

// System Analytics
router.get('/analytics', async (req, res) => {
  try {
    // Get platform statistics
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      },
      where: {
        is_active: true
      }
    });

    const guideStats = await prisma.user.groupBy({
      by: ['guide_status'],
      _count: {
        id: true
      },
      where: {
        role: 'guide'
      }
    });

    const destinationStats = await prisma.destination.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const totalUsers = await prisma.user.count();
    const totalDestinations = await prisma.destination.count();
    const totalBookings = await prisma.booking.count();

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await prisma.user.count({
      where: {
        created_at: { gte: thirtyDaysAgo }
      }
    });

    const recentDestinations = await prisma.destination.count({
      where: {
        created_at: { gte: thirtyDaysAgo }
      }
    });

    const recentBookings = await prisma.booking.count({
      where: {
        created_at: { gte: thirtyDaysAgo }
      }
    });

    res.json({
      success: true,
      analytics: {
        overview: {
          total_users: totalUsers,
          total_destinations: totalDestinations,
          total_bookings: totalBookings,
          recent_users: recentUsers,
          recent_destinations: recentDestinations,
          recent_bookings: recentBookings
        },
        users: userStats.map(stat => ({
          role: stat.role,
          count: stat._count.id
        })),
        guides: guideStats.map(stat => ({
          guide_status: stat.guide_status,
          count: stat._count.id
        })),
        destinations: destinationStats.map(stat => ({
          status: stat.status,
          count: stat._count.id
        })),
        bookings: bookingStats.map(stat => ({
          status: stat.status,
          count: stat._count.id
        }))
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch analytics', 
      details: error.message 
    });
  }
});

// Admin dashboard (alias for analytics)
router.get('/dashboard', async (req, res) => {
  try {
    // Redirect to analytics endpoint for now
    // You can add dashboard-specific data here later
    res.json({
      success: true,
      message: 'Admin dashboard endpoint',
      note: 'Use /analytics for detailed statistics'
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load admin dashboard', 
      details: error.message 
    });
  }
});

export default router;
