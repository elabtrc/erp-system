// src/controllers/transactionsController.js
const pool = require('../db');

const getAllTransactions = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      branchId,
      status,
      paymentMethod,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let query = `
      SELECT 
        t.transaction_id as id,
        t.transaction_date as date,
        t.receipt_number as invoice,
        CONCAT(c.first_name, ' ', c.last_name) as customer,
        b.branch_name as branch,
        t.total_amount as total,
        t.payment_method as paymentMethod,
        CASE 
          WHEN t.refunded THEN 'Refunded'
          WHEN t.voided THEN 'Voided'
          ELSE 'Completed'
        END as status,
        CONCAT(u.first_name, ' ', u.last_name) as employee,
        t.amount_tendered,
        t.change_amount
      FROM pos_transactions t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN users u ON t.cashier_id = u.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND t.transaction_date >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND t.transaction_date <= $${paramCount++}`;
      params.push(endDate);
    }

    if (branchId && branchId !== 'all') {
      query += ` AND t.branch_id = $${paramCount++}`;
      params.push(branchId);
    }

    if (status && status !== 'all') {
      if (status === 'completed') {
        query += ` AND NOT t.refunded AND NOT t.voided`;
      } else if (status === 'refunded') {
        query += ` AND t.refunded`;
      } else if (status === 'voided') {
        query += ` AND t.voided`;
      }
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query += ` AND t.payment_method ILIKE $${paramCount++}`;
      params.push(`%${paymentMethod}%`);
    }

    if (search) {
      query += ` AND (
        t.receipt_number ILIKE $${paramCount} OR 
        c.first_name ILIKE $${paramCount} OR 
        c.last_name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    // Count total records for pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) as total`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add sorting and pagination
    query += ` ORDER BY t.transaction_date DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, (page - 1) * limit);

    const result = await pool.query(query, params);

    // Get transaction items for each transaction
    for (const transaction of result.rows) {
      const itemsQuery = `
        SELECT 
          p.product_name as name,
          i.unit_price as price,
          i.quantity,
          i.total_price as total
        FROM pos_transaction_items i
        LEFT JOIN products p ON i.product_id = p.product_id
        WHERE i.transaction_id = $1
      `;
      const itemsResult = await pool.query(itemsQuery, [transaction.id]);
      transaction.items = itemsResult.rows;
      
      // Calculate subtotal, tax, discount (adjust based on your actual schema)
      transaction.subtotal = transaction.total;
      transaction.tax = 0; // Adjust if you store tax separately
      transaction.discount = 0; // Adjust if you store discounts
    }

    res.json({
      transactions: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get transaction header
    const transactionQuery = `
      SELECT 
        t.*,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        b.branch_name,
        CONCAT(u.first_name, ' ', u.last_name) as cashier_name
      FROM pos_transactions t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN users u ON t.cashier_id = u.user_id
      WHERE t.transaction_id = $1
    `;
    const transactionResult = await pool.query(transactionQuery, [id]);

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];

    // Get transaction items
    const itemsQuery = `
      SELECT 
        i.*,
        p.product_name,
        p.product_code
      FROM pos_transaction_items i
      LEFT JOIN products p ON i.product_id = p.product_id
      WHERE i.transaction_id = $1
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);
    transaction.items = itemsResult.rows;

    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const exportTransactionsToCSV = async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;

    let query = `
      SELECT 
        t.transaction_id as "Transaction ID",
        t.transaction_date as "Date",
        t.receipt_number as "Invoice #",
        CONCAT(c.first_name, ' ', c.last_name) as "Customer",
        b.branch_name as "Branch",
        t.total_amount as "Total",
        t.payment_method as "Payment Method",
        CASE 
          WHEN t.refunded THEN 'Refunded'
          WHEN t.voided THEN 'Voided'
          ELSE 'Completed'
        END as "Status",
        CONCAT(u.first_name, ' ', u.last_name) as "Employee"
      FROM pos_transactions t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN branches b ON t.branch_id = b.branch_id
      LEFT JOIN users u ON t.cashier_id = u.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND t.transaction_date >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND t.transaction_date <= $${paramCount++}`;
      params.push(endDate);
    }

    if (branchId && branchId !== 'all') {
      query += ` AND t.branch_id = $${paramCount++}`;
      params.push(branchId);
    }

    query += ` ORDER BY t.transaction_date DESC`;

    const result = await pool.query(query, params);

    // Convert to CSV
    const json2csv = require('json2csv').parse;
    const csv = json2csv(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions-export.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateReceipt = async (req, res) => {
  const { id } = req.params;
  const { payment_method, amount_tendered } = req.body;

  try {
    // 1. Verify appointment exists
    const appointment = await pool.query(
      `SELECT a.*, s.price, s.service_name, 
       c.first_name as customer_first, c.last_name as customer_last,
       e.first_name as employee_first, e.last_name as employee_last,
       b.branch_name
       FROM appointments a
       JOIN services s ON a.service_id = s.service_id
       LEFT JOIN customers c ON a.customer_id = c.customer_id
       JOIN employees e ON a.employee_id = e.employee_id
       JOIN branches b ON a.branch_id = b.branch_id
       WHERE a.appointment_id = $1`,
      [id]
    );

    if (appointment.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appt = appointment.rows[0];
    const total = parseFloat(appt.price || 0);
    const tendered = parseFloat(amount_tendered || 0);
    const change = tendered - total;

    // 2. Create transaction record
    const receiptNumber = `RCPT-${Date.now()}`;
    await pool.query(
      `INSERT INTO pos_transactions (
        branch_id, cashier_id, transaction_date, 
        total_amount, amount_tendered, change_amount,
        payment_method, receipt_number, customer_id, appointment_id
      ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)`,
      [
        appt.branch_id,
        req.user.id,
        total,
        tendered,
        change,
        payment_method,
        receiptNumber,
        appt.customer_id,
        id
      ]
    );

    // 3. Generate PDF
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptNumber}.pdf`);
      res.send(pdfData);
    });

    // PDF Content
    // Header
    doc.fillColor('#333')
       .fontSize(20)
       .text('SALON RECEIPT', { align: 'center' })
       .moveDown(0.5);

    // Receipt Info
    doc.fontSize(10)
       .text(`Receipt #: ${receiptNumber}`, { align: 'left' })
       .text(`Date: ${new Date().toLocaleString()}`, { align: 'left' })
       .text(`Branch: ${appt.branch_name}`, { align: 'left' })
       .moveDown();

    // Divider
    doc.strokeColor('#aaa')
       .lineWidth(1)
       .moveTo(doc.page.margins.left, doc.y)
       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
       .stroke();

    // Customer Details
    doc.fontSize(12)
       .text('CUSTOMER DETAILS', { underline: true })
       .moveDown(0.5);
    
    doc.fontSize(10)
       .text(`Name: ${appt.customer_first || ''} ${appt.customer_last || ''}`)
       .text(`Phone: ${appt.customer_phone || ''}`)
       .moveDown();

    // Service Details
    doc.fontSize(12)
       .text('SERVICE DETAILS', { underline: true })
       .moveDown(0.5);
    
    doc.fontSize(10)
       .text(`Service: ${appt.service_name}`)
       .text(`Employee: ${appt.employee_first} ${appt.employee_last}`)
       .text(`Date: ${new Date(appt.appointment_date).toLocaleString()}`)
       .moveDown();

    // Payment Summary
    doc.fontSize(12)
       .text('PAYMENT SUMMARY', { underline: true })
       .moveDown(0.5);
    
    doc.fontSize(10)
       .text(`Subtotal: ₱${total.toFixed(2)}`)
       .text(`Payment Method: ${payment_method.toUpperCase()}`)
       .text(`Amount Tendered: ₱${tendered.toFixed(2)}`)
       .text(`Change: ₱${change.toFixed(2)}`)
       .moveDown();

    // Footer
    doc.fontSize(8)
       .fillColor('#666')
       .text('Thank you for your business!', { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Receipt generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate receipt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  exportTransactionsToCSV,
  generateReceipt,
};
