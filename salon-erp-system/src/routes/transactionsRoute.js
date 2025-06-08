// routes/transactions.js
const express = require('express');
const router = express.Router();
const db = require('../../backend/db');
const { generateExcel, generatePDF } = require('../services/reportGenerator.js');
const { authenticateToken } = require('../middleware/authMiddleware.js');


router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, branch, paymentMethod, search } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const userResult = await db.query(
      'SELECT branch_id FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'User not found' });
    }

    const userBranchId = userResult.rows[0].branch_id;

    let query = `
      SELECT 
        t.*,
        b.branch_name,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        CONCAT(u.first_name, ' ', u.last_name) AS cashier_name
      FROM pos_transactions t
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN users u ON t.cashier_id = u.user_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCounter = 1;

    // Restrict branch for non-admins
    if (userRole !== 'Admin') {
      query += ` AND t.branch_id = $${paramCounter++}`;
      queryParams.push(userBranchId);
    }

    // Admin applying a specific branch filter
    if (branch && userRole === 'Admin' && branch !== 'all') {
      query += ` AND t.branch_id = $${paramCounter++}`;
      queryParams.push(branch);
    }

    // Date range filter
    if (startDate && endDate) {
      query += ` AND t.transaction_date BETWEEN $${paramCounter} AND $${paramCounter + 1}`;
      queryParams.push(new Date(startDate), new Date(endDate + 'T23:59:59'));
      paramCounter += 2;
    } else if (startDate) {
      query += ` AND t.transaction_date >= $${paramCounter++}`;
      queryParams.push(new Date(startDate));
    } else if (endDate) {
      query += ` AND t.transaction_date <= $${paramCounter++}`;
      queryParams.push(new Date(endDate + 'T23:59:59'));
    }

    // Payment method
    if (paymentMethod && paymentMethod !== 'all') {
      query += ` AND t.payment_method ILIKE $${paramCounter++}`;
      queryParams.push(`%${paymentMethod}%`);
    }

    // Search
    if (search) {
      query += ` AND (
        t.receipt_number ILIKE $${paramCounter} OR
        c.first_name ILIKE $${paramCounter} OR
        c.last_name ILIKE $${paramCounter}
      )`;
      queryParams.push(`%${search}%`);
    }

    query += ' ORDER BY t.transaction_date DESC';

    const { rows: transactions } = await db.query(query, queryParams);

    // Fetch items per transaction
    for (const transaction of transactions) {
      const itemsQuery = `
        SELECT 
          i.*, p.product_name
        FROM pos_transaction_items i
        LEFT JOIN products p ON i.product_id = p.product_id
        WHERE i.transaction_id = $1
      `;
      const { rows: items } = await db.query(itemsQuery, [transaction.transaction_id]);
      transaction.items = items;
    }

    res.json(transactions);
  } catch (err) {
    console.error('Transaction API Error:', {
      message: err.message,
      stack: err.stack,
      query: req.query
    });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});


  // Get transaction by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          t.*,
          b.branch_name,
          CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
          CONCAT(c.first_name, ' ', c.last_name) as customer_name,
          c.email as customer_email,
          c.phone as customer_phone
        FROM pos_transactions t
        LEFT JOIN branches b ON t.branch_id = b.branch_id
        LEFT JOIN users u ON t.cashier_id = u.user_id
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        WHERE t.transaction_id = $1
      `;
      
      const { rows: [transaction] } = await db.query(query, [id]);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Get items
      const itemsQuery = `
        SELECT 
          i.*,
          p.product_name
        FROM pos_transaction_items i
        LEFT JOIN products p ON i.product_id = p.product_id
        WHERE i.transaction_id = $1
      `;
      const { rows: items } = await db.query(itemsQuery, [id]);
      transaction.items = items;
      
      res.json(transaction);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  });
  
  // Process refund
  router.post('/:id/refund', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify transaction exists
      const checkQuery = 'SELECT * FROM pos_transactions WHERE transaction_id = $1';
      const { rows: [transaction] } = await db.query(checkQuery, [id]);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Begin transaction
      await db.query('BEGIN');
      
      try {
        // Create refund transaction
        const refundQuery = `
          INSERT INTO pos_transactions (
            branch_id, 
            cashier_id, 
            transaction_date, 
            total_amount, 
            amount_tendered, 
            change_amount, 
            payment_method, 
            receipt_number,
            customer_id,
            gcash_reference
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;
        
        const receiptNumber = `REFUND-${transaction.receipt_number}`;
        
        const { rows: [refund] } = await db.query(refundQuery, [
          transaction.branch_id,
          req.user.user_id, // current user
          new Date(),
          -transaction.total_amount,
          -transaction.total_amount,
          0,
          transaction.payment_method,
          receiptNumber,
          transaction.customer_id,
          transaction.gcash_reference ? `REFUND-${transaction.gcash_reference}` : null
        ]);
        
        // Create refund items (negative quantities)
        const itemsQuery = 'SELECT * FROM pos_transaction_items WHERE transaction_id = $1';
        const { rows: items } = await db.query(itemsQuery, [id]);
        
        for (const item of items) {
          const refundItemQuery = `
            INSERT INTO pos_transaction_items (
              transaction_id,
              product_id,
              quantity,
              unit_price,
              total_price
            )
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await db.query(refundItemQuery, [
            refund.transaction_id,
            item.product_id,
            -item.quantity,
            item.unit_price,
            -item.total_price
          ]);
          
          // Update inventory if product exists
          if (item.product_id) {
            const updateInventoryQuery = `
              UPDATE branch_inventory
              SET quantity = quantity + $1
              WHERE branch_id = $2 AND product_id = $3
            `;
            await db.query(updateInventoryQuery, [
              item.quantity,
              transaction.branch_id,
              item.product_id
            ]);
          }
        }
        
        await db.query('COMMIT');
        res.json(refund);
      } catch (err) {
        await db.query('ROLLBACK');
        throw err;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to process refund' });
    }
  });
  
  // Export to Excel
  router.get('/export/excel', async (req, res) => {
    try {
      const { startDate, endDate, branch, paymentMethod } = req.query;
      
      let query = `
        SELECT 
          t.*,
          b.branch_name,
          CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
          CONCAT(c.first_name, ' ', c.last_name) as customer_name
        FROM pos_transactions t
        LEFT JOIN branches b ON t.branch_id = b.branch_id
        LEFT JOIN users u ON t.cashier_id = u.user_id
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (startDate) {
        query += ` AND t.transaction_date >= $${params.length + 1}`;
        params.push(new Date(startDate));
      }
      
      if (endDate) {
        query += ` AND t.transaction_date <= $${params.length + 1}`;
        params.push(new Date(endDate + 'T23:59:59'));
      }
      
      if (branch && branch !== 'all') {
        query += ` AND t.branch_id = $${params.length + 1}`;
        params.push(branch);
      }
      
      if (paymentMethod && paymentMethod !== 'all') {
        query += ` AND t.payment_method ILIKE $${params.length + 1}`;
        params.push(`%${paymentMethod}%`);
      }
      
      query += ' ORDER BY t.transaction_date DESC';
      
      const { rows: transactions } = await db.query(query, params);
      
      // Generate Excel file
      const excelBuffer = await generateExcel(transactions);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
      res.send(excelBuffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate Excel report' });
    }
  });
  
  // Export to PDF
  router.get('/export/pdf', async (req, res) => {
    try {
      const { startDate, endDate, branch, paymentMethod } = req.query;
      
      let query = `
        SELECT 
          t.*,
          b.branch_name,
          CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
          CONCAT(c.first_name, ' ', c.last_name) as customer_name
        FROM pos_transactions t
        LEFT JOIN branches b ON t.branch_id = b.branch_id
        LEFT JOIN users u ON t.cashier_id = u.user_id
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (startDate) {
        query += ` AND t.transaction_date >= $${params.length + 1}`;
        params.push(new Date(startDate));
      }
      
      if (endDate) {
        query += ` AND t.transaction_date <= $${params.length + 1}`;
        params.push(new Date(endDate + 'T23:59:59'));
      }
      
      if (branch && branch !== 'all') {
        query += ` AND t.branch_id = $${params.length + 1}`;
        params.push(branch);
      }
      
      if (paymentMethod && paymentMethod !== 'all') {
        query += ` AND t.payment_method ILIKE $${params.length + 1}`;
        params.push(`%${paymentMethod}%`);
      }
      
      query += ' ORDER BY t.transaction_date DESC';
      
      const { rows: transactions } = await db.query(query, params);
      
      // Generate PDF file
      const pdfBuffer = await generatePDF(transactions);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  });
  
  module.exports = router;
