// backend/routes/destinations.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { requireRole, requireVerifiedGuide } from '../middleware/role-middleware.js';
import {
  requirePermission,
  requireAnyPermission,
  requireResourceAccess,
  scopedQuery
} from '../middleware/permission-middleware.js';
import { logAuditEvent } from '../middleware/audit.js';

const prisma = new PrismaClient();
const router = express.Router();

/* =========================================================
   🧭 PUBLIC + SEARCH ROUTES (must appear before :id routes)
========================================================= */

// Get all destinations (public with optional auth)
router.get(
  '/',
  optionalAuth,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        region,
        difficulty,
        featured,
        search,
        sort = 'created_at',
        order = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;
      const validSortFields = ['name', 'created_at', 'view_count', 'price_range'];
      const sortField = validSortFields.includes(sort) ? sort : 'created_at';
      const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';

      let where = {};

      // Role-based visibility
      if (!req.user) {
        // Public users — only approved
        where.status = 'approved';
      } else if (req.user.role === 'guide') {
        // Guides — approved or self-created
        where.OR = [
          { status: 'approved' },
          { created_by: req.user.id }
        ];
      } else if (['admin', 'auditor'].includes(req.user.role)) {
        // Admin/Auditor — can see all
        where = {};
      } else {
        // Default fallback — approved only
        where.status = 'approved';
      }

      // Filters
      if (region) where.region = region;
      if (difficulty) where.difficulty_level = difficulty;
      if (featured === 'true') where.featured = true;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { short_description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [destinations, total] = await Promise.all([
        prisma.destination.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { [sortField]: sortOrder },
          include: {
            creator: { select: { name: true } },
            bookings: { where: { status: 'completed' }, select: { id: true } },
            reviews: { where: { status: 'active' }, select: { rating: true } }
          }
        }),
        prisma.destination.count({ where })
      ]);

      const destinationsWithStats = destinations.map(dest => ({
        ...dest,
        booking_count: dest.bookings.length,
        average_rating:
          dest.reviews.length > 0
            ? dest.reviews.reduce((sum, r) => sum + r.rating, 0) / dest.reviews.length
            : null
      }));

      res.json({
        success: true,
        destinations: destinationsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get destinations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch destinations',
        code: 'FETCH_DESTINATIONS_ERROR'
      });
    }
  }
);

// 🔍 Search destinations (public or authenticated)
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { query = '', region, difficulty, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        query ? { name: { contains: query, mode: 'insensitive' } } : {},
        region ? { region: { contains: region, mode: 'insensitive' } } : {},
        difficulty ? { difficulty_level: { equals: difficulty } } : {},
        { status: 'approved' }
      ]
    };

    // remove AND if all filters empty
    if (!query && !region && !difficulty) delete where.AND;

    const [destinations, total] = await Promise.all([
      prisma.destination.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          region: true,
          district: true,
          location: true,
          price_range: true,
          images: true,
          difficulty_level: true,
          featured: true,
          status: true
        }
      }),
      prisma.destination.count({ where })
    ]);

    res.json({
      success: true,
      destinations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('🔍 Destination search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search destinations',
      code: 'SEARCH_DESTINATIONS_ERROR'
    });
  }
});

/* =========================================================
   🧩 MODERATION ROUTES (publish/unpublish etc.)
========================================================= */

// 📢 Publish destination (Admin/Auditor only)
router.post(
  '/:id/publish',
  authenticateToken,
  requireAnyPermission(['publish_destinations', 'approve_destinations']),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid destination ID', code: 'INVALID_ID' });
      }

      const existing = await prisma.destination.findUnique({ where: { id } });
      if (!existing) {
        return res
          .status(404)
          .json({ success: false, error: 'Destination not found', code: 'DESTINATION_NOT_FOUND' });
      }

      const destination = await prisma.destination.update({
        where: { id },
        data: { status: 'approved', approved_by: req.user.id, approved_at: new Date() }
      });

      await prisma.moderationLog.create({
        data: {
          content_type: 'destination',
          content_id: id,
          action: 'published',
          moderator_id: req.user.id,
          notes: 'Destination published to public view'
        }
      });

      res.json({ success: true, message: 'Destination published successfully', destination });
    } catch (error) {
      console.error('Publish destination error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to publish destination',
        code: 'PUBLISH_DESTINATION_ERROR'
      });
    }
  }
);

// 🔒 Unpublish destination (Admin/Auditor only)
router.post(
  '/:id/unpublish',
  authenticateToken,
  requireAnyPermission(['unpublish_destinations', 'approve_destinations']),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: 'Invalid destination ID', code: 'INVALID_ID' });
      }

      const existing = await prisma.destination.findUnique({ where: { id } });
      if (!existing) {
        return res
          .status(404)
          .json({ success: false, error: 'Destination not found', code: 'DESTINATION_NOT_FOUND' });
      }

      const destination = await prisma.destination.update({
        where: { id },
        data: { status: 'unpublished', approved_by: req.user.id, approved_at: new Date() }
      });

      await prisma.moderationLog.create({
        data: {
          content_type: 'destination',
          content_id: id,
          action: 'unpublished',
          moderator_id: req.user.id,
          notes: 'Destination removed from public listings'
        }
      });

      res.json({ success: true, message: 'Destination unpublished successfully', destination });
    } catch (error) {
      console.error('Unpublish destination error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unpublish destination',
        code: 'UNPUBLISH_DESTINATION_ERROR'
      });
    }
  }
);

/* =========================================================
   🧱 CRUD ROUTES (after search & moderation)
========================================================= */
// Create destination (Admin + Guides)
router.post(
  '/',
  authenticateToken,
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const {
        name,
        description,
        location,
        region,
        district,
        price_range,
        duration,
        difficulty_level,
        best_season,
        images,
        highlights,
        included,
        not_included,
        requirements,
      } = req.body;

      if (!name || !location) {
        return res.status(400).json({
          success: false,
          error: 'Name and location are required',
          code: 'MISSING_REQUIRED_FIELDS',
        });
      }

      const isAdminOrAuditor = ['admin', 'auditor'].includes(req.user.role);
      const status = isAdminOrAuditor ? 'approved' : 'draft';

      const data = {
        name: name.trim(),
        description: description || null,
        short_description:
          (description && description.slice(0, 200)) ||
          null,
        location: location.trim(),
        created_by: req.user.id,
        status,
        approved_by: isAdminOrAuditor ? req.user.id : null,
        approved_at: isAdminOrAuditor ? new Date() : null,
      };

      if (region) data.region = region;
      if (district) data.district = district;
      if (price_range) data.price_range = price_range;
      if (duration) data.duration = duration;
      if (difficulty_level) data.difficulty_level = difficulty_level;
      if (best_season) data.best_season = best_season;
      if (Array.isArray(images)) data.images = images;
      if (Array.isArray(highlights)) data.highlights = highlights;
      if (Array.isArray(included)) data.included = included;
      if (Array.isArray(not_included)) data.not_included = not_included;
      if (requirements) data.requirements = requirements;

      const destination = await prisma.destination.create({ data });

      // Audit log (optional but nice, matches your delete route)
      await logAuditEvent(
        req.user.id,
        'CREATE_DESTINATION',
        'destination',
        destination.id,
        {
          newValues: {
            name: destination.name,
            location: destination.location,
            status: destination.status,
          },
        },
      );

      return res.status(201).json({
        success: true,
        message: 'Destination created successfully',
        destination,
      });
    } catch (error) {
      console.error('Create destination error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create destination',
        code: 'CREATE_DESTINATION_ERROR',
      });
    }
  },
);

// Get destination by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await prisma.destination.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: { select: { name: true, email: true } },
        bookings: { where: { status: 'completed' }, select: { id: true } },
        reviews: { where: { status: 'active' }, select: { id: true, rating: true } }
      }
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        error: 'Destination not found',
        code: 'DESTINATION_NOT_FOUND'
      });
    }

    const canView = await checkDestinationAccess(req.user, destination);
    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view this destination.',
        code: 'DESTINATION_ACCESS_DENIED'
      });
    }

    const destinationWithStats = {
      ...destination,
      booking_count: destination.bookings.length,
      average_rating:
        destination.reviews.length > 0
          ? destination.reviews.reduce((s, r) => s + r.rating, 0) / destination.reviews.length
          : null,
      review_count: destination.reviews.length
    };

    if (destination.status === 'approved') {
      await prisma.destination.update({
        where: { id: parseInt(id) },
        data: { view_count: { increment: 1 } }
      });
    }

    res.json({ success: true, destination: destinationWithStats });
  } catch (error) {
    console.error('Get destination error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch destination',
      code: 'FETCH_DESTINATION_ERROR'
    });
  }
});



// ✅ (Retain all your remaining CRUD, approve/reject, feature/unfeature, delete, and admin stats routes unchanged below)
/* =========================================================
   🧾 APPROVAL & REJECTION ROUTES
========================================================= */

// Approve destination (Auditor/Admin only)
router.post('/:id/approve',
  authenticateToken,
  requirePermission('approve_destinations'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid ID', code: 'INVALID_ID' });
      }

      const existing = await prisma.destination.findUnique({ where: { id } });
      if (!existing || existing.status !== 'pending') {
        return res.status(404).json({
          success: false,
          error: 'Destination not found or not pending approval',
          code: 'APPROVAL_FAILED'
        });
      }

      const destination = await prisma.destination.update({
        where: { id },
        data: { status: 'approved', approved_by: req.user.id, approved_at: new Date() }
      });

      await prisma.moderationLog.create({
        data: {
          content_type: 'destination',
          content_id: id,
          action: 'approved',
          moderator_id: req.user.id,
          notes: notes || 'Destination approved for publication'
        }
      });

      // Notify creator
      try {
        await prisma.notification.create({
          data: {
            user_id: destination.created_by,
            type: 'destination',
            title: 'Destination Approved',
            message: `Your destination "${destination.name}" has been approved and is now live.`,
            data: JSON.stringify({ destination_id: id, destination_name: destination.name })
          }
        });
      } catch (notifyErr) {
        console.log('Notification failed:', notifyErr.message);
      }

      res.json({ success: true, message: 'Destination approved successfully', destination });
    } catch (error) {
      console.error('Approve destination error:', error);
      res.status(500).json({ success: false, error: 'Failed to approve destination', code: 'APPROVE_DESTINATION_ERROR' });
    }
  }
);

// Reject destination (Auditor/Admin only)
router.post('/:id/reject',
  authenticateToken,
  requirePermission('reject_destinations'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid ID', code: 'INVALID_ID' });
      }
      if (!reason) {
        return res.status(400).json({ success: false, error: 'Rejection reason is required', code: 'MISSING_REJECTION_REASON' });
      }

      const existing = await prisma.destination.findUnique({ where: { id } });
      if (!existing || existing.status !== 'pending') {
        return res.status(404).json({
          success: false,
          error: 'Destination not found or not pending approval',
          code: 'REJECTION_FAILED'
        });
      }

      const destination = await prisma.destination.update({
        where: { id },
        data: { status: 'rejected', rejection_reason: reason }
      });

      await prisma.moderationLog.create({
        data: {
          content_type: 'destination',
          content_id: id,
          action: 'rejected',
          moderator_id: req.user.id,
          notes: `Rejected: ${reason}`
        }
      });

      // Notify creator
      try {
        await prisma.notification.create({
          data: {
            user_id: destination.created_by,
            type: 'destination',
            title: 'Destination Rejected',
            message: `Your destination "${destination.name}" was rejected. Reason: ${reason}`,
            data: JSON.stringify({ destination_id: id, destination_name: destination.name })
          }
        });
      } catch (notifyErr) {
        console.log('Notification failed:', notifyErr.message);
      }

      res.json({ success: true, message: 'Destination rejected successfully', destination });
    } catch (error) {
      console.error('Reject destination error:', error);
      res.status(500).json({ success: false, error: 'Failed to reject destination', code: 'REJECT_DESTINATION_ERROR' });
    }
  }
);

/* =========================================================
   🌟 FEATURE / UNFEATURE ROUTES
========================================================= */

// Feature destination
router.post('/:id/feature',
  authenticateToken,
  requirePermission('feature_destinations'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid ID', code: 'INVALID_ID' });
      }

      const existing = await prisma.destination.findUnique({ where: { id } });
      if (!existing || existing.status !== 'approved') {
        return res.status(404).json({ success: false, error: 'Destination not found or not approved', code: 'FEATURE_FAILED' });
      }

      const destination = await prisma.destination.update({
        where: { id },
        data: { featured: true }
      });

      await prisma.moderationLog.create({
        data: {
          content_type: 'destination',
          content_id: id,
          action: 'featured',
          moderator_id: req.user.id,
          notes: 'Destination featured on platform'
        }
      });

      res.json({ success: true, message: 'Destination featured successfully', destination });
    } catch (error) {
      console.error('Feature destination error:', error);
      res.status(500).json({ success: false, error: 'Failed to feature destination', code: 'FEATURE_DESTINATION_ERROR' });
    }
  }
);

// Unfeature destination
router.post('/:id/unfeature',
  authenticateToken,
  requirePermission('feature_destinations'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid ID', code: 'INVALID_ID' });
      }

      const existing = await prisma.destination.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Destination not found', code: 'UNFEATURE_FAILED' });
      }

      const destination = await prisma.destination.update({
        where: { id },
        data: { featured: false }
      });

      await prisma.moderationLog.create({
        data: {
          content_type: 'destination',
          content_id: id,
          action: 'unfeatured',
          moderator_id: req.user.id,
          notes: 'Destination removed from featured'
        }
      });

      res.json({ success: true, message: 'Destination unfeatured successfully', destination });
    } catch (error) {
      console.error('Unfeature destination error:', error);
      res.status(500).json({ success: false, error: 'Failed to unfeature destination', code: 'UNFEATURE_DESTINATION_ERROR' });
    }
  }
);

/* =========================================================
   🗑️ DELETE DESTINATION (Soft Delete)
========================================================= */

router.delete('/:id',
  authenticateToken,
  requireResourceAccess('destination', 'delete_own_destinations', 'edit_destinations'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid ID', code: 'INVALID_ID' });
      }

      const existing = await prisma.destination.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Destination not found', code: 'DESTINATION_NOT_FOUND' });
      }

      const deletedDestination = await prisma.destination.update({
        where: { id },
        data: { status: 'deleted' }
      });

      await logAuditEvent(req.user.id, 'DELETE_DESTINATION', 'destination', id, {
        oldValues: existing,
        notes: `Destination "${existing.name}" deleted by ${req.user.name}`
      });

      res.json({ success: true, message: 'Destination deleted successfully', destination: deletedDestination });
    } catch (error) {
      console.error('Delete destination error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete destination', code: 'DELETE_DESTINATION_ERROR' });
    }
  }
);

/* =========================================================
   📊 ADMIN STATISTICS
========================================================= */

router.get('/admin/stats',
  authenticateToken,
  requirePermission('view_analytics'),
  async (req, res) => {
    try {
      const statusStats = await prisma.destination.groupBy({
        by: ['status'],
        _count: { id: true }
      });

      const regionStats = await prisma.destination.groupBy({
        by: ['region'],
        where: { status: 'approved' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      });

      const creationTrends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as created,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
        FROM destinations 
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month;
      `;

      const topCreators = await prisma.user.findMany({
        where: { role: 'guide' },
        include: { destinations: { select: { id: true, status: true } } },
        orderBy: { destinations: { _count: 'desc' } },
        take: 10
      });

      const topCreatorsWithStats = topCreators.map(u => ({
        name: u.name,
        email: u.email,
        destination_count: u.destinations.length,
        approved_count: u.destinations.filter(d => d.status === 'approved').length
      }));

      res.json({
        success: true,
        statistics: {
          by_status: statusStats,
          by_region: regionStats,
          creation_trends: creationTrends,
          top_creators: topCreatorsWithStats,
          total_destinations: statusStats.reduce((sum, row) => sum + row._count.id, 0),
          approved_destinations: statusStats.find(r => r.status === 'approved')?._count.id || 0
        }
      });
    } catch (error) {
      console.error('Get destination stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch destination statistics',
        code: 'FETCH_DESTINATION_STATS_ERROR'
      });
    }
  }
);

// Helper: Access check
async function checkDestinationAccess(user, destination) {
  // ✅ Public can view only approved
  if (!user) return destination.status === 'approved';

  // ✅ Admins and auditors can access everything
  if (['admin', 'auditor'].includes(user.role)) return true;

  // ✅ Verified guides can access:
  // - Destinations they created
  // - Approved public destinations
  // - Pending/draft ones they own
  if (user.role === 'guide') {
    return (
      destination.created_by === user.id ||
      destination.status === 'approved' ||
      destination.status === 'draft' ||
      destination.status === 'pending'
    );
  }

  // ✅ Regular users can only see approved
  return destination.status === 'approved';
}


export default router;
