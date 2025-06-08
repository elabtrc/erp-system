// routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../../backend/db'); // Make sure this is your database connection


// Get all stocks with product and branch details
router.get('/', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          s.id,
          s.product_id,
          p.product_name,
          s.branch_id,
          b.branch_name,
          s.quantity,
          s.last_updated,
          p.price,
          p.description
        FROM stocks s
        JOIN products p ON s.product_id = p.product_id
        JOIN branches b ON s.branch_id = b.branch_id
        WHERE p.is_active = true AND b.is_active = true
        ORDER BY b.branch_name, p.product_name
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      res.status(500).json({ error: 'Failed to fetch stocks' });
    }
  });
  
  // Get stocks by branch
  router.get('/branch/:branchId', async (req, res) => {
    const { branchId } = req.params;
  
    try {
      const result = await db.query(`
        SELECT 
          s.id,
          s.product_id,
          p.product_name,
          s.branch_id,
          b.branch_name,
          s.quantity,
          s.last_updated,
          p.price,
          p.description,
          c.category_name  -- ✅ added category name
        FROM stocks s
        JOIN products p ON s.product_id = p.product_id
        JOIN branches b ON s.branch_id = b.branch_id
        LEFT JOIN categories c ON p.category_id = c.category_id  -- ✅ join category table
        WHERE s.branch_id = $1
          AND p.is_active = true
          AND b.is_active = true
        ORDER BY p.product_name
      `, [branchId]);
  
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching stock by branch:', error);
      res.status(500).json({ error: 'Failed to fetch stock data.' });
    }
  });
  
  
  
  
  
  // Create new stock
  router.post('/', async (req, res) => {
    const { product_id, branch_id, quantity } = req.body;
  
    try {
      const productExists = await db.query('SELECT product_id FROM products WHERE product_id = $1', [product_id]);
      const branchExists = await db.query('SELECT branch_id FROM branches WHERE branch_id = $1', [branch_id]);
  
      if (productExists.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (branchExists.rows.length === 0) {
        return res.status(404).json({ error: 'Branch not found' });
      }
  
      const existing = await db.query(
        'SELECT id FROM stocks WHERE product_id = $1 AND branch_id = $2',
        [product_id, branch_id]
      );
  
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Stock already exists for this product and branch' });
      }

      // 🔍 Check if the product is listed for the selected branch
const checkProductBranch = await db.query(
  `SELECT 1 FROM products WHERE product_id = $1 AND branch_id = $2`,
  [product_id, branch_id]
);

if (checkProductBranch.rows.length === 0) {
  return res.status(400).json({
    error: 'This product is not registered for the selected branch. Please add it to the branch’s product list first.'
  });
}
  
      const result = await db.query(
        `INSERT INTO stocks (product_id, branch_id, quantity) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [product_id, branch_id, quantity]
      );




  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating stock:', err);
      res.status(500).json({ error: 'Failed to create stock' });
    }
  });
  
  
  
  // Update stock quantity
  router.put('/:id', async (req, res) => {
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }
  
    try {
      const result = await db.query(
        `UPDATE stocks 
         SET quantity = $1 
         WHERE id = $2 
         RETURNING *`,
        [quantity, req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Stock not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating stock:', err);
      res.status(500).json({ error: 'Failed to update stock' });
    }
  });
  
  // Delete stock
  router.delete('/:id', async (req, res) => {
    try {
      const result = await db.query(
        'DELETE FROM stocks WHERE id = $1 RETURNING *',
        [req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Stock not found' });
      }
      
      res.json({ message: 'Stock deleted successfully' });
    } catch (err) {
      console.error('Error deleting stock:', err);
      res.status(500).json({ error: 'Failed to delete stock' });
    }
  });
  
  // Restock request routes
  router.post('/restock-requests', async (req, res) => {
    const { stockId, branchId, quantity } = req.body;
    
    if (!stockId || !branchId || !quantity) {
      return res.status(400).json({ error: 'stockId, branchId, and quantity are required' });
    }
  
    try {
      // Get current stock info
      const stock = await db.query(
        `SELECT s.*, p.product_name
         FROM stocks s
         JOIN products p ON s.product_id = p.product_id
         WHERE s.id = $1 AND s.branch_id = $2`,
        [stockId, branchId]
      );
      
      if (stock.rows.length === 0) {
        return res.status(404).json({ error: 'Stock not found' });
      }
  
      const result = await db.query(
        `INSERT INTO restock_requests 
         (stock_id, branch_id, product_id, current_quantity, quantity_requested) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          stockId,
          branchId,
          stock.rows[0].product_id,
          stock.rows[0].quantity,
          quantity
        ]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating restock request:', err);
      res.status(500).json({ error: 'Failed to create restock request' });
    }
  });
  
  // Get pending restock requests
  router.get('/restock-requests/pending', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          r.id,
          r.stock_id,
          r.branch_id,
          b.branch_name,
          r.product_id,
          p.product_name,
          r.current_quantity,
          r.quantity_requested,
          r.request_date
        FROM restock_requests r
        JOIN products p ON r.product_id = p.product_id
        JOIN branches b ON r.branch_id = b.branch_id
        WHERE r.status = 'pending'
        ORDER BY r.request_date DESC
      `);
      
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching restock requests:', err);
      res.status(500).json({ error: 'Failed to fetch restock requests' });
    }
  });
  
  // Confirm restock
  router.put('/restock-requests/:id/confirm', async (req, res) => {
    try {
      // Start transaction
      await db.query('BEGIN');
      
      // Get the request with lock
      const request = await db.query(
        `SELECT * FROM restock_requests 
         WHERE id = $1 AND status = 'pending' 
         FOR UPDATE`,
        [req.params.id]
      );
      
      if (request.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Pending restock request not found' });
      }
      
      // Update stock quantity
      const updatedStock = await db.query(
        `UPDATE stocks 
         SET quantity = quantity + $1 
         WHERE id = $2 
         RETURNING *`,
        [request.rows[0].quantity_requested, request.rows[0].stock_id]
      );
      
      if (updatedStock.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Stock not found' });
      }
      
      // Update request status
      await db.query(
        `UPDATE restock_requests 
         SET status = 'fulfilled', 
             fulfilled_date = NOW() 
         WHERE id = $1`,
        [req.params.id]
      );
      
      // Commit transaction
      await db.query('COMMIT');
      
      res.json(updatedStock.rows[0]);
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('Error confirming restock:', err);
      res.status(500).json({ error: 'Failed to confirm restock' });
    }
  });
  
  // Add these routes if not already present
router.get('/products', async (req, res) => {
    try {
      const result = await db.query(
        'SELECT product_id, product_name FROM products WHERE is_active = true ORDER BY product_name'
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });
  
  router.get('/branches', async (req, res) => {
    try {
      const result = await db.query(
        'SELECT branch_id, branch_name FROM branches WHERE is_active = true ORDER BY branch_name'
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching branches:', err);
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  });


  // ✅ API: Link existing product to a new branch
router.post('/add-product-to-branch', async (req, res) => {
  const { product_id, branch_id } = req.body;

  if (!product_id || !branch_id) {
    return res.status(400).json({ error: 'product_id and branch_id are required' });
  }

  try {
    // Check if product already exists for this branch
    const check = await db.query(
      'SELECT 1 FROM products WHERE product_id = $1 AND branch_id = $2',
      [product_id, branch_id]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Product already listed in this branch.' });
    }

    // Insert a duplicate entry for the branch (linking product)
    const productDetails = await db.query(
      'SELECT * FROM products WHERE product_id = $1',
      [product_id]
    );

    if (productDetails.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingProduct = productDetails.rows[0];

    await db.query(
      `INSERT INTO products (product_name, description, category_id, branch_id, reorder_level, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        existingProduct.product_name,
        existingProduct.description,
        existingProduct.category_id,
        branch_id,
        existingProduct.reorder_level || 10,
        true
      ]
    );

    res.status(201).json({ message: 'Product successfully added to branch.' });

  } catch (err) {
    console.error('Error linking product to branch:', err);
    res.status(500).json({ error: 'Failed to add product to branch' });
  }
});


  module.exports = router;