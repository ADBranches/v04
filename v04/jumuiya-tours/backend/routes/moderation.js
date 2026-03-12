// backend/routes/moderation.js
import express from 'express';
import ModerationController from '../controllers/moderation-controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-middleware.js';
import { PrismaClient } from '@prisma/client';

// ⬇️ Permission-based guards still used where appropriate
import {
  requirePermission,
  requireAnyPermission,
} from '../middleware/permission-middleware.js';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Apply authentication for everything
router.use(authenticateToken);

// 🔹 Request a revision on content
// Fine-grained permission still makes sense here
router.post(
  '/:id/request-revision',
  requirePermission('request_content_revisions'),
  ModerationController.requestRevision
);

// 🔹 Submit content for moderation (Guides only)
router.post(
  '/submit',
  requireRole(['guide']),
  ModerationController.submitContent
);

// 🔹 Get content queue (alias for pending)
router.get(
  '/queue',
  requireRole(['admin', 'auditor']),
  ModerationController.getModerationQueue
);

// 🔹 List pending content
router.get(
  '/pending',
  requireRole(['admin', 'auditor']),
  ModerationController.getModerationQueue
);

// 🔹 Get single moderation request
router.get(
  '/:id',
  requireRole(['admin', 'auditor']),
  async (req, res) => {
    try {
      const moderationId = parseInt(req.params.id, 10);

      const moderationLog = await prisma.moderationLog.findUnique({
        where: { id: moderationId },
        include: {
          submitter: {
            select: { name: true, email: true },
          },
          moderator: {
            select: { name: true, email: true },
          },
        },
      });

      if (!moderationLog) {
        return res.status(404).json({
          success: false,
          error: 'Moderation request not found',
          code: 'NOT_FOUND',
        });
      }

      // Fetch associated content
      let content = null;
      if (moderationLog.content_type === 'destination') {
        content = await prisma.destination.findUnique({
          where: { id: moderationLog.content_id },
        });
      } else if (moderationLog.content_type === 'user') {
        content = await prisma.user.findUnique({
          where: { id: moderationLog.content_id },
          select: {
            id: true,
            name: true,
            email: true,
            guide_status: true,
            bio: true,
          },
        });
      }

      res.json({
        success: true,
        moderationLog: {
          ...moderationLog,
          content,
        },
      });
    } catch (error) {
      console.error('Get moderation request error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);

// 🔹 Approve content
router.post(
  '/:id/approve',
  requireAnyPermission(['approve_content', 'approve_destinations']),
  ModerationController.approveContent
);

// 🔹 Reject content
router.post(
  '/:id/reject',
  requireAnyPermission(['reject_content', 'reject_destinations']),
  ModerationController.rejectContent
);

// 🔹 Get moderation dashboard stats
router.get(
  '/dashboard/stats',
  requireRole(['admin', 'auditor']),
  async (req, res) => {
    try {
      const pendingDestinationsCount = await prisma.destination.count({
        where: { status: 'pending' },
      });

      const pendingGuidesCount = await prisma.user.count({
        where: {
          guide_status: 'pending',
          role: 'guide',
        },
      });

      const pendingModerationCount = await prisma.moderationLog.count({
        where: { status: 'pending' },
      });

      const recentActivity = await prisma.moderationLog.findMany({
        take: 10,
        include: {
          moderator: {
            select: { name: true },
          },
          submitter: {
            select: { name: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      res.json({
        success: true,
        stats: {
          pending_destinations: pendingDestinationsCount,
          pending_guides: pendingGuidesCount,
          pending_moderation: pendingModerationCount,
          total_pending:
            pendingDestinationsCount +
            pendingGuidesCount +
            pendingModerationCount,
        },
        recent_activity: recentActivity,
      });
    } catch (error) {
      console.error('Get moderation dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
);

// 🔹 Get moderation logs
router.get(
  '/logs/activity',
  requireRole(['admin', 'auditor']),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const skip = (parsedPage - 1) * parsedLimit;

      const where = type ? { content_type: type } : {};

      const logs = await prisma.moderationLog.findMany({
        where,
        skip,
        take: parsedLimit,
        include: {
          moderator: {
            select: { name: true, email: true },
          },
          submitter: {
            select: { name: true, email: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      const total = await prisma.moderationLog.count({ where });

      res.json({
        success: true,
        logs,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit),
        },
      });
    } catch (error) {
      console.error('Get moderation logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
);

// 🔹 Get content queue with filters
router.get(
  '/queue/filtered',
  requireRole(['admin', 'auditor']),
  async (req, res) => {
    try {
      const { type, status = 'pending', page = 1, limit = 20 } = req.query;
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const skip = (parsedPage - 1) * parsedLimit;

      const where = { status };
      if (type) where.content_type = type;

      const moderationLogs = await prisma.moderationLog.findMany({
        where,
        skip,
        take: parsedLimit,
        include: {
          submitter: {
            select: { name: true, email: true },
          },
        },
        orderBy: { created_at: 'asc' },
      });

      const queueWithContent = await Promise.all(
        moderationLogs.map(async (log) => {
          let content = null;

          if (log.content_type === 'destination') {
            content = await prisma.destination.findUnique({
              where: { id: log.content_id },
              select: {
                id: true,
                name: true,
                status: true,
                location: true,
              },
            });
          } else if (log.content_type === 'user') {
            content = await prisma.user.findUnique({
              where: { id: log.content_id },
              select: {
                id: true,
                name: true,
                email: true,
                guide_status: true,
              },
            });
          }

          return {
            ...log,
            content,
          };
        })
      );

      const total = await prisma.moderationLog.count({ where });

      res.json({
        success: true,
        queue: queueWithContent,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit),
        },
      });
    } catch (error) {
      console.error('Get filtered queue error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    }
  }
);

export default router;