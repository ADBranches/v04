// routes/admin.js
import express from 'express';
// import { PrismaClient } from '@prisma/client';
import { query } from '../config/database.js';
import { requireRole } from '../middleware/role-middleware.js'; 
import { authenticateToken } from '../middleware/auth.js'; 

const router = express.Router();

// ✅ Global protection for all /api/admin/* routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'auditor']));

// const prisma = new PrismaClient();
// Get all users (Admin only)
router.get(
  '/users',
  authenticateToken,          // ✅ ensure req.user is set (or 401)
  requireRole(['admin']),     // ✅ only admins allowed
  async (req, res) => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const offset = (page - 1) * limit;

      let baseQuery = `
        SELECT id, email, name, role, guide_status, is_active, created_at, verified_at
        FROM users 
        WHERE 1=1
      `;
      
      let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;
      const queryParams = [];
      const countParams = [];

      if (role) {
        baseQuery += ` AND role = $${queryParams.length + 1}`;
        countQuery += ` AND role = $${countParams.length + 1}`;
        queryParams.push(role);
        countParams.push(role);
      }

      if (search) {
        baseQuery += ` AND (name ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`;
        countQuery += ` AND (name ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 1})`;
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm);
        countParams.push(searchTerm);
      }

      baseQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      queryParams.push(limit, offset);

      const result = await query(baseQuery, queryParams);
      const countResult = await query(countQuery, countParams);

      res.json({
        success: true,
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Create new user (Admin only)
router.post('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'auditor', 'guide', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password, name, role, guide_status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, role, guide_status, created_at`,
      [email, hashedPassword, name, role, role === 'guide' ? 'verified' : 'unverified']
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user role/status (Admin only)
router.put('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role, is_active, guide_status } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await query(
      `UPDATE users 
       SET role = COALESCE($1, role),
           is_active = COALESCE($2, is_active),
           guide_status = COALESCE($3, guide_status)
       WHERE id = $4
       RETURNING id, email, name, role, guide_status, is_active, created_at`,
      [role, is_active, guide_status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get platform statistics (Admin only)
// Supports BOTH:
//   - /api/admin/stats
//   - /api/dashboard/admin/stats   (via extra mount in server.js)
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Legacy grouped stats (kept for compatibility with any older consumers)
    const [
      userStats,
      guideStats,
      destinationStats,
      bookingStats,
      totalUsersResult,
      totalDestinationsResult,
      totalBookingsResult,
      pendingDestinationsResult,
      pendingGuidesResult,
    ] = await Promise.all([
      query(`
        SELECT 
          role,
          COUNT(*)::int as count,
          COUNT(CASE WHEN is_active = true THEN 1 END)::int as active_count
        FROM users
        GROUP BY role
      `),

      query(`
        SELECT 
          guide_status,
          COUNT(*)::int as count
        FROM users
        WHERE role = 'guide'
        GROUP BY guide_status
      `),

      query(`
        SELECT 
          status,
          COUNT(*)::int as count
        FROM destinations
        GROUP BY status
      `),

      query(`
        SELECT 
          status,
          COUNT(*)::int as count
        FROM bookings
        GROUP BY status
      `),

      query(`SELECT COUNT(*)::int AS total FROM users`),
      query(`SELECT COUNT(*)::int AS total FROM destinations`),
      query(`SELECT COUNT(*)::int AS total FROM bookings`),
      query(`SELECT COUNT(*)::int AS total FROM destinations WHERE status = 'pending'`),
      query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'guide' AND guide_status = 'pending'`),
    ]);

    // Try to detect a revenue-like column safely from the bookings table
    const revenueColumnResult = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name IN ('total_amount', 'total_price', 'amount', 'price', 'subtotal')
      ORDER BY CASE column_name
        WHEN 'total_amount' THEN 1
        WHEN 'total_price' THEN 2
        WHEN 'amount' THEN 3
        WHEN 'price' THEN 4
        WHEN 'subtotal' THEN 5
        ELSE 99
      END
      LIMIT 1
    `);

    let revenue = 0;

    if (revenueColumnResult.rows.length > 0) {
      const revenueColumn = revenueColumnResult.rows[0].column_name;

      // Whitelist guard before interpolating the column name
      const allowedRevenueColumns = [
        'total_amount',
        'total_price',
        'amount',
        'price',
        'subtotal',
      ];

      if (allowedRevenueColumns.includes(revenueColumn)) {
        const revenueResult = await query(
          `SELECT COALESCE(SUM(${revenueColumn}), 0)::numeric AS revenue FROM bookings`
        );

        revenue = Number(revenueResult.rows[0]?.revenue || 0);
      }
    }

    const totalUsers = Number(totalUsersResult.rows[0]?.total || 0);
    const totalDestinations = Number(totalDestinationsResult.rows[0]?.total || 0);
    const totalBookings = Number(totalBookingsResult.rows[0]?.total || 0);
    const pendingDestinations = Number(pendingDestinationsResult.rows[0]?.total || 0);
    const pendingGuideApprovals = Number(pendingGuidesResult.rows[0]?.total || 0);
    const pendingApprovals = pendingDestinations + pendingGuideApprovals;

    res.json({
      success: true,

      // ✅ New flat shape expected by dashboard.admin.tsx
      totalUsers,
      totalDestinations,
      pendingApprovals,
      totalBookings,
      revenue,

      // ✅ Old nested shape kept for backward compatibility
      stats: {
        users: userStats.rows,
        guides: guideStats.rows,
        destinations: destinationStats.rows,
        bookings: bookingStats.rows,
        total_users: totalUsers,
        total_destinations: totalDestinations,
        total_bookings: totalBookings,
        pending_approvals: pendingApprovals,
        revenue,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/roles', authenticateToken, requireRole(['admin']), async (req, res) => {
  const roles = ['admin', 'auditor', 'guide', 'user'];
  res.json({ success: true, roles });
});

router.delete('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/roles', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json({
    success: true,
    roles: ['admin', 'auditor', 'guide', 'user']
  });
});

router.delete('/users/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const result = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

export default router;
