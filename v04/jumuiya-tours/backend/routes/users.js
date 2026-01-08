// backend/routes/users.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole, requireVerifiedGuide, canBecomeGuide } from '../middleware/role-middleware.js';
import { requirePermission, requireAnyPermission, requireResourceAccess } from '../middleware/permission-middleware.js';
import { auditLogger } from '../middleware/audit.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all users (Admin/Auditor only)
router.get('/', 
  authenticateToken,
  requireAnyPermission(['view_users', 'view_user_profiles']),
  auditLogger('LIST_USERS'),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, role, search, guide_status } = req.query;
      const skip = (page - 1) * limit;

      // Build where clause
      let where = {};

      // Apply filters
      if (role) {
        where.role = role;
      }

      if (guide_status) {
        where.guide_status = guide_status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Regular users can only see limited info about other users
      if (req.user.role === 'user') {
        where.is_active = true;
        where.role = 'guide';
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { created_at: 'desc' },
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
          pages: Math.ceil(total / limit)
        },
        filters: {
          role,
          guide_status,
          search
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        code: 'FETCH_USERS_ERROR'
      });
    }
  }
);

// Get user by ID (with appropriate access control)
router.get('/:id',
  authenticateToken,
  requireResourceAccess('user', 'view_own_profile', 'view_user_profiles'),
  auditLogger('GET_USER'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
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
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Remove sensitive information based on permissions
      const userResponse = { ...user };
      if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        delete userResponse.email;
      }

      res.json({
        success: true,
        user: userResponse
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user',
        code: 'FETCH_USER_ERROR'
      });
    }
  }
);

// Create user (Admin only - for creating auditors/guides)
router.post('/',
  authenticateToken,
  requirePermission('create_destinations'), // Using create_destinations as proxy for user creation
  auditLogger('CREATE_USER'),
  async (req, res) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Validate role
      const allowedRoles = ['auditor', 'guide'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Role must be auditor or guide',
          code: 'INVALID_ROLE',
          allowed: allowedRoles
        });
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address',
          code: 'INVALID_EMAIL'
        });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          name: name.trim(),
          role,
          guide_status: role === 'guide' ? 'verified' : null
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

      // Log the creation
      await prisma.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'CREATE_USER',
          resource_type: 'user',
          resource_id: user.id,
          new_values: { 
            email: user.email, 
            name: user.name, 
            role: user.role 
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: user,
        temporary_password: password // In production, send via secure channel
      });

    } catch (error) {
      console.error('Create user error:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create user',
        code: 'CREATE_USER_ERROR'
      });
    }
  }
);

// Update user (Admin/Auditor or own profile)
router.put('/:id',
  authenticateToken,
  requireResourceAccess('user', 'update_own_profile', 'edit_users'),
  auditLogger('UPDATE_USER'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, guide_status, is_active } = req.body;

      // Users can only update their own name
      if (req.user.id !== parseInt(id)) {
        // Only admin/auditor can update other users
        if (!['admin', 'auditor'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Cannot update other users',
            code: 'UPDATE_OTHER_USERS_DENIED'
          });
        }

        // Build update data
        const updateData = {};
        
        if (name !== undefined) {
          updateData.name = name.trim();
        }

        if (role !== undefined && req.user.role === 'admin') {
          updateData.role = role;
        }

        if (guide_status !== undefined) {
          updateData.guide_status = guide_status;
        }

        if (is_active !== undefined) {
          updateData.is_active = is_active;
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No valid fields to update',
            code: 'NO_VALID_UPDATES'
          });
        }

        const user = await prisma.user.update({
          where: { id: parseInt(id) },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            guide_status: true,
            is_active: true,
            updated_at: true
          }
        });

        res.json({
          success: true,
          message: 'User updated successfully',
          user
        });

      } else {
        // Users updating their own profile - can only update name
        if (name === undefined || name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            error: 'Valid name is required',
            code: 'INVALID_NAME'
          });
        }

        const user = await prisma.user.update({
          where: { id: parseInt(id) },
          data: { name: name.trim() },
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
          success: true,
          message: 'Profile updated successfully',
          user
        });
      }

    } catch (error) {
      console.error('Update user error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        code: 'UPDATE_USER_ERROR'
      });
    }
  }
);

// Apply as guide (User only)
router.post('/apply-guide',
  authenticateToken,
  requireRole('user'),
  canBecomeGuide,
  auditLogger('APPLY_GUIDE'),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Update user guide status
      const user = await prisma.user.update({
        where: { id: userId },
        data: { 
          guide_status: 'pending',
          verification_submitted_at: new Date()
        }
      });

      // Log application
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action: 'APPLY_GUIDE',
          resource_type: 'user',
          resource_id: userId
        }
      });

      // Create notification for auditors
      try {
        const auditors = await prisma.user.findMany({
          where: {
            role: { in: ['admin', 'auditor'] },
            is_active: true
          },
          select: { id: true }
        });

        const notifications = auditors.map(auditor => ({
          user_id: auditor.id,
          type: 'guide',
          title: 'New Guide Application',
          message: `User ${req.user.name} has applied to become a guide.`,
          priority: 'normal',
          data: JSON.stringify({ 
            applicant_id: userId, 
            applicant_name: req.user.name 
          })
        }));

        await prisma.notification.createMany({
          data: notifications
        });
      } catch (notificationError) {
        // Notifications might not be set up yet, so we'll just log
        console.log('Could not create notification:', notificationError.message);
      }

      res.json({
        success: true,
        message: 'Guide application submitted successfully',
        status: 'pending'
      });

    } catch (error) {
      console.error('Guide application error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit guide application',
        code: 'APPLY_GUIDE_ERROR'
      });
    }
  }
);

// Ban user (Admin/Auditor only)
router.post('/:id/ban',
  authenticateToken,
  requireAnyPermission(['ban_users', 'edit_users']),
  auditLogger('BAN_USER'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Cannot ban yourself
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot ban yourself',
          code: 'SELF_BAN_DISALLOWED'
        });
      }

      const user = await prisma.user.update({
        where: { 
          id: parseInt(id),
          is_active: true
        },
        data: { 
          is_active: false 
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          is_active: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found or already inactive',
          code: 'USER_NOT_FOUND_OR_INACTIVE'
        });
      }

      // Log the ban action
      await prisma.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'BAN_USER',
          resource_type: 'user',
          resource_id: parseInt(id),
          notes: reason || 'No reason provided'
        }
      });

      res.json({
        success: true,
        message: 'User banned successfully',
        user
      });

    } catch (error) {
      console.error('Ban user error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'User not found or already inactive',
          code: 'USER_NOT_FOUND_OR_INACTIVE'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to ban user',
        code: 'BAN_USER_ERROR'
      });
    }
  }
);

// Unban user (Admin/Auditor only)
router.post('/:id/unban',
  authenticateToken,
  requireAnyPermission(['ban_users', 'edit_users']),
  auditLogger('UNBAN_USER'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: { 
          id: parseInt(id),
          is_active: false
        },
        data: { 
          is_active: true 
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          is_active: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found or already active',
          code: 'USER_NOT_FOUND_OR_ACTIVE'
        });
      }

      // Log the unban action
      await prisma.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'UNBAN_USER',
          resource_type: 'user',
          resource_id: parseInt(id),
          notes: 'User unbanned'
        }
      });

      res.json({
        success: true,
        message: 'User unbanned successfully',
        user
      });

    } catch (error) {
      console.error('Unban user error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'User not found or already active',
          code: 'USER_NOT_FOUND_OR_ACTIVE'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to unban user',
        code: 'UNBAN_USER_ERROR'
      });
    }
  }
);

// Get user statistics (Admin/Auditor only)
router.get('/stats/overview',
  authenticateToken,
  requirePermission('view_user_statistics'),
  auditLogger('GET_USER_STATS'),
  async (req, res) => {
    try {
      // Get user counts by role
      const roleStats = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        },
        _sum: {
          // We'll calculate active/inactive counts separately
        }
      });

      // Get active/inactive counts per role
      const activeStats = await prisma.user.groupBy({
        by: ['role', 'is_active'],
        _count: {
          id: true
        }
      });

      // Process role stats with active/inactive counts
      const processedRoleStats = roleStats.map(roleStat => {
        const activeCount = activeStats.find(
          stat => stat.role === roleStat.role && stat.is_active === true
        )?._count.id || 0;
        
        const inactiveCount = activeStats.find(
          stat => stat.role === roleStat.role && stat.is_active === false
        )?._count.id || 0;

        return {
          role: roleStat.role,
          count: roleStat._count.id,
          active: activeCount,
          inactive: inactiveCount
        };
      });

      // Get guide status statistics
      const guideStats = await prisma.user.groupBy({
        by: ['guide_status'],
        where: { role: 'guide' },
        _count: {
          id: true
        }
      });

      // Get registration trends (last 30 days)
      const registrationTrends = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as registrations
        FROM users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      res.json({
        success: true,
        statistics: {
          by_role: processedRoleStats,
          guide_status: guideStats,
          registration_trends: registrationTrends,
          total_users: processedRoleStats.reduce((sum, row) => sum + row.count, 0),
          active_users: processedRoleStats.reduce((sum, row) => sum + row.active, 0)
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user statistics',
        code: 'FETCH_USER_STATS_ERROR'
      });
    }
  }
);

export default router;
