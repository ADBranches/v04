// models/User.js
import { query } from '../config/database.js';

export const UserModel = {
  async findById(id) {
    const result = await query(
      'SELECT id, email, name, role, guide_status, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async create(userData) {
    const { email, password_hash, name, role = 'user' } = userData;
    
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role, created_at`,
      [email, password_hash, name, role]
    );
    
    return result.rows[0];
  },

  async updateGuideStatus(userId, status, moderatorId = null) {
    let queryText = 'UPDATE users SET guide_status = $1';
    let queryParams = [status, userId];

    if (moderatorId) {
      queryText += ', verified_by = $3, verified_at = CURRENT_TIMESTAMP';
      queryParams.push(moderatorId);
    }

    queryText += ' WHERE id = $2 RETURNING id, email, name, role, guide_status';

    const result = await query(queryText, queryParams);
    return result.rows[0];
  },

  async getUsersByRole(role) {
    const result = await query(
      'SELECT id, email, name, role, guide_status, is_active, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      [role]
    );
    return result.rows;
  },

  async getPendingGuides() {
    const result = await query(
      `SELECT id, email, name, guide_status, verification_submitted_at, created_at
       FROM users 
       WHERE guide_status = 'pending'
       ORDER BY verification_submitted_at ASC`
    );
    return result.rows;
  }
};

export default UserModel;
