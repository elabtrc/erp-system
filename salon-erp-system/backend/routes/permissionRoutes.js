const express = require('express');
const router = express.Router();
const db = require('../db'); // use your pg pool or client

// GET all permissions
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT permission_id, permission_name, description FROM permissions ORDER BY permission_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET permission by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT permission_id, permission_name, description FROM permissions WHERE permission_id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Permission not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching permission by ID:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
