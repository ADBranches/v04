// backend/config/moderation-permissions-map.js

/**
 * Moderation route → permission map
 * Purely for documentation, debugging, and tooling.
 *
 * Keys use the pattern: "METHOD /moderation/route"
 * Paths use Express-style params (e.g. ":id").
 */

export const MODERATION_PERMISSION_MAP = {
  // Revision requests
  'POST /moderation/:id/request-revision': ['request_content_revisions'],

  // Content submission (currently still guarded by requireRole(['guide']),
  // but this is the logical permission behind it)
  'POST /moderation/submit': ['submit_destinations'],

  // Queues and pending lists
  'GET /moderation/queue': ['view_moderation_queue'],
  'GET /moderation/pending': ['view_moderation_queue'],
  'GET /moderation/queue/filtered': ['view_moderation_queue'],

  // Single moderation item view
  'GET /moderation/:id': ['review_content'],

  // Approve / reject actions
  'POST /moderation/:id/approve': ['approve_content', 'approve_destinations'],
  'POST /moderation/:id/reject': ['reject_content', 'reject_destinations'],

  // Dashboard & logs
  'GET /moderation/dashboard/stats': ['access_moderation_dashboard'],
  'GET /moderation/logs/activity': ['view_moderation_logs'],
};

/**
 * Helper to get permissions for a moderation route.
 * 
 * NOTE: This is for docs/debugging. It expects the *normalized* path,
 * not the concrete one with IDs (so use "/moderation/:id/approve", not "/moderation/42/approve").
 *
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - Normalized path (e.g. "/moderation/:id/approve")
 * @returns {string[] | null}
 */
export const getModerationPermissionsForRoute = (method, path) => {
  const key = `${method.toUpperCase()} ${path}`;
  return MODERATION_PERMISSION_MAP[key] || null;
};

export default MODERATION_PERMISSION_MAP;