// backend/routes/guides.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole, requireVerifiedGuide, canBecomeGuide } from '../middleware/role-middleware.js';
import { requirePermission } from '../middleware/permission-middleware.js';
import { logAuditEvent } from '../middleware/audit.js';

const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Apply as guide (User only)
// Apply as guide (Use canBecomeGuide middleware)
router.post('/apply', 
  authenticateToken,
  canBecomeGuide, // ← CHANGED: Use canBecomeGuide instead of requireRole(['user'])
  async (req, res) => {
    try {
      const userId = req.user.id;

      // The canBecomeGuide middleware already validated eligibility
      // So we can proceed directly with the application

      // Update user - set role to 'guide' and status to 'pending'
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          role: 'guide', // Change role to guide
          guide_status: 'pending',
          verification_submitted_at: new Date()
        }
      });

      // Log application
      await logAuditEvent(
        userId,
        'APPLY_GUIDE',
        'user',
        userId,
        { notes: 'User applied to become a guide' }
      );

      // Create notification for auditors/admins
      try {
        const auditors = await prisma.user.findMany({
          where: {
            role: { in: ['admin', 'auditor'] },
            is_active: true
          },
          select: { id: true }
        });

        const notifications = auditors.map(auditor => ({
          user_id: auditor.id,
          type: 'guide_application',
          title: 'New Guide Application',
          message: `User ${req.user.name} has applied to become a guide.`,
          priority: 'normal',
          data: JSON.stringify({ 
            applicant_id: userId, 
            applicant_name: req.user.name 
          })
        }));

        await prisma.notification.createMany({
          data: notifications
        });
      } catch (notificationError) {
        console.log('Could not create notification:', notificationError.message);
      }

      res.json({ 
        success: true,
        message: 'Guide application submitted successfully',
        status: 'pending'
      });

    } catch (error) {
      console.error('Guide application error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to submit guide application',
        code: 'APPLICATION_SUBMISSION_ERROR'
      });
    }
  }
);

// Get pending guide applications (Auditor/Admin only) - Compatible endpoint
router.get('/pending', 
  requirePermission('verify_guides'),
  async (req, res) => {
    try {
      const pendingApplications = await prisma.user.findMany({
        where: { 
          guide_status: 'pending'
        },
        select: {
          id: true,
          email: true,
          name: true,
          guide_status: true,
          verification_submitted_at: true,
          created_at: true
        },
        orderBy: { verification_submitted_at: 'asc' }
      });

      res.json({ 
        success: true,
        pending_applications: pendingApplications,
        pendingGuides: pendingApplications, // Alias for compatibility
        count: pendingApplications.length
      });
    } catch (error) {
      console.error('Get pending guides error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch pending guide applications',
        code: 'FETCH_PENDING_GUIDES_ERROR'
      });
    }
  }
);

// Get specific guide verification details
router.get('/verifications/:id',
  requirePermission('verify_guides'),
  async (req, res) => {
    try {
      const verificationId = parseInt(req.params.id);

      const verification = await prisma.user.findUnique({
        where: { id: verificationId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          guide_status: true,
          verification_submitted_at: true,
          verified_at: true,
          verified_by: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!verification) {
        return res.status(404).json({ 
          success: false,
          error: 'Guide verification not found',
          code: 'VERIFICATION_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        verification
      });
    } catch (error) {
      console.error('Get guide verification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch guide verification',
        code: 'FETCH_VERIFICATION_ERROR'
      });
    }
  }
);

// Verify guide (Auditor/Admin only) - Compatible endpoint
router.post('/:id/verify', 
  requirePermission('verify_guides'),
  async (req, res) => {
    try {
      const guideId = parseInt(req.params.id);
      const moderatorId = req.user.id;

      const guide = await prisma.user.update({
        where: { 
          id: guideId,
          guide_status: 'pending'
        },
        data: { 
          guide_status: 'verified',
          role: 'guide',
          verified_by: moderatorId,
          verified_at: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          guide_status: true,
          verified_at: true
        }
      });

      if (!guide) {
        return res.status(404).json({ 
          success: false,
          error: 'Guide application not found or not pending',
          code: 'GUIDE_NOT_FOUND'
        });
      }

      // Log verification
      await prisma.moderationLog.create({
        data: {
          content_type: 'guide_verification',
          content_id: guideId,
          action: 'verified',
          moderator_id: moderatorId,
          notes: 'Guide application approved'
        }
      });

      // Create notification for the new guide
      try {
        await prisma.notification.create({
          data: {
            user_id: guideId,
            type: 'guide_verification',
            title: 'Guide Application Approved',
            message: 'Congratulations! Your guide application has been approved.',
            data: JSON.stringify({ 
              guide_id: guideId,
              approved_by: moderatorId 
            })
          }
        });
      } catch (notificationError) {
        console.log('Could not create notification:', notificationError.message);
      }

      res.json({
        success: true,
        message: 'Guide verified successfully',
        guide
      });
    } catch (error) {
      console.error('Verify guide error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          success: false,
          error: 'Guide application not found',
          code: 'GUIDE_NOT_FOUND'
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to verify guide',
        code: 'VERIFY_GUIDE_ERROR'
      });
    }
  }
);

// Reject guide application (Auditor/Admin only) - Compatible endpoint
router.post('/:id/reject', 
  requirePermission('verify_guides'),
  async (req, res) => {
    try {
      const guideId = parseInt(req.params.id);
      const moderatorId = req.user.id;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ 
          success: false,
          error: 'Rejection reason is required',
          code: 'MISSING_REASON'
        });
      }

      const guide = await prisma.user.update({
        where: { 
          id: guideId,
          guide_status: 'pending'
        },
        data: { 
          guide_status: 'rejected',
          rejection_reason: reason
        },
        select: {
          id: true,
          email: true,
          name: true,
          guide_status: true,
          rejection_reason: true
        }
      });

      if (!guide) {
        return res.status(404).json({ 
          success: false,
          error: 'Guide application not found or not pending',
          code: 'GUIDE_NOT_FOUND'
        });
      }

      // Log rejection
      await prisma.moderationLog.create({
        data: {
          content_type: 'guide_verification',
          content_id: guideId,
          action: 'rejected',
          moderator_id: moderatorId,
          notes: `Rejected: ${reason}`
        }
      });

      // Create notification for the applicant
      try {
        await prisma.notification.create({
          data: {
            user_id: guideId,
            type: 'guide_verification',
            title: 'Guide Application Update',
            message: `Your guide application needs revisions: ${reason}`,
            data: JSON.stringify({ 
              guide_id: guideId,
              rejected_by: moderatorId,
              reason: reason
            })
          }
        });
      } catch (notificationError) {
        console.log('Could not create notification:', notificationError.message);
      }

      res.json({
        success: true,
        message: 'Guide application rejected successfully',
        guide
      });
    } catch (error) {
      console.error('Reject guide error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          success: false,
          error: 'Guide application not found',
          code: 'GUIDE_NOT_FOUND'
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to reject guide application',
        code: 'REJECT_GUIDE_ERROR'
      });
    }
  }
);

// Suspend guide (Auditor/Admin only)
router.post('/:id/suspend', 
  requirePermission('verify_guides'),
  async (req, res) => {
    try {
      const guideId = parseInt(req.params.id);
      const { reason } = req.body;
      const moderatorId = req.user.id;

      const guide = await prisma.user.update({
        where: { 
          id: guideId,
          role: 'guide'
        },
        data: { 
          guide_status: 'suspended'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          guide_status: true
        }
      });

      if (!guide) {
        return res.status(404).json({ 
          success: false,
          error: 'Guide not found',
          code: 'GUIDE_NOT_FOUND'
        });
      }

      // Log suspension
      await prisma.moderationLog.create({
        data: {
          content_type: 'guide_verification',
          content_id: guideId,
          action: 'suspended',
          moderator_id: moderatorId,
          notes: reason || 'Guide suspended'
        }
      });

      res.json({
        success: true,
        message: 'Guide suspended successfully',
        guide
      });
    } catch (error) {
      console.error('Suspend guide error:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          success: false,
          error: 'Guide not found',
          code: 'GUIDE_NOT_FOUND'
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to suspend guide',
        code: 'SUSPEND_GUIDE_ERROR'
      });
    }
  }
);

// Get all verified guides (public)
router.get('/', async (req, res) => {
  try {
    const guides = await prisma.user.findMany({
      where: { 
        role: 'guide',
        guide_status: 'verified',
        is_active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        guide_status: true,
        verified_at: true,
        created_at: true
      },
      orderBy: { verified_at: 'desc' }
    });

    res.json({ 
      success: true,
      guides: guides,
      count: guides.length
    });
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch guides',
      code: 'FETCH_GUIDES_ERROR'
    });
  }
});

// Upload guide documents (Guide only)
router.post('/documents', 
  requireRole(['guide']),
  async (req, res) => {
    try {
      // This would handle file uploads for guide verification documents
      // Implementation depends on your file upload strategy
      
      res.json({
        success: true,
        message: 'Documents uploaded successfully'
      });
    } catch (error) {
      console.error('Upload documents error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to upload documents',
        code: 'UPLOAD_DOCUMENTS_ERROR'
      });
    }
  }
);

export default router;