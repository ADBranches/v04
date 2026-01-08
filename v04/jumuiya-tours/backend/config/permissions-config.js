// backend/config/permissions-config.js
/**
 * Jumuiya Tours RBAC Permissions Configuration
 * Defines permissions for each user role in the system
 */

const PERMISSIONS = {
  // Admin: Super user with all permissions
  ADMIN: ['*'], // Wildcard for all permissions
  
  // Auditor: Content manager and moderator
  AUDITOR: [
    // Destination Management
    'view_destinations',
    'create_destinations', 
    'edit_destinations',
    'publish_destinations',
    'unpublish_destinations',
    'feature_destinations',
    'view_pending_destinations',
    'approve_destinations',
    'reject_destinations',
    'request_destination_revisions',
    
    // User Management
    'view_users',
    'edit_users',
    'ban_users',
    'view_user_profiles',
    
    // Guide Management
    'view_guides',
    'edit_guides', 
    'verify_guides',
    'suspend_guides',
    'view_pending_guides',
    
    // Content Moderation
    'review_content',
    'approve_content',
    'reject_content',
    'request_content_revisions',
    'view_moderation_queue',
    
    // Booking Management
    'view_bookings',
    'edit_bookings', 
    'cancel_bookings',
    'manage_bookings',
    'view_booking_analytics',
    
    // Analytics & Reporting
    'view_analytics',
    'export_reports',
    'view_user_statistics',
    'view_revenue_reports',
    
    // System Access
    'access_moderation_dashboard',
    'view_audit_logs',
    'view_moderation_logs'
  ],
  
  // Guide: Content creator and service provider
  GUIDE: [
    // Destination Management (Owned)
    'view_destinations',
    'create_destinations',
    'edit_own_destinations',
    'delete_own_destinations',
    'submit_destinations',
    'view_own_destinations',
    
    // Profile Management
    'manage_own_profile',
    'update_own_profile',
    'view_own_profile',
    
    // Booking Management
    'view_own_bookings',
    'manage_own_bookings',
    'confirm_own_bookings',
    'complete_own_bookings',
    'view_booking_requests',
    
    // Guide-specific
    'apply_as_guide',
    'view_guide_dashboard',
    'update_guide_availability',
    
    // Basic Access
    'access_guide_dashboard',
    'view_public_content'
  ],
  
  // User: Regular customer/tourist
  USER: [
    // Public Access
    'view_destinations',
    'view_guides',
    'view_public_content',
    
    // Booking Management
    'create_bookings',
    'view_own_bookings',
    'cancel_own_bookings',
    
    // Profile Management  
    'manage_own_profile',
    'update_own_profile',
    'view_own_profile',
    
    // User Actions
    'apply_as_guide',
    'write_reviews',
    'edit_own_reviews',
    
    // Basic Access
    'access_user_dashboard'
  ]
};

// Permission categories for UI organization
const PERMISSION_CATEGORIES = {
  DESTINATION_MANAGEMENT: [
    'view_destinations',
    'create_destinations',
    'edit_destinations',
    'edit_own_destinations',
    'delete_own_destinations',
    'publish_destinations',
    'unpublish_destinations',
    'feature_destinations',
    'view_pending_destinations',
    'approve_destinations',
    'reject_destinations',
    'request_destination_revisions',
    'submit_destinations',
    'view_own_destinations'
  ],
  
  USER_MANAGEMENT: [
    'view_users',
    'edit_users',
    'ban_users',
    'view_user_profiles',
    'manage_own_profile',
    'update_own_profile',
    'view_own_profile'
  ],
  
  GUIDE_MANAGEMENT: [
    'view_guides',
    'edit_guides',
    'verify_guides',
    'suspend_guides',
    'view_pending_guides',
    'apply_as_guide',
    'view_guide_dashboard',
    'update_guide_availability'
  ],
  
  CONTENT_MODERATION: [
    'review_content',
    'approve_content',
    'reject_content',
    'request_content_revisions',
    'view_moderation_queue'
  ],
  
  BOOKING_MANAGEMENT: [
    'view_bookings',
    'edit_bookings',
    'cancel_bookings',
    'manage_bookings',
    'view_booking_analytics',
    'create_bookings',
    'view_own_bookings',
    'cancel_own_bookings',
    'manage_own_bookings',
    'confirm_own_bookings',
    'complete_own_bookings',
    'view_booking_requests'
  ],
  
  ANALYTICS_REPORTING: [
    'view_analytics',
    'export_reports',
    'view_user_statistics',
    'view_revenue_reports'
  ],
  
  SYSTEM_ACCESS: [
    'access_moderation_dashboard',
    'access_guide_dashboard',
    'access_user_dashboard',
    'view_audit_logs',
    'view_moderation_logs',
    'view_public_content'
  ]
};

// Role hierarchy (higher roles inherit lower role permissions)
const ROLE_HIERARCHY = {
  ADMIN: ['AUDITOR', 'GUIDE', 'USER'],
  AUDITOR: ['GUIDE', 'USER'],
  GUIDE: ['USER'],
  USER: []
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role property
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) {
    return false;
  }
  
  const userRole = user.role.toUpperCase();
  
  // Admin has all permissions
  if (userRole === 'ADMIN') {
    return true;
  }
  
  // Get direct permissions for user's role
  const directPermissions = PERMISSIONS[userRole] || [];
  
  // Check direct permissions
  if (directPermissions.includes('*') || directPermissions.includes(permission)) {
    return true;
  }
  
  // Check inherited permissions from role hierarchy
  const inheritedRoles = ROLE_HIERARCHY[userRole] || [];
  for (const inheritedRole of inheritedRoles) {
    const inheritedPermissions = PERMISSIONS[inheritedRole] || [];
    if (inheritedPermissions.includes('*') || inheritedPermissions.includes(permission)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get all permissions for a specific role (including inherited)
 * @param {string} role - Role to get permissions for
 * @returns {Array} Array of permissions
 */
export const getRolePermissions = (role) => {
  const roleKey = role.toUpperCase();
  const permissions = new Set();
  
  // Add direct permissions
  const directPermissions = PERMISSIONS[roleKey] || [];
  directPermissions.forEach(perm => permissions.add(perm));
  
  // Add inherited permissions
  const inheritedRoles = ROLE_HIERARCHY[roleKey] || [];
  inheritedRoles.forEach(inheritedRole => {
    const inheritedPermissions = PERMISSIONS[inheritedRole] || [];
    inheritedPermissions.forEach(perm => permissions.add(perm));
  });
  
  return Array.from(permissions);
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} True if user has any of the permissions
 */
export const hasAnyPermission = (user, permissions) => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} True if user has all permissions
 */
export const hasAllPermissions = (user, permissions) => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Get permissions by category
 * @param {string} category - Category name
 * @returns {Array} Array of permissions in category
 */
export const getPermissionsByCategory = (category) => {
  return PERMISSION_CATEGORIES[category] || [];
};

/**
 * Validate if a permission string is valid
 * @param {string} permission - Permission to validate
 * @returns {boolean} True if valid permission
 */
export const isValidPermission = (permission) => {
  if (permission === '*') return true;
  
  // Check all permission categories
  for (const category of Object.values(PERMISSION_CATEGORIES)) {
    if (category.includes(permission)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get user's effective role (considering guide status)
 * @param {Object} user - User object
 * @returns {string} Effective role
 */
export const getEffectiveRole = (user) => {
  if (user.role === 'guide' && user.guide_status !== 'verified') {
    return 'user'; // Unverified guides have user permissions
  }
  return user.role;
};

/**
 * Check if user can manage a resource (ownership check)
 * @param {Object} user - User object
 * @param {Object} resource - Resource object with created_by field
 * @param {string} resourceType - Type of resource for specific rules
 * @returns {boolean} True if user can manage the resource
 */
export const canManageResource = (user, resource, resourceType = null) => {
  if (!user || !resource) return false;
  
  // Admin and auditor can manage all resources
  if (['admin', 'auditor'].includes(user.role)) {
    return true;
  }
  
  // Check ownership
  const isOwner = resource.created_by === user.id;
  
  if (isOwner) {
    // Owners can manage their own resources with appropriate permissions
    switch (resourceType) {
      case 'destination':
        return hasPermission(user, 'edit_own_destinations');
      case 'booking':
        return hasPermission(user, 'manage_own_bookings');
      default:
        return true;
    }
  }
  
  return false;
};

// Export the main permissions object
export default PERMISSIONS;