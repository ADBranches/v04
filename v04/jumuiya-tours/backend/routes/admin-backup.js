// routes/admin.js
import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
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
});

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
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const userStats = await query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
      FROM users 
      GROUP BY role
    `);

    const guideStats = await query(`
      SELECT 
        guide_status,
        COUNT(*) as count
      FROM users 
      WHERE role = 'guide'
      GROUP BY guide_status
    `);

    const destinationStats = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM destinations 
      GROUP BY status
    `);

    const bookingStats = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM bookings 
      GROUP BY status
    `);

    res.json({
      success: true,
      stats: {
        users: userStats.rows,
        guides: guideStats.rows,
        destinations: destinationStats.rows,
        bookings: bookingStats.rows,
        total_users: userStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
        total_destinations: destinationStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
        total_bookings: bookingStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
