// routes/guides-enhanced.js
import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply as guide (User only)
router.post('/apply', authenticateToken, requireRole(['user']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, experience, specialties } = req.body;

    // Check if user exists and get current status
    const userCheck = await query(
      'SELECT guide_status FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentStatus = userCheck.rows[0].guide_status;

    if (currentStatus === 'verified') {
      return res.status(400).json({ error: 'User is already a verified guide' });
    }

    if (currentStatus === 'pending') {
      return res.status(400).json({ error: 'Guide application already pending review' });
    }

    // Update user guide status and additional info
    await query(
      `UPDATE users 
       SET guide_status = 'pending', 
           verification_submitted_at = CURRENT_TIMESTAMP,
           bio = COALESCE($1, bio)
       WHERE id = $2`,
      [bio, userId]
    );

    // Log application
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'GUIDE_APPLICATION_SUBMITTED', 'user', userId]
    );

    res.json({ 
      success: true,
      message: 'Guide application submitted successfully',
      status: 'pending',
      next_step: 'Your application will be reviewed by our team within 2-3 business days.'
    });

  } catch (error) {
    console.error('Guide application error:', error);
    res.status(500).json({ 
      error: 'Failed to submit guide application',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get pending guide applications (Auditor/Admin only)
router.get('/pending', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, email, name, guide_status, verification_submitted_at, 
              created_at, bio, profile_image
       FROM users 
       WHERE guide_status = 'pending'
       ORDER BY verification_submitted_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM users WHERE guide_status = $1',
      ['pending']
    );

    res.json({ 
      success: true,
      pending_applications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get pending guides error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pending applications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify guide (Auditor/Admin only)
router.post('/:id/verify', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const guideId = parseInt(req.params.id);
    const moderatorId = req.user.id;
    const { notes } = req.body;

    if (isNaN(guideId)) {
      return res.status(400).json({ error: 'Invalid guide ID' });
    }

    const result = await query(
      `UPDATE users 
       SET guide_status = 'verified', 
           verified_by = $1, 
           verified_at = CURRENT_TIMESTAMP,
           role = 'guide'
       WHERE id = $2 AND guide_status = 'pending'
       RETURNING id, email, name, role, guide_status, verified_at`,
      [moderatorId, guideId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending guide application not found' });
    }

    // Log verification
    await query(
      `INSERT INTO moderation_logs (content_type, content_id, action, moderator_id, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      ['guide_verification', guideId, 'verified', moderatorId, notes || 'Guide application approved']
    );

    res.json({
      success: true,
      message: 'Guide verified successfully',
      guide: result.rows[0]
    });
  } catch (error) {
    console.error('Verify guide error:', error);
    res.status(500).json({ 
      error: 'Failed to verify guide',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Suspend guide (Auditor/Admin only)
router.post('/:id/suspend', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const guideId = parseInt(req.params.id);
    const { reason } = req.body;
    const moderatorId = req.user.id;

    if (isNaN(guideId)) {
      return res.status(400).json({ error: 'Invalid guide ID' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Suspension reason is required' });
    }

    const result = await query(
      `UPDATE users 
       SET guide_status = 'suspended'
       WHERE id = $1 AND role = 'guide' AND guide_status = 'verified'
       RETURNING id, email, name, role, guide_status`,
      [guideId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Verified guide not found' });
    }

    // Log suspension
    await query(
      `INSERT INTO moderation_logs (content_type, content_id, action, moderator_id, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      ['guide_verification', guideId, 'suspended', moderatorId, reason.trim()]
    );

    res.json({
      success: true,
      message: 'Guide suspended successfully',
      guide: result.rows[0],
      reason: reason.trim()
    });
  } catch (error) {
    console.error('Suspend guide error:', error);
    res.status(500).json({ 
      error: 'Failed to suspend guide',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all guides (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, search } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT id, name, email, guide_status, verified_at, created_at, bio, profile_image
      FROM users 
      WHERE role = 'guide' AND guide_status = 'verified' AND is_active = true
    `;

    let countQuery = `
      SELECT COUNT(*) 
      FROM users 
      WHERE role = 'guide' AND guide_status = 'verified' AND is_active = true
    `;

    const queryParams = [];
    const countParams = [];

    if (search) {
      baseQuery += ` AND (name ILIKE $${queryParams.length + 1} OR bio ILIKE $${queryParams.length + 1})`;
      countQuery += ` AND (name ILIKE $${countParams.length + 1} OR bio ILIKE $${countParams.length + 1})`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm);
      countParams.push(searchTerm);
    }

    baseQuery += ` ORDER BY verified_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await query(baseQuery, queryParams);
    const countResult = await query(countQuery, countParams);

    res.json({ 
      success: true,
      guides: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch guides',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get guide by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const guideId = parseInt(req.params.id);

    const result = await query(
      `SELECT id, name, email, guide_status, verified_at, created_at, bio, profile_image
       FROM users 
       WHERE id = $1 AND role = 'guide' AND guide_status = 'verified' AND is_active = true`,
      [guideId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    res.json({
      success: true,
      guide: result.rows[0]
    });
  } catch (error) {
    console.error('Get guide error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch guide',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
