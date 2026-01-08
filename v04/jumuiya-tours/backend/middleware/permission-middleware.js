// backend/middleware/permission-middleware.js
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  canManageResource,
  isValidPermission 
} from '../config/permissions-config.js';

/**
 * Advanced permission-based access control middleware
 * Provides granular permission checking for fine-grained access control
 */

/**
 * Middleware to require a specific permission
 * @param {string} permission - Required permission
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
export const requirePermission = (permission, options = {}) => {
  const {
    resourceType = null,
    ownershipCheck = false,
    customCheck = null
  } = options;

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'Please log in to access this resource'
      });
    }

    // Validate permission string
    if (!isValidPermission(permission) && permission !== '*') {
      return res.status(500).json({
        success: false,
        error: 'Invalid permission configuration',
        code: 'INVALID_PERMISSION',
        permission: permission
      });
    }

    try {
      let hasAccess = hasPermission(req.user, permission);

      // Apply ownership check if required
      if (hasAccess && ownershipCheck && resourceType) {
        const resourceId = req.params.id;
        if (resourceId) {
          // In a real implementation, you'd fetch the resource here
          // For now, we'll assume the resource is attached to req or needs fetching
          hasAccess = await checkResourceOwnership(req, resourceType, resourceId);
        }
      }

      // Apply custom check if provided
      if (hasAccess && customCheck) {
        hasAccess = await customCheck(req);
      }

      if (!hasAccess) {
        // Log permission denial
        console.warn(`Permission denied: User ${req.user.id} (${req.user.role}) tried to access ${req.method} ${req.originalUrl} requiring permission: ${permission}`);
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permission,
          current: req.user.role,
          message: 'You do not have permission to perform this action'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

/**
 * Middleware to require any of the specified permissions (logical OR)
 * @param {Array} permissions - Array of permissions
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
export const requireAnyPermission = (permissions, options = {}) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const hasAny = hasAnyPermission(req.user, permissions);

      if (!hasAny) {
        console.warn(`Any permission denied: User ${req.user.id} (${req.user.role}) tried to access ${req.method} ${req.originalUrl} requiring any of: ${permissions.join(', ')}`);
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredAny: permissions,
          current: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Any permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to require all of the specified permissions (logical AND)
 * @param {Array} permissions - Array of permissions
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
export const requireAllPermissions = (permissions, options = {}) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const hasAll = hasAllPermissions(req.user, permissions);

      if (!hasAll) {
        console.warn(`All permissions denied: User ${req.user.id} (${req.user.role}) tried to access ${req.method} ${req.originalUrl} requiring all of: ${permissions.join(', ')}`);
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredAll: permissions,
          current: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('All permissions check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Dynamic permission-based routing
 * Allows different handlers based on user permissions
 * @param {Object} permissionHandlers - Object mapping permissions to handlers
 * @returns {Function} Express middleware
 */
export const permissionBasedRoute = (permissionHandlers) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      let handler = null;
      
      // Find the first permission that user has and use its handler
      for (const [permission, permissionHandler] of Object.entries(permissionHandlers)) {
        if (hasPermission(req.user, permission)) {
          handler = permissionHandler;
          break;
        }
      }

      // Use default handler if no specific permission matches
      if (!handler && permissionHandlers.default) {
        handler = permissionHandlers.default;
      }

      if (!handler) {
        return res.status(403).json({
          success: false,
          error: 'No handler available for your permissions',
          code: 'NO_PERMISSION_HANDLER',
          current: req.user.role
        });
      }

      handler(req, res, next);
    } catch (error) {
      console.error('Permission-based routing error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission routing failed',
        code: 'PERMISSION_ROUTING_ERROR'
      });
    }
  };
};

/**
 * Middleware to check resource ownership with automatic permission fallback
 * @param {string} resourceType - Type of resource
 * @param {string} ownershipPermission - Permission for ownership-based access
 * @param {string} adminPermission - Permission for admin/auditor access
 * @returns {Function} Express middleware
 */
export const requireResourceAccess = (resourceType, ownershipPermission, adminPermission = null) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'Resource ID required',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      // Check if user has admin-level access
      const hasAdminAccess = adminPermission ? hasPermission(req.user, adminPermission) : 
                            ['admin', 'auditor'].includes(req.user.role);

      if (hasAdminAccess) {
        return next();
      }

      // Check ownership-based access
      const hasOwnershipAccess = await checkResourceOwnership(req, resourceType, resourceId);
      
      if (hasOwnershipAccess && hasPermission(req.user, ownershipPermission)) {
        return next();
      }

      // Log access denial
      console.warn(`Resource access denied: User ${req.user.id} (${req.user.role}) tried to access ${resourceType} ${resourceId}`);
      
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'RESOURCE_ACCESS_DENIED',
        resourceType: resourceType,
        resourceId: resourceId,
        message: 'You do not have access to this resource'
      });

    } catch (error) {
      console.error('Resource access check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Resource access check failed',
        code: 'RESOURCE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Scoped query middleware - automatically filters data based on user permissions
 * @param {string} modelType - Type of model to scope
 * @param {Object} scopes - Object defining scopes for different roles
 * @returns {Function} Express middleware
 */
export const scopedQuery = (modelType, scopes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    // Add scope information to request for use in controllers
    req.scope = {
      modelType,
      userRole: req.user.role,
      userId: req.user.id,
      queryModifier: scopes[req.user.role] || scopes.default
    };

    next();
  };
};

/**
 * Permission-aware response filtering
 * Filters response data based on user permissions
 */
export const filterResponseByPermission = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    if (req.user && typeof data === 'object' && data !== null) {
      // Apply response filtering based on user permissions
      const filteredData = filterDataByPermissions(data, req.user);
      originalSend.call(this, filteredData);
    } else {
      originalSend.call(this, data);
    }
  };

  next();
};

// Helper function to check resource ownership
async function checkResourceOwnership(req, resourceType, resourceId) {
  // This would typically query the database to verify ownership
  // For now, we'll implement a simplified version
  
  try {
    const { query } = await import('../config/database.js');
    
    let queryText;
    let queryParams;

    switch (resourceType) {
      case 'destination':
        queryText = 'SELECT created_by FROM destinations WHERE id = $1';
        queryParams = [resourceId];
        break;
      case 'booking':
        queryText = 'SELECT user_id FROM bookings WHERE id = $1';
        queryParams = [resourceId];
        break;
      case 'user':
        // Users can only access their own data
        return resourceId === req.user.id;
      default:
        return false;
    }

    const result = await query(queryText, queryParams);
    
    if (result.rows.length === 0) {
      return false;
    }

    const resource = result.rows[0];
    const ownerId = resource.created_by || resource.user_id;
    
    return ownerId === req.user.id;
  } catch (error) {
    console.error('Ownership check error:', error);
    return false;
  }
}

// Helper function to filter data based on permissions
function filterDataByPermissions(data, user) {
  if (!data || typeof data !== 'object') return data;

  // Create a deep copy to avoid modifying original data
  const filtered = JSON.parse(JSON.stringify(data));

  // Apply different filtering strategies based on data structure
  if (Array.isArray(filtered)) {
    return filtered.map(item => filterItemByPermissions(item, user));
  } else {
    return filterItemByPermissions(filtered, user);
  }
}

// Helper function to filter individual items
function filterItemByPermissions(item, user) {
  if (!item || typeof item !== 'object') return item;

  const filtered = { ...item };

  // Remove sensitive fields based on user role
  if (user.role !== 'admin') {
    // Remove audit fields from non-admins
    delete filtered.audit_logs;
    delete filtered.internal_notes;
    
    if (user.role !== 'auditor') {
      // Remove moderation fields from non-auditors
      delete filtered.moderation_status;
      delete filtered.rejection_reason;
    }
  }

  return filtered;
}

export default {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  permissionBasedRoute,
  requireResourceAccess,
  scopedQuery,
  filterResponseByPermission
};
