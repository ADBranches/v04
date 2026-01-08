// backend/models/Destination.js
import { query } from '../config/database.js';

/**
 * Destination Model
 * Data access layer for destination operations
 */
export const DestinationModel = {
  
  /**
   * Find destination by ID
   */
  async findById(id, options = {}) {
    const { includeCreator = true, includeStats = false } = options;
    
    let queryText = `
      SELECT d.*
      ${includeCreator ? ', u.name as creator_name, u.email as creator_email' : ''}
      ${includeStats ? `
        , COUNT(DISTINCT b.id) as booking_count
        , AVG(r.rating) as average_rating
        , COUNT(r.id) as review_count
      ` : ''}
      FROM destinations d
      ${includeCreator ? 'LEFT JOIN users u ON d.created_by = u.id' : ''}
      ${includeStats ? `
        LEFT JOIN bookings b ON d.id = b.destination_id AND b.status = 'completed'
        LEFT JOIN reviews r ON d.id = r.destination_id AND r.status = 'active'
      ` : ''}
      WHERE d.id = $1
      ${includeStats ? 'GROUP BY d.id' + (includeCreator ? ', u.name, u.email' : '') : ''}
    `;

    const result = await query(queryText, [id]);
    return result.rows[0];
  },

  /**
   * Find destinations with filtering and pagination
   */
  async find(filter = {}) {
    const {
      page = 1,
      limit = 12,
      where = {},
      orderBy = 'created_at',
      order = 'DESC',
      includeCreator = true,
      includeStats = false
    } = filter;

    const offset = (page - 1) * limit;

    let queryText = `
      SELECT d.*
      ${includeCreator ? ', u.name as creator_name, u.email as creator_email' : ''}
      ${includeStats ? `
        , COUNT(DISTINCT b.id) as booking_count
        , AVG(r.rating) as average_rating
        , COUNT(r.id) as review_count
      ` : ''}
      FROM destinations d
      ${includeCreator ? 'LEFT JOIN users u ON d.created_by = u.id' : ''}
      ${includeStats ? `
        LEFT JOIN bookings b ON d.id = b.destination_id AND b.status = 'completed'
        LEFT JOIN reviews r ON d.id = r.destination_id AND r.status = 'active'
      ` : ''}
    `;

    const whereConditions = [];
    const queryParams = [];
    let paramCount = 0;

    // Build WHERE conditions
    for (const [key, value] of Object.entries(where)) {
      if (value !== undefined && value !== null) {
        paramCount++;
        if (Array.isArray(value)) {
          whereConditions.push(`d.${key} = ANY($${paramCount})`);
          queryParams.push(value);
        } else {
          whereConditions.push(`d.${key} = $${paramCount}`);
          queryParams.push(value);
        }
      }
    }

    if (whereConditions.length > 0) {
      queryText += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add grouping if stats are included
    if (includeStats) {
      queryText += ` GROUP BY d.id${includeCreator ? ', u.name, u.email' : ''}`;
    }

    // Add ordering and pagination
    queryText += ` ORDER BY d.${orderBy} ${order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);
    return result.rows;
  },

  /**
   * Count destinations with optional filtering
   */
  async count(where = {}) {
    let queryText = 'SELECT COUNT(*) FROM destinations d';
    const whereConditions = [];
    const queryParams = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(where)) {
      if (value !== undefined && value !== null) {
        paramCount++;
        if (Array.isArray(value)) {
          whereConditions.push(`d.${key} = ANY($${paramCount})`);
          queryParams.push(value);
        } else {
          whereConditions.push(`d.${key} = $${paramCount}`);
          queryParams.push(value);
        }
      }
    }

    if (whereConditions.length > 0) {
      queryText += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    const result = await query(queryText, queryParams);
    return parseInt(result.rows[0].count);
  },

  /**
   * Create new destination
   */
  async create(destinationData) {
    const {
      name,
      description,
      short_description,
      location,
      region,
      coordinates,
      price_range,
      duration,
      difficulty_level,
      best_season,
      images,
      highlights,
      included,
      not_included,
      requirements,
      created_by,
      status = 'draft'
    } = destinationData;

    const result = await query(
      `INSERT INTO destinations 
       (name, description, short_description, location, region, coordinates,
        price_range, duration, difficulty_level, best_season, images, 
        highlights, included, not_included, requirements, created_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
       RETURNING *`,
      [
        name,
        description,
        short_description,
        location,
        region,
        coordinates,
        price_range,
        duration,
        difficulty_level,
        best_season,
        JSON.stringify(images || []),
        JSON.stringify(highlights || []),
        JSON.stringify(included || []),
        JSON.stringify(not_included || []),
        requirements,
        created_by,
        status
      ]
    );

    return result.rows[0];
  },

  /**
   * Update destination
   */
  async update(id, updates) {
    const updateFields = [];
    const updateParams = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        
        // Handle JSON fields
        if (['images', 'highlights', 'included', 'not_included'].includes(key)) {
          updateParams.push(JSON.stringify(value));
        } else {
          updateParams.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    paramCount++;
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const updateQuery = `
      UPDATE destinations 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    updateParams.push(id);

    const result = await query(updateQuery, updateParams);
    return result.rows[0];
  },

  /**
   * Delete destination
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM destinations WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Update destination status
   */
  async updateStatus(id, status, moderatorId = null, rejectionReason = null) {
    const updates = {
      status,
      updated_at: new Date()
    };

    if (status === 'approved' && moderatorId) {
      updates.approved_by = moderatorId;
      updates.approved_at = new Date();
      updates.rejection_reason = null;
    } else if (status === 'rejected' && rejectionReason) {
      updates.rejection_reason = rejectionReason;
      updates.approved_by = null;
      updates.approved_at = null;
    } else if (status === 'draft') {
      updates.submitted_at = null;
      updates.approved_by = null;
      updates.approved_at = null;
      updates.rejection_reason = null;
    }

    return this.update(id, updates);
  },

  /**
   * Get destinations by creator
   */
  async findByCreator(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
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

    const queryParams = [userId];
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
    return result.rows;
  },

  /**
   * Get popular destinations
   */
  async findPopular(limit = 6) {
    const result = await query(
      `SELECT d.*, u.name as creator_name,
              COUNT(DISTINCT b.id) as booking_count,
              AVG(r.rating) as average_rating
       FROM destinations d
       LEFT JOIN users u ON d.created_by = u.id
       LEFT JOIN bookings b ON d.id = b.destination_id AND b.status = 'completed'
       LEFT JOIN reviews r ON d.id = r.destination_id AND r.status = 'active'
       WHERE d.status = 'approved' AND d.featured = true
       GROUP BY d.id, u.name
       ORDER BY d.view_count DESC, average_rating DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  /**
   * Search destinations
   */
  async search(searchTerm, options = {}) {
    const { page = 1, limit = 12, region, difficulty } = options;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT d.*, u.name as creator_name,
             COUNT(DISTINCT b.id) as booking_count,
             AVG(r.rating) as average_rating,
             TS_RANK_CD(TO_TSVECTOR('english', 
               COALESCE(d.name, '') || ' ' || 
               COALESCE(d.description, '') || ' ' ||
               COALESCE(d.location, '') || ' ' ||
               COALESCE(d.region, '')
             ), PLAINTO_TSQUERY('english', $1)) as rank
      FROM destinations d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN bookings b ON d.id = b.destination_id AND b.status = 'completed'
      LEFT JOIN reviews r ON d.id = r.destination_id AND r.status = 'active'
      WHERE d.status = 'approved' AND (
        TO_TSVECTOR('english', 
          COALESCE(d.name, '') || ' ' || 
          COALESCE(d.description, '') || ' ' ||
          COALESCE(d.location, '') || ' ' ||
          COALESCE(d.region, '')
        ) @@ PLAINTO_TSQUERY('english', $1)
        OR d.name ILIKE $2 OR d.location ILIKE $2 OR d.region ILIKE $2
      )
    `;

    const queryParams = [searchTerm, `%${searchTerm}%`];
    let paramCount = 2;

    if (region) {
      paramCount++;
      queryText += ` AND d.region = $${paramCount}`;
      queryParams.push(region);
    }

    if (difficulty) {
      paramCount++;
      queryText += ` AND d.difficulty_level = $${paramCount}`;
      queryParams.push(difficulty);
    }

    queryText += `
      GROUP BY d.id, u.name
      ORDER BY rank DESC, d.view_count DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);
    return result.rows;
  },

  /**
   * Get destination statistics
   */
  async getStatistics() {
    const stats = {};

    // Basic counts
    const basicStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN featured = true THEN 1 END) as featured
      FROM destinations
    `);
    stats.basic = basicStats.rows[0];

    // Regional distribution
    const regionalStats = await query(`
      SELECT 
        region,
        COUNT(*) as count
      FROM destinations 
      WHERE status = 'approved'
      GROUP BY region
      ORDER BY count DESC
    `);
    stats.regional = regionalStats.rows;

    // Monthly growth
    const monthlyGrowth = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_destinations
      FROM destinations 
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    stats.monthly_growth = monthlyGrowth.rows;

    return stats;
  },

  /**
   * Increment view count
   */
  async incrementViewCount(id) {
    await query(
      'UPDATE destinations SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
  }
};

export default DestinationModel;
