const express = require('express');
const router = express.Router();
const pool = require('../../backend/db');


const customerController = require('../controllers/customerController');

const { authenticateToken } = require('../middleware/authMiddleware');

// Customer Authentication Routes
router.post('/login', customerController.login);
router.post('/register', customerController.register);
router.put('/:customer_id', authenticateToken, customerController.updateProfile);


router.get('/combined', async (req, res) => {
  try {
      console.log('Received request for /api/customers/combined');
      
      const branchId = req.query.branchId;
      console.log(`Branch ID parameter: ${branchId}`);
      
      // Simple test query - verify database connection works
      const testQuery = await pool.query('SELECT 1+1 AS result');
      console.log('Database connection test:', testQuery.rows[0].result);
      
      // Main query
      let query = `
      SELECT 
          c.customer_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.address,
          a.branch_id
      FROM customers c
      LEFT JOIN (
          SELECT DISTINCT ON (customer_email) customer_email, branch_id 
          FROM appointments 
          WHERE status != 'Archived' OR status IS NULL
          ORDER BY customer_email, appointment_date DESC
      ) a ON c.email = a.customer_email
      WHERE c.archived = FALSE OR c.archived IS NULL
      `;
      
      const values = [];
      
      if (branchId) {
          query += ` AND a.branch_id = $1`;
          values.push(branchId);
      }
      
      console.log('Executing query:', query);
      const result = await pool.query(query, values);
      console.log(`Found ${result.rows.length} customers`);
      
      res.json(result.rows);

  } catch (err) {
      console.error('Full error object:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ 
          error: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? {
              message: err.message,
              code: err.code,
              query: err.query,
              parameters: err.parameters
          } : null
      });
  }
});
  
  router.put('/archive/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `UPDATE customers SET archived = TRUE WHERE customer_id = $1 RETURNING *`,
        [id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
  
      res.json({ message: 'Customer archived successfully' });
    } catch (err) {
      console.error('Error archiving customer:', err);
      res.status(500).json({ error: 'Failed to archive customer' });
    }
  });
  


  module.exports = router;