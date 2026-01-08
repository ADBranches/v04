// backend/controllers/destination-controller.js
import { query } from '../config/database.js';
import { hasPermission, canManageResource } from '../config/permissions-config.js';

/**
 * Destination Controller
 * Handles all business logic for destination operations
 */
export const DestinationController = {
  
  /**
   * Get all destinations with advanced filtering and pagination
   */
  async getAllDestinations(req, res) {
    try {
      const { 
        page = 1, 
        limit = 12, 
        region, 
        district,
        difficulty, 
        featured,
        search,
        status,
        sort = 'created_at',
        order = 'desc',
        min_price,
        max_price
      } = req.query;

      const offset = (page - 1) * limit;
      const validSortFields = ['name', 'created_at', 'updated_at', 'view_count', 'price_range', 'average_rating'];
      const validOrders = ['asc', 'desc'];

      const sortField = validSortFields.includes(sort) ? sort : 'created_at';
      const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

      let queryText = `
        SELECT 
          d.*,
          u.name as creator_name,
          u.email as creator_email,
          COUNT(DISTINCT b.id) as booking_count,
          AVG(r.rating) as average_rating,
          COUNT(r.id) as review_count
        FROM destinations d
        LEFT JOIN users u ON d.created_by = u.id
        LEFT JOIN bookings b ON d.id = b.destination_id AND b.status = 'completed'
        LEFT JOIN reviews r ON d.id = r.destination_id AND r.status = 'active'
        WHERE 1=1
      `;

      let queryParams = [];
      let paramCount = 0;

      // Apply access control based on user role
      if (!req.user || !['admin', 'auditor'].includes(req.user?.role)) {
        if (req.user?.role === 'guide') {
          queryText += ` AND (d.created_by = $${paramCount + 1} OR d.status = 'approved')`;
          queryParams.push(req.user.id);
          paramCount++;
        } else {
          queryText += ` AND d.status = 'approved'`;
        }
      } else if (status) {
        // Admin/auditor can filter by status
        queryText += ` AND d.status = $${paramCount + 1}`;
        queryParams.push(status);
        paramCount++;
      }

      // Apply filters
      if (region) {
        paramCount++;
        queryText += ` AND d.region = $${paramCount}`;
        queryParams.push(region);
      }

      if (district) {
        paramCount++;
        queryText += ` AND d.district = $${paramCount}`;
        queryParams.push(district);
      }

      if (difficulty) {
        paramCount++;
        queryText += ` AND d.difficulty_level = $${paramCount}`;
        queryParams.push(difficulty);
      }

      if (featured === 'true') {
        queryText += ` AND d.featured = true`;
      }

      if (search) {
        paramCount++;
        queryText += ` AND (
          d.name ILIKE $${paramCount} OR 
          d.description ILIKE $${paramCount} OR 
          d.location ILIKE $${paramCount} OR
          d.short_description ILIKE $${paramCount} OR
          d.region ILIKE $${paramCount}
        )`;
        queryParams.push(`%${search}%`);
      }

      // Price range filtering (basic implementation)
      if (min_price) {
        // This would need more sophisticated price parsing in a real app
        queryText += ` AND d.price_range IS NOT NULL`;
      }

      if (max_price) {
        queryText += ` AND d.price_range IS NOT NULL`;
      }

      // Add grouping and ordering
      queryText += `
        GROUP BY d.id, u.name, u.email
        ORDER BY ${sortField === 'average_rating' ? 'AVG(r.rating)' : `d.${sortField}`} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      queryParams.push(limit, offset);

      const result = await query(queryText, queryParams);

      // Get total count
      let countQuery = `
        SELECT COUNT(DISTINCT d.id)
        FROM destinations d
        WHERE 1=1
      `;
      let countParams = [];

      // Apply same access control and filters
      if (!req.user || !['admin', 'auditor'].includes(req.user?.role)) {
        if (req.user?.role === 'guide') {
          countQuery += ` AND (d.created_by = $${countParams.length + 1} OR d.status = 'approved')`;
          countParams.push(req.user.id);
        } else {
          countQuery += ` AND d.status = 'approved'`;
        }
      } else if (status) {
        countQuery += ` AND d.status = $${countParams.length + 1}`;
        countParams.push(status);
      }

      if (region) {
        countParams.push(region);
        countQuery += ` AND d.region = $${countParams.length}`;
      }

      if (district) {
        countQuery += ` AND d.district = $${countParams.length}`;
        countParams.push(district);
      }

      if (difficulty) {
        countParams.push(difficulty);
        countQuery += ` AND d.difficulty_level = $${countParams.length}`;
      }

      if (featured === 'true') {
        countQuery += ` AND d.featured = true`;
      }

      if (search) {
        countParams.push(`%${search}%`);
        countQuery += ` AND (
          d.name ILIKE $${countParams.length} OR 
          d.description ILIKE $${countParams.length} OR 
          d.location ILIKE $${countParams.length}
        )`;
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      // Get available filters for UI
      const filtersResult = await query(`
        SELECT 
          ARRAY_AGG(DISTINCT region) as regions,
          ARRAY_AGG(DISTINCT difficulty_level) as difficulties,
          ARRAY_AGG(DISTINCT price_range) as price_ranges
        FROM destinations 
        WHERE status = 'approved'
      `);

      res.json({
        success: true,
        destinations: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          available: filtersResult.rows[0],
          applied: {
            region,
            difficulty,
            featured: featured === 'true',
            search,
            status,
            sort: sortField,
            order: sortOrder.toLowerCase()
          }
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
  },

  /**
   * Get destination by ID with full details
   */
  async getDestinationById(req, res) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT 
          d.*,
          u.name as creator_name,
          u.email as creator_email,
          uv.name as verified_by_name,
          COUNT(DISTINCT b.id) as booking_count,
          AVG(r.rating) as average_rating,
          COUNT(r.id) as review_count,
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', r.id,
              'rating', r.rating,
              'title', r.title,
              'comment', r.comment,
              'user_name', ru.name,
              'created_at', r.created_at
            )
          ) FILTER (WHERE r.id IS NOT NULL) as recent_reviews
         FROM destinations d
         LEFT JOIN users u ON d.created_by = u.id
         LEFT JOIN users uv ON d.approved_by = uv.id
         LEFT JOIN bookings b ON d.id = b.destination_id AND b.status = 'completed'
         LEFT JOIN reviews r ON d.id = r.destination_id AND r.status = 'active'
         LEFT JOIN users ru ON r.user_id = ru.id
         WHERE d.id = $1
         GROUP BY d.id, u.name, u.email, uv.name`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Destination not found',
          code: 'DESTINATION_NOT_FOUND'
        });
      }

      const destination = result.rows[0];

      // Check access permissions
      const canView = await this.checkDestinationAccess(req.user, destination);
      
      if (!canView) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'DESTINATION_ACCESS_DENIED',
          message: 'You do not have permission to view this destination'
        });
      }

      // Increment view count for approved destinations
      if (destination.status === 'approved') {
        await query(
          'UPDATE destinations SET view_count = view_count + 1 WHERE id = $1',
          [id]
        );
        destination.view_count += 1;
      }

      // Get related destinations
      const relatedDestinations = await query(
        `SELECT id, name, location, price_range, images, difficulty_level, district
         FROM destinations 
         WHERE (region = $1 OR district = $3) AND status = 'approved' AND id != $2
         ORDER BY featured DESC, view_count DESC
         LIMIT 6`,
        [destination.region, id, destination.district]
      );

      res.json({
        success: true,
        destination: {
          ...destination,
          recent_reviews: destination.recent_reviews ? destination.recent_reviews.slice(0, 5) : [],
          related_destinations: relatedDestinations.rows
        }
      });

    } catch (error) {
      console.error('Get destination error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch destination',
        code: 'FETCH_DESTINATION_ERROR'
      });
    }
  },

  /**
   * Create new destination
   */
  async createDestination(req, res) {
    try {
      const { 
        name, 
        description, 
        short_description,
        location, 
        region,
        district,
        coordinates,
        price_range, 
        duration,
        difficulty_level,
        best_season,
        images,
        highlights,
        included,
        not_included,
        requirements
      } = req.body;

      // Validation
      if (!name || !description || !location) {
        return res.status(400).json({
          success: false,
          error: 'Name, description, and location are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      if (name.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Name must be at least 3 characters',
          code: 'INVALID_NAME_LENGTH'
        });
      }

      if (description.length < 50) {
        return res.status(400).json({
          success: false,
          error: 'Description must be at least 50 characters',
          code: 'INVALID_DESCRIPTION_LENGTH'
        });
      }

      // Validate images array
      if (images && !Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          error: 'Images must be an array',
          code: 'INVALID_IMAGES_FORMAT'
        });
      }

      // Default status based on user role
      let status = 'draft';
      let approved_by = null;
      let approved_at = null;

      if (req.user.role === 'admin') {
        status = 'approved';
        approved_by = req.user.id;
        approved_at = new Date();
      }

      const result = await query(
        `INSERT INTO destinations 
         (name, description, short_description, location, region, district, coordinates,
          price_range, duration, difficulty_level, best_season, images, 
          highlights, included, not_included, requirements, 
          created_by, status, approved_by, approved_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
         RETURNING *`,
        [
          name.trim(),
          description.trim(),
          short_description?.trim() || description.substring(0, 200).trim() + '...',
          location.trim(),
          region,
          district || null,
          coordinates ? `(${coordinates.lng},${coordinates.lat})` : null,
          price_range,
          duration,
          difficulty_level,
          best_season,
          JSON.stringify(images || []),
          JSON.stringify(highlights || []),
          JSON.stringify(included || []),
          JSON.stringify(not_included || []),
          requirements,
          req.user.id,
          status,
          approved_by,
          approved_at
        ]
      );

      const destination = result.rows[0];

      // Log creation
      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'CREATE_DESTINATION', 'destination', destination.id, {
          name: destination.name,
          location: destination.location,
          status: destination.status
        }]
      );

      // Auto-approve for admin, otherwise log submission
      if (req.user.role === 'admin') {
        await query(
          `INSERT INTO moderation_logs (content_type, content_id, action, moderator_id, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          ['destination', destination.id, 'approved', req.user.id, 'Auto-approved by admin']
        );
      }

      res.status(201).json({
        success: true,
        message: 'Destination created successfully',
        destination
      });

    } catch (error) {
      console.error('Create destination error:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'Destination with this name already exists',
          code: 'DESTINATION_EXISTS'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create destination',
        code: 'CREATE_DESTINATION_ERROR'
      });
    }
  },

  /**
   * Update destination
   */
  async updateDestination(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Get current destination
      const currentResult = await query(
        'SELECT * FROM destinations WHERE id = $1',
        [id]
      );

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Destination not found',
          code: 'DESTINATION_NOT_FOUND'
        });
      }

      const current = currentResult.rows[0];

      // Check permissions
      const canEdit = await this.checkEditPermissions(req.user, current);
      if (!canEdit) {
        return res.status(403).json({
          success: false,
          error: 'Edit permission denied',
          code: 'EDIT_PERMISSION_DENIED'
        });
      }

      // Build update query dynamically
      const allowedFields = [
        'name', 'description', 'short_description', 'location', 'region','district', 'coordinates',
        'price_range', 'duration', 'difficulty_level', 'best_season',
        'highlights', 'included', 'not_included', 'requirements', 'images'
      ];

      const updateFields = [];
      const updateParams = [];
      let paramCount = 0;

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          
          // Handle JSON fields and special formats
          if (['highlights', 'included', 'not_included', 'images'].includes(field)) {
            updateParams.push(JSON.stringify(updates[field]));
          } else if (field === 'coordinates' && updates[field]) {
            updateParams.push(`(${updates[field].lng},${updates[field].lat})`);
          } else {
            updateParams.push(updates[field]);
          }
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update',
          code: 'NO_VALID_UPDATES'
        });
      }

      // Reset status to draft if content changed significantly (for non-admins)
      if (req.user.role !== 'admin' && current.status === 'approved') {
        paramCount++;
        updateFields.push('status = $' + paramCount);
        updateParams.push('draft');
        
        // Clear approval information
        updateFields.push('approved_by = NULL', 'approved_at = NULL', 'rejection_reason = NULL');
      }

      paramCount++;
      updateFields.push('updated_at = CURRENT_TIMESTAMP');

      const updateQuery = `
        UPDATE destinations 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount + 1} 
        RETURNING *
      `;
      updateParams.push(id);

      const result = await query(updateQuery, updateParams);

      // Log update
      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, 'UPDATE_DESTINATION', 'destination', id, 
         this.sanitizeForLogging(current), 
         this.sanitizeForLogging(result.rows[0])]
      );

      res.json({
        success: true,
        message: 'Destination updated successfully',
        destination: result.rows[0]
      });

    } catch (error) {
      console.error('Update destination error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update destination',
        code: 'UPDATE_DESTINATION_ERROR'
      });
    }
  },

  /**
   * Delete destination
   */
  async deleteDestination(req, res) {
    try {
      const { id } = req.params;

      // Get current destination
      const currentResult = await query(
        'SELECT * FROM destinations WHERE id = $1',
        [id]
      );

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Destination not found',
          code: 'DESTINATION_NOT_FOUND'
        });
      }

      const current = currentResult.rows[0];

      // Check permissions
      const canDelete = await this.checkDeletePermissions(req.user, current);
      if (!canDelete) {
        return res.status(403).json({
          success: false,
          error: 'Delete permission denied',
          code: 'DELETE_PERMISSION_DENIED'
        });
      }

      // Check if there are active bookings
      const activeBookings = await query(
        'SELECT COUNT(*) FROM bookings WHERE destination_id = $1 AND status IN ($2, $3)',
        [id, 'pending', 'confirmed']
      );

      if (parseInt(activeBookings.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete destination with active bookings',
          code: 'ACTIVE_BOOKINGS_EXIST'
        });
      }

      // Soft delete (update status to deleted) or hard delete based on preference
      const result = await query(
        'DELETE FROM destinations WHERE id = $1 RETURNING *',
        [id]
      );

      // Log deletion
      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'DELETE_DESTINATION', 'destination', id, 
         this.sanitizeForLogging(current)]
      );

      res.json({
        success: true,
        message: 'Destination deleted successfully',
        destination: result.rows[0]
      });

    } catch (error) {
      console.error('Delete destination error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete destination',
        code: 'DELETE_DESTINATION_ERROR'
      });
    }
  },

  /**
   * Submit destination for approval
   */
  async submitForApproval(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const result = await query(
        `UPDATE destinations 
         SET status = 'pending', submitted_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND status = 'draft'
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Destination not found or cannot be submitted',
          code: 'SUBMISSION_FAILED'
        });
      }

      const destination = result.rows[0];

      // Log submission
      await query(
        `INSERT INTO moderation_logs (content_type, content_id, action, moderator_id, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        ['destination', id, 'submitted', req.user.id, notes || 'User submitted for approval']
      );

      // Create notification for auditors
      await this.createModerationNotification(
        'destination_submission',
        `New destination "${destination.name}" submitted for approval by ${req.user.name}.`,
        {
          destination_id: id,
          destination_name: destination.name,
          submitter_id: req.user.id,
          submitter_name: req.user.name,
          notes: notes
        }
      );

      res.json({
        success: true,
        message: 'Destination submitted for approval',
        destination
      });

    } catch (error) {
      console.error('Submit destination error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit destination',
        code: 'SUBMIT_DESTINATION_ERROR'
      });
    }
  },

  /**
   * Get user's destinations (for guides)
   */
  async getUserDestinations(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let queryText = `
        SELECT d.*, 
               COUNT(DISTINCT b.id) as booking_count,
               AVG(r.rating) as average_rating
        FROM destinations d
        LEFT JOIN bookings b ON d.id = b.destination_id
        LEFT JOIN reviews r ON d.id = r.destination_id
        WHERE d.created_by = $1
      `;
      let queryParams = [id];
      let paramCount = 1;

      if (status) {
        paramCount++;
        queryText += ` AND d.status = $${paramCount}`;
        queryParams.push(status);
      }

      queryText += `
        GROUP BY d.id
        ORDER BY d.updated_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      queryParams.push(limit, offset);

      const result = await query(queryText, queryParams);

      // Get counts by status
      const countsResult = await query(
        `SELECT status, COUNT(*) 
         FROM destinations 
         WHERE created_by = $1 
         GROUP BY status`,
        [id]
      );

      const statusCounts = countsResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});

      res.json({
        success: true,
        destinations: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
        },
        status_counts: statusCounts
      });

    } catch (error) {
      console.error('Get user destinations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user destinations',
        code: 'FETCH_USER_DESTINATIONS_ERROR'
      });
    }
  },

  /**
   * Get destination statistics
   */
  async getDestinationStats(req, res) {
    try {
      const stats = {};

      // Overall statistics
      const overallStats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN featured = true THEN 1 END) as featured,
          AVG(view_count) as avg_views,
          SUM(view_count) as total_views
        FROM destinations
      `);
      stats.overall = overallStats.rows[0];
      
      // Statistics by region
      const regionStats = await query(`
        SELECT 
          region,
          COUNT(*) as count,
          AVG(view_count) as avg_views
        FROM destinations 
        WHERE status = 'approved'
        GROUP BY region
        ORDER BY count DESC
      `);
      stats.by_region = regionStats.rows;

      // stats by district
      const districtStats = await query(`
        SELECT 
          district,
          COUNT(*) as count
        FROM destinations 
        WHERE status = 'approved'
        GROUP BY district
        ORDER BY count DESC
        LIMIT 10
      `);
      stats.by_district = districtStats.rows;

      // Statistics by difficulty
      const difficultyStats = await query(`
        SELECT 
          difficulty_level,
          COUNT(*) as count
        FROM destinations 
        WHERE status = 'approved'
        GROUP BY difficulty_level
        ORDER BY count DESC
      `);
      stats.by_difficulty = difficultyStats.rows;

      // Recent activity
      const recentActivity = await query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as created,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
        FROM destinations 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `);
      stats.recent_activity = recentActivity.rows;

      res.json({
        success: true,
        statistics: stats
      });

    } catch (error) {
      console.error('Get destination stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch destination statistics',
        code: 'FETCH_DESTINATION_STATS_ERROR'
      });
    }
  },

  // Helper methods

  /**
   * Check if user can access destination
   */
  async checkDestinationAccess(user, destination) {
    // Public access to approved destinations
    if (destination.status === 'approved') {
      return true;
    }

    // No access for unauthenticated users to non-approved destinations
    if (!user) {
      return false;
    }

    // Admin and auditor can access all destinations
    if (['admin', 'auditor'].includes(user.role)) {
      return true;
    }

    // Creator can access their own destinations
    if (destination.created_by === user.id) {
      return true;
    }

    return false;
  },

  /**
   * Check if user can edit destination
   */
  async checkEditPermissions(user, destination) {
    // Admin and auditor can edit all destinations
    if (['admin', 'auditor'].includes(user.role)) {
      return true;
    }

    // Creator can edit their own destinations
    if (destination.created_by === user.id) {
      return hasPermission(user, 'edit_own_destinations');
    }

    return false;
  },

  /**
   * Check if user can delete destination
   */
  async checkDeletePermissions(user, destination) {
    // Admin can delete all destinations
    if (user.role === 'admin') {
      return true;
    }

    // Creator can delete their own draft destinations
    if (destination.created_by === user.id && destination.status === 'draft') {
      return hasPermission(user, 'delete_own_destinations');
    }

    return false;
  },

  /**
   * Create moderation notification
   */
  async createModerationNotification(type, message, data) {
    try {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, priority, data)
         SELECT 
           u.id, 
           $1, 
           $2, 
           $3, 
           'normal',
           $4
         FROM users u 
         WHERE u.role IN ('admin', 'auditor') AND u.is_active = true`,
        [type, 'Moderation Required', message, JSON.stringify(data)]
      );
    } catch (error) {
      console.log('Could not create notification:', error.message);
    }
  },

  /**
   * Sanitize data for audit logging
   */
  sanitizeForLogging(data) {
    const sanitized = { ...data };
    // Remove sensitive or large fields
    delete sanitized.images;
    delete sanitized.description;
    delete sanitized.highlights;
    delete sanitized.included;
    delete sanitized.not_included;
    return sanitized;
  }
};

export default DestinationController;