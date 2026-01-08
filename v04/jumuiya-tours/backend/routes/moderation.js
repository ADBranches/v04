// backend/routes/moderation.js
import express from 'express';
import ModerationController from '../controllers/moderation-controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/role-middleware.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();


router.post('/:id/request-revision', requireRole(['admin', 'auditor']), ModerationController.requestRevision);

// Apply authentication to all routes
router.use(authenticateToken);

// Submit content for moderation (Guides only)
router.post('/submit', requireRole(['guide']), ModerationController.submitContent);

// Get content queue (alias for pending) - Auditors only
router.get('/queue', requireRole(['auditor']), ModerationController.getModerationQueue);

// List pending content (Admins/Auditors only) - USING EXISTING METHOD
router.get('/pending', requireRole(['admin', 'auditor']), ModerationController.getModerationQueue);

// Get single moderation request (Admins/Auditors only) - NEW METHOD
router.get('/:id', requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const moderationId = parseInt(req.params.id);
    
    const moderationLog = await prisma.moderationLog.findUnique({
      where: { id: moderationId },
      include: {
        submitter: {
          select: { name: true, email: true }
        },
        moderator: {
          select: { name: true, email: true }
        }
      }
    });

    if (!moderationLog) {
      return res.status(404).json({
        success: false,
        error: 'Moderation request not found',
        code: 'NOT_FOUND'
      });
    }

    // Fetch associated content
    let content = null;
    if (moderationLog.content_type === 'destination') {
      content = await prisma.destination.findUnique({
        where: { id: moderationLog.content_id }
      });
    } else if (moderationLog.content_type === 'user') {
      content = await prisma.user.findUnique({
        where: { id: moderationLog.content_id },
        select: { id: true, name: true, email: true, guide_status: true, bio: true }
      });
    }

    res.json({
      success: true,
      moderationLog: {
        ...moderationLog,
        content
      }
    });
  } catch (error) {
    console.error('Get moderation request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Approve content (Admins/Auditors only)
router.post('/:id/approve', requireRole(['admin', 'auditor']), ModerationController.approveContent);

// Reject content (Admins/Auditors only)
router.post('/:id/reject', requireRole(['admin', 'auditor']), ModerationController.rejectContent);

// Get moderation dashboard stats (Auditor/Admin only) - FIXED VERSION
router.get('/dashboard/stats', requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    // Get pending destinations count
    const pendingDestinationsCount = await prisma.destination.count({
      where: { status: 'pending' }
    });

    // Get pending guide applications count
    const pendingGuidesCount = await prisma.user.count({
      where: { 
        guide_status: 'pending',
        role: 'guide'
      }
    });

    // Get pending moderation logs count
    const pendingModerationCount = await prisma.moderationLog.count({
      where: { status: 'pending' }
    });

    const recentActivity = await prisma.moderationLog.findMany({
      take: 10,
      include: {
        moderator: {
          select: { name: true }
        },
        submitter: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      stats: {
        pending_destinations: pendingDestinationsCount,
        pending_guides: pendingGuidesCount,
        pending_moderation: pendingModerationCount,
        total_pending: pendingDestinationsCount + pendingGuidesCount + pendingModerationCount
      },
      recent_activity: recentActivity
    });
  } catch (error) {
    console.error('Get moderation dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get moderation logs (Auditors/Admins only) - PRISMA VERSION
router.get('/logs/activity', requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * parseInt(limit);

    const where = type ? { content_type: type } : {};

    const logs = await prisma.moderationLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        moderator: {
          select: { name: true, email: true }
        },
        submitter: {
          select: { name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const total = await prisma.moderationLog.count({ where });

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get moderation logs error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get content queue with filters (Auditors only) - PRISMA VERSION
router.get('/queue/filtered', requireRole(['auditor']), async (req, res) => {
  try {
    const { type, status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * parseInt(limit);

    const where = { status };
    if (type) where.content_type = type;

    const moderationLogs = await prisma.moderationLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        submitter: {
          select: { name: true, email: true }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    // Fetch associated content for each log
    const queueWithContent = await Promise.all(
      moderationLogs.map(async (log) => {
        let content = null;
        if (log.content_type === 'destination') {
          content = await prisma.destination.findUnique({
            where: { id: log.content_id },
            select: { id: true, name: true, status: true, location: true }
          });
        } else if (log.content_type === 'user') {
          content = await prisma.user.findUnique({
            where: { id: log.content_id },
            select: { id: true, name: true, email: true, guide_status: true }
          });
        }
        
        return {
          ...log,
          content
        };
      })
    );

    const total = await prisma.moderationLog.count({ where });

    res.json({
      success: true,
      queue: queueWithContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get filtered queue error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;