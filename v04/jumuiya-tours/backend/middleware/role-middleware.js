// backend/middleware/role-middleware.js
import { hasPermission, getEffectiveRole } from '../config/permissions-config.js';

/**
 * Role-based access control middleware
 * Provides comprehensive role checking and authorization
 */

/**
 * Middleware to require specific role(s)
 * @param {string|Array} roles - Single role or array of roles
 * @returns {Function} Express middleware
 */
export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'Please log in to access this resource'
      });
    }

    const userRole = getEffectiveRole(req.user);
    
    if (!allowedRoles.includes(userRole)) {
      // Log unauthorized access attempt
      console.warn(`Role access denied: User ${req.user.id} (${userRole}) tried to access ${req.method} ${req.originalUrl} requiring roles: ${allowedRoles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient role permissions',
        code: 'INSUFFICIENT_ROLE',
        required: allowedRoles,
        current: userRole,
        message: 'You do not have the required role to access this resource'
      });
    }

    next();
  };
};

/**
 * Middleware to require any of the specified roles (logical OR)
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
export const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = getEffectiveRole(req.user);
    
    if (!roles.includes(userRole)) {
      console.warn(`Any role access denied: User ${req.user.id} (${userRole}) tried to access ${req.method} ${req.originalUrl} requiring any of: ${roles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient role permissions',
        code: 'INSUFFICIENT_ROLE',
        requiredAny: roles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Middleware to exclude specific roles
 * @param {string|Array} roles - Single role or array of roles to exclude
 * @returns {Function} Express middleware
 */
export const excludeRole = (roles) => {
  const excludedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = getEffectiveRole(req.user);
    
    if (excludedRoles.includes(userRole)) {
      console.warn(`Role exclusion: User ${req.user.id} (${userRole}) is excluded from accessing ${req.method} ${req.originalUrl}`);
      
      return res.status(403).json({
        success: false,
        error: 'Role not permitted',
        code: 'ROLE_EXCLUDED',
        excluded: excludedRoles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Middleware to require minimum role level based on hierarchy
 * @param {string} minRole - Minimum required role
 * @returns {Function} Express middleware
 */
export const requireMinRole = (minRole) => {
  const roleHierarchy = ['user', 'guide', 'auditor', 'admin'];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = getEffectiveRole(req.user);
    const userLevel = roleHierarchy.indexOf(userRole);
    const minLevel = roleHierarchy.indexOf(minRole);

    if (userLevel === -1 || minLevel === -1) {
      return res.status(500).json({
        success: false,
        error: 'Invalid role configuration',
        code: 'INVALID_ROLE_CONFIG'
      });
    }

    if (userLevel < minLevel) {
      console.warn(`Min role access denied: User ${req.user.id} (${userRole}) tried to access ${req.method} ${req.originalUrl} requiring minimum role: ${minRole}`);
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient role level',
        code: 'INSUFFICIENT_ROLE_LEVEL',
        requiredMin: minRole,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Middleware that adds user role information to response
 * Useful for frontend to adapt UI based on user role
 */
export const roleInfoMiddleware = (req, res, next) => {
  if (req.user) {
    // Add role information to response locals for potential use
    res.locals.userRole = getEffectiveRole(req.user);
    res.locals.userPermissions = hasPermission; // Function reference
    
    // Add role info to response if it's an API call
    if (req.originalUrl.startsWith('/api/') && req.method === 'GET') {
      const originalSend = res.send;
      res.send = function(data) {
        if (typeof data === 'object' && data !== null) {
          // Add role context to response
          data.roleContext = {
            role: res.locals.userRole,
            isAdmin: res.locals.userRole === 'admin',
            isAuditor: res.locals.userRole === 'auditor',
            isGuide: res.locals.userRole === 'guide',
            isUser: res.locals.userRole === 'user'
          };
        }
        originalSend.call(this, data);
      };
    }
  }
  next();
};

/**
 * Dynamic role-based routing middleware
 * Allows different handlers based on user role
 * @param {Object} roleHandlers - Object mapping roles to handler functions
 * @returns {Function} Express middleware
 */
export const roleBasedRoute = (roleHandlers) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = getEffectiveRole(req.user);
    const handler = roleHandlers[userRole] || roleHandlers.default;

    if (!handler) {
      return res.status(403).json({
        success: false,
        error: 'No handler available for your role',
        code: 'NO_ROLE_HANDLER',
        current: userRole
      });
    }

    handler(req, res, next);
  };
};

/**
 * Middleware to require verified guide status
 * Useful for routes that require active, verified guides
 */
export const requireVerifiedGuide = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const isVerifiedGuide = req.user.role === 'guide' && req.user.guide_status === 'verified';
  
  if (!isVerifiedGuide) {
    return res.status(403).json({
      success: false,
      error: 'Verified guide account required',
      code: 'VERIFIED_GUIDE_REQUIRED',
      message: 'This action requires a verified guide account. Please complete your guide verification.'
    });
  }

  next();
};

/**
 * Middleware to check if user can elevate to guide
 * Checks if user meets requirements to become a guide
 */
export const canBecomeGuide = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Users can become guides if they are currently users
  // and haven't already applied or been rejected recently
  const canApply = req.user.role === 'user' && 
                  (!req.user.guide_status || req.user.guide_status === 'unverified');

  if (!canApply) {
    return res.status(403).json({
      success: false,
      error: 'Cannot apply as guide',
      code: 'CANNOT_APPLY_GUIDE',
      message: 'You cannot apply as a guide at this time. You may have a pending application or already be a guide.'
    });
  }

  next();
};

export default {
  requireRole,
  requireAnyRole,
  excludeRole,
  requireMinRole,
  roleInfoMiddleware,
  roleBasedRoute,
  requireVerifiedGuide,
  canBecomeGuide
};
