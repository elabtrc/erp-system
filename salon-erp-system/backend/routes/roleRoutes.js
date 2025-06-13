// backend/routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const pool = require('../db');
const { checkAdmin } = require('../middleware/roleMiddleware');

// GET all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM roles';
    let params = [];
    let paramCount = 1;
    const conditions = [];

    if (search) {
      conditions.push(`role_name ILIKE $${paramCount}`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY role_name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    // Get total count for pagination
    const countQuery = 'SELECT COUNT(*) FROM roles' + (conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '');
    const [rolesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)) // Exclude limit/offset params
    ]);

    res.json({
      data: rolesResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET single role
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        r.role_id,
        r.role_name,
        r.description,
        r.created_at,
        r.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'permission_id', p.permission_id,
              'permission_name', p.permission_name,
              'description', p.description
            )
          ) FILTER (WHERE p.permission_id IS NOT NULL),
          '[]'
        ) AS permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE r.role_id = $1
       GROUP BY r.role_id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// CREATE new role (Admin only)
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
  const { role_name, description } = req.body;

  if (!role_name?.trim()) {
    return res.status(400).json({ error: 'Role name is required' });
  }

  try {
    // Check if role already exists
    const existsResult = await pool.query(
      'SELECT 1 FROM roles WHERE role_name = $1 LIMIT 1',
      [role_name.trim()]
    );

    if (existsResult.rows.length > 0) {
      return res.status(409).json({ error: 'Role already exists' });
    }

    const result = await pool.query(
      `INSERT INTO roles (role_name, description)
       VALUES ($1, $2)
       RETURNING role_id, role_name, description, created_at`,
      [role_name.trim(), description?.trim() || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating role:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    });
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// UPDATE role (Admin only)
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { role_name, description } = req.body;

  if (!role_name?.trim()) {
    return res.status(400).json({ error: 'Role name is required' });
  }

  try {
    // Check if role exists
    const existsResult = await pool.query(
      'SELECT 1 FROM roles WHERE role_id = $1 LIMIT 1',
      [id]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Check for name conflict with other roles
    const conflictResult = await pool.query(
      'SELECT 1 FROM roles WHERE role_id != $1 AND role_name = $2 LIMIT 1',
      [id, role_name.trim()]
    );

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({ error: 'Role name already in use' });
    }

    const result = await pool.query(
      `UPDATE roles SET
        role_name = $1,
        description = $2,
        updated_at = NOW()
       WHERE role_id = $3
       RETURNING role_id, role_name, description, updated_at`,
      [role_name.trim(), description?.trim() || null, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating role:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    });
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE role (Admin only)
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if role exists
    const existsResult = await pool.query(
      'SELECT 1 FROM roles WHERE role_id = $1 LIMIT 1',
      [id]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Check if role is assigned to any users
    const usersResult = await pool.query(
      'SELECT 1 FROM users WHERE role_id = $1 LIMIT 1',
      [id]
    );

    if (usersResult.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete role - it is assigned to one or more users' 
      });
    }

    // Start transaction
    await pool.query('BEGIN');

    // First delete role_permissions associations
    await pool.query(
      'DELETE FROM role_permissions WHERE role_id = $1',
      [id]
    );

    // Then delete the role
    const result = await pool.query(
      'DELETE FROM roles WHERE role_id = $1 RETURNING role_id, role_name',
      [id]
    );

    await pool.query('COMMIT');

    res.json({ 
      message: 'Role deleted successfully',
      role: result.rows[0]
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// GET permissions for role
router.get('/:id/permissions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.permission_id,
        p.permission_name,
        p.description
       FROM permissions p
       JOIN role_permissions rp ON p.permission_id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.permission_name`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// ADD permission to role (Admin only)
router.post('/:id/permissions', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { permission_id } = req.body;

  if (!permission_id) {
    return res.status(400).json({ error: 'Permission ID is required' });
  }

  try {
    // Check if role exists
    const roleResult = await pool.query(
      'SELECT 1 FROM roles WHERE role_id = $1 LIMIT 1',
      [id]
    );

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Check if permission exists
    const permResult = await pool.query(
      'SELECT 1 FROM permissions WHERE permission_id = $1 LIMIT 1',
      [permission_id]
    );

    if (permResult.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Check if association already exists
    const existsResult = await pool.query(
      'SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2 LIMIT 1',
      [id, permission_id]
    );

    if (existsResult.rows.length > 0) {
      return res.status(409).json({ error: 'Permission already assigned to role' });
    }

    await pool.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
      [id, permission_id]
    );

    res.status(201).json({ message: 'Permission added to role successfully' });
  } catch (error) {
    console.error('Error adding permission to role:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    });
    res.status(500).json({ error: 'Failed to add permission to role' });
  }
});

// REMOVE permission from role (Admin only)
router.delete('/:id/permissions/:permissionId', authenticateToken, checkAdmin, async (req, res) => {
  const { id, permissionId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING *',
      [id, permissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found for this role' });
    }

    res.json({ message: 'Permission removed from role successfully' });
  } catch (error) {
    console.error('Error removing permission from role:', error);
    res.status(500).json({ error: 'Failed to remove permission from role' });
  }
});

module.exports = router;