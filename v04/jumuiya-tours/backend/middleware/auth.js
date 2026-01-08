// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Main authentication middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database using Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        guide_status: true,
        is_active: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Token verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(500).json({ 
      error: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      console.warn(`Unauthorized access attempt: User ${req.user.id} (${req.user.role}) tried to access ${req.method} ${req.path}`);
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const hasPerm = await checkPermission(req.user, permission);
      
      if (!hasPerm) {
        // Log unauthorized access attempt
        console.warn(`Permission denied: User ${req.user.id} (${req.user.role}) tried to access ${req.method} ${req.path} requiring ${permission}`);
        
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
          current: req.user.role,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_FAILED'
      });
    }
  };
};

// Ownership check middleware
export const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id;

      if (!resourceId) {
        return res.status(400).json({ 
          error: 'Resource ID required',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      switch (resourceType) {
        case 'destination':
          // Use Prisma instead of raw SQL
          const destination = await prisma.destination.findUnique({
            where: { id: parseInt(resourceId) },
            select: { created_by: true }
          });
          
          if (!destination) {
            return res.status(404).json({ 
              error: 'Resource not found',
              code: 'RESOURCE_NOT_FOUND'
            });
          }

          // Allow if user is owner or has admin/auditor role
          if (destination.created_by !== userId && !['admin', 'auditor'].includes(req.user.role)) {
            return res.status(403).json({ 
              error: 'Access denied - not resource owner',
              code: 'NOT_OWNER'
            });
          }
          break;

        case 'booking':
          // Use Prisma instead of raw SQL
          const booking = await prisma.booking.findUnique({
            where: { id: parseInt(resourceId) },
            select: { user_id: true }
          });
          
          if (!booking) {
            return res.status(404).json({ 
              error: 'Resource not found',
              code: 'RESOURCE_NOT_FOUND'
            });
          }

          // Allow if user is owner or has admin/auditor role
          if (booking.user_id !== userId && !['admin', 'auditor'].includes(req.user.role)) {
            return res.status(403).json({ 
              error: 'Access denied - not resource owner',
              code: 'NOT_OWNER'
            });
          }
          break;

        case 'user':
          // Users can only access their own data unless admin/auditor
          if (parseInt(resourceId) !== userId && !['admin', 'auditor'].includes(req.user.role)) {
            return res.status(403).json({ 
              error: 'Access denied - can only access own user data',
              code: 'ACCESS_DENIED'
            });
          }
          break;

        default:
          return res.status(400).json({ 
            error: 'Invalid resource type',
            code: 'INVALID_RESOURCE_TYPE'
          });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        error: 'Ownership check failed',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        guide_status: true,
        is_active: true
      }
    });

    if (user) {
      req.user = user;
      req.token = token;
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};

// Helper function to check permissions
async function checkPermission(user, permission) {
  // Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }

  // Define role permissions
  const rolePermissions = {
    auditor: [
      'view_destinations', 'create_destinations', 'edit_destinations',
      'publish_destinations', 'review_content', 'approve_content',
      'view_users', 'ban_users', 'verify_guides', 'view_analytics'
    ],
    guide: [
      'view_destinations', 'create_destinations', 'edit_own_destinations',
      'view_own_bookings', 'manage_own_profile'
    ],
    user: [
      'view_destinations', 'create_bookings', 'cancel_own_bookings',
      'view_own_bookings', 'manage_own_profile'
    ]
  };

  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
}

// Guide verification middleware
export const requireVerifiedGuide = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'guide' || req.user.guide_status !== 'verified') {
    return res.status(403).json({ 
      error: 'Verified guide status required',
      code: 'GUIDE_VERIFICATION_REQUIRED'
    });
  }

  next();
};

// Check if user can become a guide
export const canBecomeGuide = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'user') {
    return res.status(400).json({ 
      error: 'Only regular users can apply to become guides',
      code: 'INVALID_USER_ROLE'
    });
  }

  next();
};

// Export all middleware functions
const authMiddleware = {
  authenticateToken,
  requireRole,
  requirePermission,
  checkOwnership,
  optionalAuth,
  requireVerifiedGuide,
  canBecomeGuide
};

// Default export for backward compatibility
export default authMiddleware;