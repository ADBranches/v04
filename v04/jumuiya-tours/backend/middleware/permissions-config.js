// backend/middleware/permissions-config.js
/**
 * Permission and role configuration
 * Defines role hierarchy and permission checks
 */

// Role hierarchy (from lowest to highest privilege)
const ROLE_HIERARCHY = ['user', 'guide', 'auditor', 'admin'];

// Permission definitions
const PERMISSIONS = {
  // User permissions
  user: [
    'view_destinations',
    'create_bookings',
    'view_own_bookings',
    'cancel_own_bookings',
    'manage_own_profile',
    'apply_guide'
  ],
  
  // Guide permissions
  guide: [
    'view_destinations',
    'create_destinations',
    'edit_own_destinations',
    'view_own_bookings',
    'manage_own_profile',
    'submit_content'
  ],
  
  // Auditor permissions
  auditor: [
    'view_destinations',
    'create_destinations',
    'edit_destinations',
    'review_content',
    'approve_content',
    'reject_content',
    'verify_guides',
    'view_users',
    'view_analytics'
  ],
  
  // Admin permissions (all permissions)
  admin: [
    'all' // Special permission that grants everything
  ]
};

/**
 * Get effective role considering guide status
 * @param {Object} user - User object
 * @returns {string} Effective role
 */
export const getEffectiveRole = (user) => {
  if (user.role === 'guide' && user.guide_status !== 'verified') {
    return 'user'; // Unverified guides have user-level access
  }
  return user.role;
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permission) => {
  const effectiveRole = getEffectiveRole(user);
  
  // Admin has all permissions
  if (effectiveRole === 'admin') {
    return true;
  }
  
  const rolePermissions = PERMISSIONS[effectiveRole] || [];
  
  // Check if permission is explicitly granted
  return rolePermissions.includes(permission) || rolePermissions.includes('all');
};

/**
 * Get user's permission list
 * @param {Object} user - User object
 * @returns {Array} List of permissions
 */
export const getUserPermissions = (user) => {
  const effectiveRole = getEffectiveRole(user);
  return PERMISSIONS[effectiveRole] || [];
};

/**
 * Check if user has minimum role level
 * @param {Object} user - User object
 * @param {string} minRole - Minimum required role
 * @returns {boolean} True if user meets minimum role
 */
export const hasMinRole = (user, minRole) => {
  const effectiveRole = getEffectiveRole(user);
  const userLevel = ROLE_HIERARCHY.indexOf(effectiveRole);
  const minLevel = ROLE_HIERARCHY.indexOf(minRole);
  
  return userLevel >= minLevel;
};

export default {
  ROLE_HIERARCHY,
  PERMISSIONS,
  getEffectiveRole,
  hasPermission,
  getUserPermissions,
  hasMinRole
};
