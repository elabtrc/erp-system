// src/routes/posRoutes.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const {authenticateToken} = require('../middleware/authMiddleware'); // You have this

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Create a new POS transaction
router.post('/transactions', authenticateToken, async (req, res) => {
  const {
    branch_id,
    cashier_id,
    customer_id,
    total_amount,
    amount_tendered,
    change_amount,
    payment_method,
    items
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transactionRes = await client.query(
      `INSERT INTO pos_transactions 
        (branch_id, cashier_id, customer_id, total_amount, amount_tendered, change_amount, payment_method, transaction_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING transaction_id`,
      [branch_id, cashier_id, customer_id || null, total_amount, amount_tendered, change_amount, payment_method]
    );

    const transactionId = transactionRes.rows[0].transaction_id;

    for (const item of items) {
      await client.query(
        `INSERT INTO pos_transaction_items 
          (transaction_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)`,
        [transactionId, item.product_id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE branch_inventory
         SET quantity = quantity - $1
         WHERE branch_id = $2 AND product_id = $3`,
        [item.quantity, branch_id, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ transaction_id: transactionId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction Error:', error);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    client.release();
  }
});

// (Optional) Get a POS receipt
router.get('/receipt/:transactionId', authenticateToken, async (req, res) => {
  const { transactionId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        t.transaction_id,
        t.transaction_date,
        t.total_amount,
        t.payment_method,
        b.branch_name,
        b.location,
        u.first_name AS cashier_first_name,
        u.last_name AS cashier_last_name,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name
      FROM pos_transactions t
      JOIN branches b ON t.branch_id = b.branch_id
      JOIN users u ON t.cashier_id = u.user_id
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      WHERE t.transaction_id = $1
    `, [transactionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const items = await pool.query(`
      SELECT 
        pti.product_id,
        p.product_name,
        pti.quantity,
        pti.price AS unit_price,
        pti.quantity * pti.price AS total_price
      FROM pos_transaction_items pti
      JOIN products p ON pti.product_id = p.product_id
      WHERE pti.transaction_id = $1
    `, [transactionId]);

    const receiptData = {
      ...result.rows[0],
      items: items.rows
    };

    res.json(receiptData);
  } catch (error) {
    console.error('Receipt Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

module.exports = router;
