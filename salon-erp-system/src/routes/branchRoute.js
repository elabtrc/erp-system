const express = require('express');
const router = express.Router();
const db = require('../../backend/db');

// Get active branches
router.get('/active', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        branch_id,
        branch_name,
        location
      FROM branches
      WHERE is_active = true
      ORDER BY branch_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching active branches:', err);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

module.exports = router;