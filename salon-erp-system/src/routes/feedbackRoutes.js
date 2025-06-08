const express = require('express');
const router = express.Router();
const pool = require('../../backend/db');

// Get all feedbacks with optional branch filtering
router.get('/', async (req, res) => {
  try {
    const { branchId } = req.query;

    let query = `
      SELECT 
        cf.feedback_id,
        cf.customer_id,
        c.first_name || ' ' || c.last_name AS customer_name,
        cf.appointment_id,
        cf.rating,
        cf.comments,
        cf.feedback_date,
        cf.responded_by,
        cf.response,
        cf.response_date,
        COALESCE(c.branch_id, a.branch_id) AS branch_id,
        b.branch_name
      FROM customer_feedbacks cf
      LEFT JOIN customers c ON cf.customer_id = c.customer_id
      LEFT JOIN appointments a ON cf.appointment_id = a.appointment_id
      LEFT JOIN branches b ON COALESCE(c.branch_id, a.branch_id) = b.branch_id
      WHERE 1=1
    `;

    const params = [];
    
    if (branchId) {
      query += ` AND (c.branch_id = $1 OR a.branch_id = $1)`;
      params.push(branchId);
    }

    query += ` ORDER BY cf.feedback_date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

module.exports = router;