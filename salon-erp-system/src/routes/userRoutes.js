const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const pool = require('../../backend/db'); // Assuming you have this configured
const bcrypt = require('bcryptjs');


// Get all users with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { is_active, role_id, branch_id, search } = req.query;
    let query = `
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.last_login,
        u.created_at,
        r.role_id,
        r.role_name,
        b.branch_id,
        b.branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN branches b ON u.branch_id = b.branch_id
    `;
    
    const params = [];
    let paramCount = 1;
    const conditions = [];

    if (is_active === 'true' || is_active === 'false') {
      conditions.push(`u.is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    if (role_id) {
      conditions.push(`u.role_id = $${paramCount}`);
      params.push(role_id);
      paramCount++;
    }

    if (branch_id) {
      conditions.push(`u.branch_id = $${paramCount}`);
      params.push(branch_id);
      paramCount++;
    }

    if (search) {
      conditions.push(`
        (u.username ILIKE $${paramCount} OR 
         u.email ILIKE $${paramCount} OR 
         u.first_name ILIKE $${paramCount} OR 
         u.last_name ILIKE $${paramCount})
      `);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY u.last_name, u.first_name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.last_login,
        u.created_at,
        r.role_id,
        r.role_name,
        b.branch_id,
        b.branch_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       WHERE u.user_id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', authenticateToken, async (req, res) => {
  const { 
    username, 
    password, 
    email, 
    first_name, 
    last_name, 
    role_id, 
    branch_id 
  } = req.body;

  // Validate required fields
  if (!username?.trim() || !password || !email?.trim() || 
      !first_name?.trim() || !last_name?.trim() || !role_id) {
    return res.status(400).json({ error: 'All fields except branch_id are required' });
  }

  try {
    // Check for existing username or email
    const existsResult = await pool.query(
      `SELECT 1 FROM users 
       WHERE username = $1 OR email = $2 
       LIMIT 1`,
      [username.trim(), email.trim()]
    );

    if (existsResult.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (
        username, 
        password_hash, 
        email, 
        first_name, 
        last_name, 
        role_id, 
        branch_id,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        user_id, 
        username, 
        email, 
        first_name, 
        last_name, 
        is_active`,
      [
        username.trim(),
        password_hash,
        email.trim(),
        first_name.trim(),
        last_name.trim(),
        role_id,
        branch_id || null,
        true
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    });
    
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid role_id or branch_id' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { 
    username, 
    password, 
    email, 
    first_name, 
    last_name, 
    role_id, 
    branch_id, 
    is_active 
  } = req.body;

  try {
    // Get current user data
    const currentResult = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentResult.rows[0];

    // Check for username/email conflicts
    if (username || email) {
      const conflictResult = await pool.query(
        `SELECT 1 FROM users 
         WHERE user_id != $1 AND (username = $2 OR email = $3) 
         LIMIT 1`,
        [
          id,
          username || currentUser.username,
          email || currentUser.email
        ]
      );

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({ error: 'Username or email already in use' });
      }
    }

    // Update password if provided
    let password_hash = currentUser.password_hash;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      password_hash = await bcrypt.hash(password, salt);
    }

    const result = await pool.query(
      `UPDATE users SET
        username = COALESCE($2, username),
        password_hash = COALESCE($3, password_hash),
        email = COALESCE($4, email),
        first_name = COALESCE($5, first_name),
        last_name = COALESCE($6, last_name),
        role_id = COALESCE($7, role_id),
        branch_id = $8,
        is_active = COALESCE($9, is_active)
       WHERE user_id = $1
       RETURNING 
         user_id, 
         username, 
         email, 
         first_name, 
         last_name, 
         is_active`,
      [
        id,
        username ? username.trim() : null,
        password ? password_hash : null,
        email ? email.trim() : null,
        first_name ? first_name.trim() : null,
        last_name ? last_name.trim() : null,
        role_id || null,
        branch_id !== undefined ? branch_id : currentUser.branch_id,
        is_active !== undefined ? is_active : currentUser.is_active
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    });
    
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid role_id or branch_id' });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
});

// Toggle user active status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be a boolean' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET
        is_active = $1
       WHERE user_id = $2
       RETURNING 
         user_id, 
         username, 
         is_active`,
      [is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if user exists
    const existsResult = await pool.query(
      'SELECT 1 FROM users WHERE user_id = $1',
      [id]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is referenced as a manager in branches
    const managerCheck = await pool.query(
      'SELECT 1 FROM branches WHERE manager_id = $1 LIMIT 1',
      [id]
    );

    if (managerCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user - currently assigned as branch manager' 
      });
    }

    // Soft delete by setting is_active to false
    const result = await pool.query(
      `UPDATE users SET
        is_active = false
       WHERE user_id = $1
       RETURNING user_id, username`,
      [id]
    );
    
    res.json({ 
      message: 'User deactivated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Get active users (simplified for dropdowns)
router.get('/active/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        user_id,
        username,
        first_name,
        last_name
      FROM users
      WHERE is_active = true
      ORDER BY last_name, first_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;