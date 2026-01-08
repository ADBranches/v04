// backend/controllers/guide-controller.js
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');

const prisma = new PrismaClient();
const upload = multer({ dest: 'public/documents/' });

class GuideController {
  // Get pending guides (Auditor/Admin only) - Compatible endpoint
  static async getPendingGuides(req, res) {
    try {
      const { page = 1, limit = 10, guide_status = 'pending' } = req.query;
      const skip = (page - 1) * limit;
      
      const where = { guide_status };
      if (guide_status) where.guide_status = guide_status;
      
      const guides = await prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          name: true,
          guide_status: true,
          verification_documents: true,
          verification_submitted_at: true,
          created_at: true,
        },
        orderBy: { verification_submitted_at: 'desc' },
      });
      
      const total = await prisma.user.count({ where });
      
      res.json({
        success: true,
        guides,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      console.error('Get pending guides error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Verify guide (Auditor/Admin only) - Enhanced version
  static async verifyGuide(req, res) {
    try {
      const guideId = parseInt(req.params.id);
      const moderatorId = req.user.id;

      const guide = await prisma.user.findUnique({
        where: { id: guideId },
      });
      
      if (!guide) {
        return res.status(404).json({ 
          success: false,
          error: 'Guide not found', 
          code: 'NOT_FOUND' 
        });
      }

      if (guide.guide_status !== 'pending') {
        return res.status(400).json({ 
          success: false,
          error: 'Guide application is not pending verification',
          code: 'INVALID_STATUS'
        });
      }

      const updatedGuide = await prisma.user.update({
        where: { id: guideId },
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

      res.json({ 
        success: true,
        message: 'Guide verified successfully',
        guide: updatedGuide
      });
    } catch (error) {
      console.error('Verify guide error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Reject guide application (Auditor/Admin only) - Enhanced version
  static async rejectGuide(req, res) {
    try {
      const { reason } = req.body;
      const guideId = parseInt(req.params.id);
      const moderatorId = req.user.id;

      if (!reason) {
        return res.status(400).json({ 
          success: false,
          error: 'Rejection reason is required', 
          code: 'INVALID_DATA' 
        });
      }

      const guide = await prisma.user.findUnique({
        where: { id: guideId },
      });
      
      if (!guide) {
        return res.status(404).json({ 
          success: false,
          error: 'Guide not found', 
          code: 'NOT_FOUND' 
        });
      }

      const updatedGuide = await prisma.user.update({
        where: { id: guideId },
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

      res.json({ 
        success: true,
        message: 'Guide application rejected successfully',
        guide: updatedGuide
      });
    } catch (error) {
      console.error('Reject guide error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Apply as guide (User only) - Enhanced version
  static async applyGuide(req, res) {
    try {
      const { verification_documents } = req.body;
      const userId = req.user.id;

      if (!verification_documents || !Array.isArray(verification_documents) || verification_documents.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Verification documents are required', 
          code: 'INVALID_DATA' 
        });
      }

      // Check if user already has pending application
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { guide_status: true }
      });

      if (existingUser.guide_status === 'pending') {
        return res.status(400).json({ 
          success: false,
          error: 'Guide application already pending',
          code: 'APPLICATION_PENDING'
        });
      }

      if (existingUser.guide_status === 'verified') {
        return res.status(400).json({ 
          success: false,
          error: 'User is already a verified guide',
          code: 'ALREADY_VERIFIED_GUIDE'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          guide_status: 'pending', 
          verification_documents,
          verification_submitted_at: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          guide_status: true,
          verification_submitted_at: true
        }
      });

      // Log application
      await prisma.moderationLog.create({
        data: {
          content_type: 'guide_application',
          content_id: userId,
          action: 'submitted',
          submitted_by: userId,
          notes: 'User applied to become a guide'
        }
      });

      res.json({ 
        success: true,
        message: 'Guide application submitted successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Apply guide error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Get guide verifications (Auditor/Admin only) - From existing
  static async getVerifications(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const verifications = await prisma.guideVerification.findMany({
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { user: { select: { name: true, email: true } } },
        orderBy: { submitted_at: 'desc' },
      });
      
      const total = await prisma.guideVerification.count();
      
      res.json({
        success: true,
        verifications,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      console.error('Get verifications error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Get specific verification (Auditor/Admin only) - From existing
  static async getVerification(req, res) {
    try {
      const verification = await prisma.guideVerification.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { user: { select: { name: true, email: true } } },
      });
      
      if (!verification) {
        return res.status(404).json({ 
          success: false,
          error: 'Verification request not found', 
          code: 'NOT_FOUND' 
        });
      }
      
      res.json({ 
        success: true,
        verification 
      });
    } catch (error) {
      console.error('Get verification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Submit verification with credentials (User only) - From existing
  static async submitVerification(req, res) {
    try {
      const { credentials } = req.body;
      
      // Basic validation
      if (!credentials || typeof credentials !== 'object') {
        return res.status(400).json({ 
          success: false,
          error: 'Valid credentials are required', 
          code: 'INVALID_DATA' 
        });
      }

      const verification = await prisma.guideVerification.create({
        data: {
          user_id: req.user.id,
          credentials: JSON.stringify(credentials),
          status: 'pending',
        },
      });
      
      res.status(201).json({ 
        success: true,
        verification 
      });
    } catch (error) {
      console.error('Submit verification error:', error);
      res.status(error.message ? 400 : 500).json({ 
        success: false,
        error: error.message || 'Internal server error', 
        code: error.message ? 'INVALID_DATA' : 'INTERNAL_ERROR' 
      });
    }
  }

  // Approve verification (Auditor/Admin only) - From existing
  static async approveVerification(req, res) {
    try {
      const { notes } = req.body;
      
      const verification = await prisma.guideVerification.update({
        where: { id: parseInt(req.params.id) },
        data: {
          status: 'approved',
          notes,
          reviewed_at: new Date(),
        },
      });
      
      await prisma.user.update({
        where: { id: verification.user_id },
        data: { guide_status: 'verified' },
      });
      
      res.json({ 
        success: true,
        verification 
      });
    } catch (error) {
      console.error('Approve verification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // Reject verification (Auditor/Admin only) - From existing
  static async rejectVerification(req, res) {
    try {
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ 
          success: false,
          error: 'Rejection reason is required', 
          code: 'INVALID_DATA' 
        });
      }
      
      const verification = await prisma.guideVerification.update({
        where: { id: parseInt(req.params.id) },
        data: {
          status: 'rejected',
          notes: reason,
          reviewed_at: new Date(),
        },
      });
      
      res.json({ 
        success: true,
        verification 
      });
    } catch (error) {
      console.error('Reject verification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      });
    }
  }

  // File upload middleware - From existing
  static uploadDocuments = upload.array('documents', 5);

  // Handle document upload (User only) - From existing
  static async handleDocumentUpload(req, res) {
    try {
      const verification = await prisma.guideVerification.findFirst({
        where: { user_id: req.user.id, status: 'pending' },
      });
      
      if (!verification) {
        return res.status(404).json({ 
          success: false,
          error: 'No pending verification request found', 
          code: 'NOT_FOUND' 
        });
      }
      
      const documents = req.files.map(file => `/documents/${file.filename}`);
      const updated = await prisma.guideVerification.update({
        where: { id: verification.id },
        data: { documents: { push: documents } },
      });
      
      res.json({ 
        success: true,
        verification: updated 
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Document upload failed', 
        code: 'UPLOAD_FAILED' 
      });
    }
  }
}

module.exports = GuideController;