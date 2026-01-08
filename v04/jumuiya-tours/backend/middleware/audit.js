// backend/middleware/audit.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Audit logging middleware for tracking user actions
 */

/**
 * Log audit event directly using Prisma
 */
export const logAuditEvent = async (
  userId,
  action,
  resourceType,
  resourceId,
  details = {}
) => {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId || null,
        action,
        resource_type: resourceType || null,
        resource_id: resourceId || null,
        ip_address: details.ipAddress || '127.0.0.1',
        user_agent: details.userAgent || 'System',
        old_values: details.oldValues || null,
        new_values: details.newValues || null,
        request_method: details.requestMethod || null,
        request_url: details.requestUrl || null,
        status_code: details.statusCode || null,
        error_message: details.errorMessage || null,
      },
    });
    console.log(`📝 Audit logged: ${action} by user ${userId || 'System'}`);
  } catch (error) {
    console.error('Audit event logging error:', error);
  }
};

/**
 * Middleware to automatically log requests
 */
export const auditLogger = (action = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();

    // Capture response data
    res.send = function (data) {
      res._responseData = data;
      return originalSend.apply(this, arguments);
    };

    // Log after response completes
    res.on('finish', async () => {
      try {
        if (req.user && shouldLogRequest(req)) {
          const duration = Date.now() - startTime;
          const auditAction = action || getActionFromRequest(req);

          await logAuditEvent(
            req.user.id,
            auditAction,
            getResourceType(req),
            getResourceId(req),
            {
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              requestMethod: req.method,
              requestUrl: req.originalUrl,
              statusCode: res.statusCode,
              responseTime: duration,
              oldValues: null,
              newValues: res._responseData || null,
            }
          );
        }
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });

    next();
  };
};

/**
 * Determine if request should be logged
 */
function shouldLogRequest(req) {
  const excludedPaths = [
    '/api/health',
    '/api/status',
    '/api/uploads',
    '/favicon.ico',
  ];
  return !excludedPaths.some((path) => req.path.startsWith(path));
}

/**
 * Extract action from request
 */
function getActionFromRequest(req) {
  const method = req.method.toLowerCase();
  const path = req.path;

  if (path.includes('/auth/login')) return 'USER_LOGIN';
  if (path.includes('/auth/register')) return 'USER_REGISTER';
  if (path.includes('/auth/logout')) return 'USER_LOGOUT';
  if (path.includes('/destinations') && method === 'post')
    return 'DESTINATION_CREATE';
  if (path.includes('/destinations') && method === 'put')
    return 'DESTINATION_UPDATE';
  if (path.includes('/bookings') && method === 'post') return 'BOOKING_CREATE';
  if (path.includes('/guides/apply')) return 'GUIDE_APPLICATION';

  return `${method.toUpperCase()}_${path.split('/').pop()?.toUpperCase() || 'UNKNOWN'}`;
}

/**
 * Extract resource type from request
 */
function getResourceType(req) {
  const path = req.path;
  if (path.includes('/destinations')) return 'destination';
  if (path.includes('/bookings')) return 'booking';
  if (path.includes('/users')) return 'user';
  if (path.includes('/guides')) return 'guide';
  if (path.includes('/auth')) return 'auth';
  return 'system';
}

/**
 * Extract resource ID from request
 */
function getResourceId(req) {
  return req.params.id || req.body.id || req.query.id || null;
}

export default { logAuditEvent, auditLogger };
