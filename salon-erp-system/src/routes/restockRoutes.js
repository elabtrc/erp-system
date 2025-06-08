const express = require('express');
const router = express.Router();
const db = require('../../backend/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET all pending restock requests
router.get('/restock-requests/pending', authenticateToken, async (req, res) => {
    try {
      const result = await db.query(`
        SELECT * FROM restock_requests
        WHERE status = 'pending'
        ORDER BY requested_at DESC
      `);
  
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching pending restock requests:', error);
      res.status(500).json({ error: 'Failed to fetch pending restock requests' });
    }
  });


// Confirm restock request
router.put('/restock-requests/:id/confirm', authenticateToken, async (req, res) => {
    const requestId = req.params.id;
  
    try {
      // Step 1: Get the restock request info
      const restockRes = await db.query(
        `SELECT * FROM restock_requests WHERE id = $1 AND status = 'pending'`,
        [requestId]
      );
  
      if (restockRes.rows.length === 0) {
        return res.status(404).json({ error: 'Pending restock request not found' });
      }
  
      const restockRequest = restockRes.rows[0];
  
      // Step 2: Update the stock quantity
      await db.query(
        `UPDATE stocks 
         SET quantity = quantity + $1
         WHERE branch_id = $2 AND product_id = $3`,
        [restockRequest.requested_quantity, restockRequest.branch_id, restockRequest.product_id]
      );
  
      // Step 3: Update the restock request status
      const updateRes = await db.query(
        `UPDATE restock_requests
         SET status = 'approved', 
             processed_at = NOW(), 
             processed_by = $1
         WHERE id = $2
         RETURNING *`,
        [req.user.userId, requestId]
      );
  
      res.json(updateRes.rows[0]);
  
    } catch (error) {
      console.error('Error confirming restock request:', error);
      res.status(500).json({ error: 'Failed to confirm restock request' });
    }
  });
  
  
// Create a restock request
router.post('/restock-requests', authenticateToken, async (req, res) => {
    try {
      const { product_id, branch_id, current_quantity, requested_quantity, requested_by } = req.body;
  
      if (!product_id || !branch_id || !requested_quantity || !requested_by) {
        return res.status(400).json({ error: "Please fill all required fields" });
      }
  
      const result = await db.query(`
        INSERT INTO restock_requests (product_id, branch_id, current_quantity, requested_quantity, status, requested_by)
        VALUES ($1, $2, $3, $4, 'pending', $5)
        RETURNING *
      `, [product_id, branch_id, current_quantity || 0, requested_quantity, requested_by]);
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating restock request:', error);
      res.status(500).json({ error: "Failed to create restock request" });
    }
  });
  
  

  // Reject restock request
router.put('/restock-requests/:id/reject', authenticateToken, async (req, res) => {
    try {
      const requestId = req.params.id;
  
      const result = await db.query(
        `UPDATE restock_requests 
         SET status = 'rejected', 
             processed_at = NOW(), 
             processed_by = $1 
         WHERE id = $2 AND status = 'pending'
         RETURNING *`,
        [req.user.userId, requestId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pending restock request not found' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error rejecting restock request:', error);
      res.status(500).json({ error: 'Failed to reject restock request' });
    }
  });
  
  router.get('/restock-requests/history', authenticateToken, async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          rr.id,
          rr.product_id,
          COALESCE(p.product_name, 'Unknown Product') AS product_name,
          rr.branch_id,
          COALESCE(b.branch_name, 'Unknown Branch') AS branch_name,
          rr.requested_quantity,
          rr.current_quantity,
          rr.status,
          rr.requested_at,
          rr.processed_at,
          rr.notes,
          -- Combine role and branch into one field
          COALESCE(r_requested.role_name || ' - ' || br_requested.branch_name, 'Unknown Requester') AS requested_by_info,
          COALESCE(u_processed.username, 'Unknown Processor') AS processed_by_username
        FROM restock_requests rr
        LEFT JOIN products p ON rr.product_id = p.product_id
        LEFT JOIN branches b ON rr.branch_id = b.branch_id
        LEFT JOIN users u_requested ON rr.requested_by = u_requested.user_id
        LEFT JOIN roles r_requested ON u_requested.role_id = r_requested.role_id
        LEFT JOIN branches br_requested ON u_requested.branch_id = br_requested.branch_id
        LEFT JOIN users u_processed ON rr.processed_by = u_processed.user_id
        WHERE rr.status IN ('approved', 'rejected')
        ORDER BY rr.processed_at DESC
      `);
  
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching restock history:', error);
      res.status(500).json({ error: 'Failed to fetch restock history' });
    }
  });
  
  
  

module.exports = router;
