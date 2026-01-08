// backend/controllers/moderation-controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class ModerationController {
  /* ─────────────── SUBMIT CONTENT (Guide submits for moderation) ─────────────── */
  static async submitContent(req, res) {
    try {
      const { content_type, content_id } = req.body;

      if (!content_type || !content_id) {
        return res.status(400).json({
          success: false,
          error: 'Content type and ID are required',
          code: 'INVALID_DATA',
        });
      }

      // Validate target content
      let content;
      if (content_type === 'destination') {
        content = await prisma.destination.findUnique({ where: { id: parseInt(content_id) } });
      } else if (content_type === 'user') {
        content = await prisma.user.findUnique({ where: { id: parseInt(content_id) } });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid content type',
          code: 'INVALID_TYPE',
        });
      }

      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Content not found',
          code: 'NOT_FOUND',
        });
      }

      // Prevent duplicate submissions
      const existingSubmission = await prisma.moderationLog.findFirst({
        where: { content_type, content_id: parseInt(content_id), status: 'pending' },
      });

      if (existingSubmission) {
        return res.status(409).json({
          success: false,
          error: 'Content already submitted for moderation',
          code: 'ALREADY_SUBMITTED',
        });
      }

      const moderationLog = await prisma.moderationLog.create({
        data: {
          content_type,
          content_id: parseInt(content_id),
          status: 'pending',
          submitted_by: req.user.id,
          submitted_at: new Date(),
          action: 'submitted',
        },
      });

      res.status(201).json({
        success: true,
        message: 'Content submitted for moderation',
        moderationLog,
      });
    } catch (error) {
      console.error('Submit content error:', error);
      res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /* ─────────────── GET MODERATION QUEUE ─────────────── */
  static async getModerationQueue(req, res) {
    try {
      const { content_type, status = 'pending', page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { status };
      if (content_type) where.content_type = content_type;

      const moderationLogs = await prisma.moderationLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          submitter: { select: { name: true, email: true } },
          moderator: { select: { name: true, email: true } },
        },
        orderBy: { submitted_at: 'desc' },
      });

      // Fetch content associated with each log
      const logsWithContent = await Promise.all(
        moderationLogs.map(async (log) => {
          let content = null;
          if (log.content_type === 'destination') {
            content = await prisma.destination.findUnique({
              where: { id: log.content_id },
              select: { id: true, name: true, description: true, region: true, status: true },
            });
          } else if (log.content_type === 'user') {
            content = await prisma.user.findUnique({
              where: { id: log.content_id },
              select: { id: true, name: true, email: true, guide_status: true, bio: true },
            });
          }
          return { ...log, content };
        })
      );

      const total = await prisma.moderationLog.count({ where });
      res.json({
        success: true,
        content: logsWithContent,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      console.error('Get moderation queue error:', error);
      res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /* ─────────────── APPROVE CONTENT ─────────────── */
  static async approveContent(req, res) {
    try {
      const { notes } = req.body;
      const moderationId = parseInt(req.params.id);

      const moderationLog = await prisma.moderationLog.findUnique({ where: { id: moderationId } });
      if (!moderationLog) return res.status(404).json({ success: false, error: 'Moderation request not found' });

      if (moderationLog.status !== 'pending')
        return res.status(400).json({ success: false, error: 'Request already processed' });

      // Update log
      const updatedLog = await prisma.moderationLog.update({
        where: { id: moderationId },
        data: {
          status: 'approved',
          notes,
          moderator_id: req.user.id,
          action: 'approved',
        },
      });

      // Update actual content
      if (moderationLog.content_type === 'destination') {
        await prisma.destination.update({
          where: { id: moderationLog.content_id },
          data: { status: 'approved', approved_by: req.user.id, approved_at: new Date() },
        });
      } else if (moderationLog.content_type === 'user') {
        await prisma.user.update({
          where: { id: moderationLog.content_id },
          data: { guide_status: 'verified', verified_by: req.user.id, verified_at: new Date() },
        });
      }

      res.json({ success: true, message: 'Content approved successfully', moderationLog: updatedLog });
    } catch (error) {
      console.error('Approve content error:', error);
      res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /* ─────────────── REJECT CONTENT ─────────────── */
  static async rejectContent(req, res) {
    try {
      const { reason } = req.body;
      const moderationId = parseInt(req.params.id);
      if (!reason)
        return res.status(400).json({ success: false, error: 'Rejection reason required', code: 'INVALID_DATA' });

      const moderationLog = await prisma.moderationLog.findUnique({ where: { id: moderationId } });
      if (!moderationLog)
        return res.status(404).json({ success: false, error: 'Moderation request not found', code: 'NOT_FOUND' });

      if (moderationLog.status !== 'pending')
        return res.status(400).json({ success: false, error: 'Request already processed', code: 'ALREADY_PROCESSED' });

      // Update log and linked content
      const updatedLog = await prisma.moderationLog.update({
        where: { id: moderationId },
        data: {
          status: 'rejected',
          notes: reason,
          moderator_id: req.user.id,
          action: 'rejected',
          rejection_reason: reason,
        },
      });

      if (moderationLog.content_type === 'destination') {
        await prisma.destination.update({
          where: { id: moderationLog.content_id },
          data: { status: 'rejected', rejection_reason: reason },
        });
      } else if (moderationLog.content_type === 'user') {
        await prisma.user.update({
          where: { id: moderationLog.content_id },
          data: { guide_status: 'rejected', rejection_reason: reason },
        });
      }

      res.json({ success: true, message: 'Content rejected successfully', moderationLog: updatedLog });
    } catch (error) {
      console.error('Reject content error:', error);
      res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  /* ─────────────── NEW: REQUEST REVISION ─────────────── */
  static async requestRevision(req, res) {
    try {
      const moderationId = parseInt(req.params.id);
      const { notes } = req.body;

      const moderationLog = await prisma.moderationLog.findUnique({ where: { id: moderationId } });
      if (!moderationLog)
        return res.status(404).json({ success: false, error: 'Moderation request not found', code: 'NOT_FOUND' });

      if (moderationLog.status !== 'pending')
        return res.status(400).json({ success: false, error: 'Already processed', code: 'ALREADY_PROCESSED' });

      const updatedLog = await prisma.moderationLog.update({
        where: { id: moderationId },
        data: {
          status: 'revision_requested',
          notes,
          moderator_id: req.user.id,
          action: 'revision_requested',
        },
      });

      // Notify user or mark content
      if (moderationLog.content_type === 'destination') {
        await prisma.destination.update({
          where: { id: moderationLog.content_id },
          data: { status: 'revision_requested' },
        });
      }

      res.json({ success: true, message: 'Revision requested successfully', moderationLog: updatedLog });
    } catch (err) {
      console.error('Request revision error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /* ─────────────── PENDING GUIDES ─────────────── */
  static async getPendingGuides(req, res) {
    try {
      const pendingGuides = await prisma.user.findMany({
        where: { guide_status: 'pending' },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          phone_number: true,
          guide_status: true,
          verification_documents: true,
        },
      });

      res.json({ success: true, pendingGuides, count: pendingGuides.length });
    } catch (error) {
      console.error('Get pending guides error:', error);
      res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}

export default ModerationController;

