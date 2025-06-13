
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
const sharp = require("sharp");
const nodemailer = require('nodemailer');
const Product = require('./models/Product');
const productRoute = require('./routes/productRoute');
const Category = require('./models/Category'); // Adjust path as needed
const stockRoutes = require('./routes/stockRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const restockRoutes = require('./routes/restockRoutes');
const transactionsRoute = require('./routes/transactionsRoute');
const paymentBookingRoute = require('./routes/paymentBookingRoute');
const customerRoutes = require('./routes/customerRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes'); // Add this line
const permissionRoutes = require('./routes/permissionRoutes');

const { computeWorkingDays } = require('./utils/workingDays');
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });


const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------
// ✅ Middleware
// ---------------------
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use('/api/stocks', stockRoutes); // Mount stocks API
app.use('/api', restockRoutes);
app.use('/api/products', productRoute);
app.use('/api/transactions', transactionsRoute);
app.use('/api/payments', paymentBookingRoute);
app.use('/api/customers', customerRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

// Serve ERP frontend
app.use('/erp', express.static(path.join(__dirname, '../build')));
app.get('/erp/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Serve Attendance frontend
app.use('/attendance', express.static(path.join(__dirname, '../../../attendance-system/build')));
app.get('/attendance/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../attendance-system/build/index.html'));
});

// Serve Salon Website frontend (default landing page)
app.use('/', express.static(path.join(__dirname, '../../../salon-website/build')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../salon-website/build/index.html'));
});

// ---------------------
// ✅ DB Connection
// ---------------------
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// After creating the pool in server.js
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully:', res.rows[0].now);
  }
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

// ---------------------
// ✅ Auth Middleware
// ---------------------
const tokenBlacklist = new Set();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);
  if (tokenBlacklist.has(token)) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}


// ---------------------
// ✅ Auth Endpoints
// ---------------------
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const userResult = await pool.query(
      `SELECT 
         u.user_id,
         u.username,
         u.password_hash,
         u.is_active,
         u.first_name,
         u.last_name,
         r.role_name as role,
         b.branch_id,            -- <-- ADD THIS
         b.branch_name,
         COALESCE(array_agg(p.permission_name) FILTER (WHERE p.permission_name IS NOT NULL), '{}') as permissions
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE u.username = $1
       GROUP BY u.user_id, r.role_name, b.branch_id, b.branch_name`,
      [username]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const validPassword = await bcryptjs.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({
      userId: user.user_id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        user_id: user.user_id,  // 🔥 Add this!
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        branchName: user.branch_name,
        branchId: user.branch_id,
        permissions: user.permissions
      }
    });
    

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/logout', authenticateToken, (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) tokenBlacklist.add(token);
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT 
         u.user_id,
         u.username,
         u.first_name,
         u.last_name,
         r.role_name as role,
         b.branch_name,
         array_agg(p.permission_name) as permissions
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE u.user_id = $1
       GROUP BY u.user_id, r.role_name, b.branch_name`,
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: userResult.rows[0],
      permissions: userResult.rows[0].permissions.filter(p => p !== null)
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------
// ✅ Mount Routes
// ---------------------
app.use('/api/appointments', appointmentRoutes);

// ---------------------
// ✅ Customer Endpoints
// ---------------------
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_staff_name
      FROM customers c
      LEFT JOIN users u ON c.assigned_staff_id = u.user_id
      ORDER BY c.last_name, c.first_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Customer Registration Endpoint
// Customer Registration Endpoint
app.post('/api/customers/register', async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  try {
    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'First name, last name, email, and password are required' 
      });
    }

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT 1 FROM customers WHERE email = $1',
      [email]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already registered' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    // Create customer
    const result = await pool.query(
      `INSERT INTO customers (
        first_name, last_name, email, phone, password_hash
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING customer_id, first_name, last_name, email, phone, customer_type`,
      [first_name, last_name, email, phone || null, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        customerId: result.rows[0].customer_id,
        email: result.rows[0].email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to register customer',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Customer Login Endpoint
app.post('/api/customers/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find customer by email
    const result = await pool.query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    const customer = result.rows[0];

    // Verify password
    const validPassword = await bcryptjs.compare(password, customer.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        customerId: customer.customer_id,
        email: customer.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and customer data (excluding password)
    const { password_hash, ...customerData } = customer;
    res.json({
      success: true,
      token,
      customer: customerData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  const { first_name, last_name, email, phone, address, customer_type, loyalty_points, assigned_staff_id } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO customers (
        first_name, last_name, email, phone, address, 
        customer_type, loyalty_points, assigned_staff_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        first_name, 
        last_name, 
        email || null, 
        phone || null, 
        address || null,
        customer_type || 'Regular',
        loyalty_points || 0,
        assigned_staff_id || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, address, customer_type, loyalty_points, assigned_staff_id } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE customers SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        address = $5,
        customer_type = $6,
        loyalty_points = $7,
        assigned_staff_id = $8
       WHERE customer_id = $9
       RETURNING *`,
      [
        first_name, 
        last_name, 
        email || null, 
        phone || null, 
        address || null,
        customer_type || 'Regular',
        loyalty_points || 0,
        assigned_staff_id || null,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const hasAppointments = await pool.query(
      'SELECT 1 FROM appointments WHERE customer_id = $1 LIMIT 1',
      [id]
    );
    
    const hasSales = await pool.query(
      'SELECT 1 FROM sales WHERE customer_id = $1 LIMIT 1',
      [id]
    );
    
    if (hasAppointments.rows.length > 0 || hasSales.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with associated appointments or sales' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM customers WHERE customer_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

app.get('/api/customers/:id/appointments', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        a.appointment_id,
        a.appointment_date AS date,
        s.service_name,
        s.price,
        a.status,
        CONCAT(e.first_name, ' ', e.last_name) AS staff_name
      FROM appointments a
      JOIN services s ON a.service_id = s.service_id
      LEFT JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.customer_id = $1
      ORDER BY a.appointment_date DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer appointments:', error);
    res.status(500).json({ error: 'Failed to fetch customer appointments' });
  }
});


app.get('/api/customers/:id/sales', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const salesResult = await pool.query(`
      SELECT 
        s.sale_id,
        s.sale_date,
        s.total_amount,
        s.payment_method,
        (
          SELECT json_agg(json_build_object(
            'product_name', p.product_name,
            'quantity', si.quantity,
            'price', si.unit_price
          ))
          FROM sale_items si
          JOIN products p ON si.product_id = p.product_id
          WHERE si.sale_id = s.sale_id
        ) as items
      FROM sales s
      WHERE s.customer_id = $1
      ORDER BY s.sale_date DESC
    `, [id]);
    
    res.json(salesResult.rows);
  } catch (error) {
    console.error('Error fetching customer sales:', error);
    res.status(500).json({ error: 'Failed to fetch customer sales' });
  }
});


// ---------------------
// ✅ Public Endpoints
// ---------------------
app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY service_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const { is_active } = req.query;
    let query = 'SELECT * FROM employees';
    const params = [];
    
    if (is_active === 'true') {
      query += ' WHERE is_active = $1';
      params.push(true);
    }

    query += ' ORDER BY first_name, last_name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// ---------------------
// ✅ Branch API Endpoints
// ---------------------

// Get all branches
app.get('/api/branches', async (req, res) => {
  try {
    const { is_active } = req.query;
    let query = 'SELECT * FROM branches';
    const params = [];

    if (is_active === 'true') {
      query += ' WHERE is_active = $1';
      params.push(true);
    }

    query += ' ORDER BY branch_name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get single branch
app.get('/api/branches/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM branches WHERE branch_id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

//Create a new branches
app.post('/api/branches', authenticateToken, async (req, res) => {
  const { branch_name, location, contact_number } = req.body;

  // Remove branch_id from the request body if it exists
  delete req.body.branch_id;

  try {
    const result = await pool.query(
      `INSERT INTO branches (
        branch_name, 
        location, 
        contact_number,
        is_active
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        branch_name.trim(),
        location.trim(),
        contact_number?.trim() || null,
        true
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

// Update branch
app.put('/api/branches/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { branch_name, location, contact_number, is_active } = req.body;

  // Validate required fields
  if (!branch_name?.trim()) {
    return res.status(400).json({ error: 'Branch name is required' });
  }
  if (!location?.trim()) {
    return res.status(400).json({ error: 'Location is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE branches SET
        branch_name = $1,
        location = $2,
        contact_number = $3,
        is_active = $4
       WHERE branch_id = $5
       RETURNING *`,
      [
        branch_name.trim(),
        location.trim(),
        contact_number?.trim() || null,
        is_active !== false, // Default to true if not provided
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating branch:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    });
    
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Branch name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update branch' });
    }
  }
});

// Delete branch
app.delete('/api/branches/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if branch is referenced by other tables
    const referenceChecks = await Promise.all([
      pool.query('SELECT 1 FROM users WHERE branch_id = $1 LIMIT 1', [id]),
      pool.query('SELECT 1 FROM products WHERE branch_id = $1 LIMIT 1', [id]),
      pool.query('SELECT 1 FROM employees WHERE branch_id = $1 LIMIT 1', [id]),
      pool.query('SELECT 1 FROM appointments WHERE branch_id = $1 LIMIT 1', [id])
    ]);
    
    const isReferenced = referenceChecks.some(result => result.rows.length > 0);
    
    if (isReferenced) {
      return res.status(400).json({ 
        error: 'Cannot delete branch as it is referenced by other records' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM branches WHERE branch_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

app.get('/api/employees/service', async (req, res) => {
  const { service_id, branch_id, day_of_week } = req.query;

  try {
    const query = `
      SELECT DISTINCT e.* 
      FROM employees e
      JOIN employee_services es ON e.employee_id = es.employee_id
      JOIN employee_schedule sch ON sch.employee_id = e.employee_id
      WHERE es.service_id = $1
        AND e.branch_id = $2
        AND e.is_active = true
        AND sch.day_of_week = $3
      ORDER BY e.first_name, e.last_name
    `;
    const result = await pool.query(query, [service_id, branch_id, day_of_week]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Add this near your other appointment routes
app.post('/api/appointments/:id/receipt', 
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { payment_method, amount_tendered } = req.body;

      // 1. Get appointment details
      const appointment = await pool.query(
        `SELECT a.*, s.price, s.service_name, 
         c.first_name as customer_first, c.last_name as customer_last,
         e.first_name as employee_first, e.last_name as employee_last,
         b.branch_name, b.location as branch_address
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
          req.user.userId,
          total,
          tendered,
          change,
          payment_method,
          receiptNumber,
          appt.customer_id,
          id
        ]
      );

      // 3. Generate PDF receipt
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptNumber}.pdf`);
      
      // Pipe the PDF to the response
      doc.pipe(res);

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

      // Finalize the PDF
      doc.end();

    } catch (error) {
      console.error('Receipt generation failed:', error);
      res.status(500).json({ 
        error: 'Failed to generate receipt',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

app.get('/api/appointments/availability', async (req, res) => {
  const { employee_id, date, service_id } = req.query;
  try {
    const serviceResult = await pool.query('SELECT duration FROM services WHERE service_id = $1', [service_id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const duration = serviceResult.rows[0].duration || 30;
    const workStart = '09:00';
    const workEnd = '18:00';
    const interval = 30;

    const appointments = await pool.query(
      `SELECT appointment_date, duration 
       FROM appointments 
       WHERE employee_id = $1 
       AND DATE(appointment_date) = $2
       AND status != 'Cancelled'`,
      [employee_id, date]
    );

    const slots = [];
    const startTime = new Date(`${date}T${workStart}`);
    const endTime = new Date(`${date}T${workEnd}`);
    let currentTime = new Date(startTime);

    while (currentTime <= endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      const isAvailable = !appointments.rows.some(app => {
        const appStart = new Date(app.appointment_date);
        const appEnd = new Date(appStart.getTime() + app.duration * 60000);
        return currentTime < appEnd && slotEnd > appStart;
      });

      if (isAvailable && slotEnd <= endTime) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          display: moment(currentTime).format('HH:mm')
        });
      }

      currentTime = new Date(currentTime.getTime() + interval * 60000);
    }

    res.json(slots);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});







// ---------------------
// ✅ Product Endpoints
// ---------------------





// Add these endpoints to your existing server.js

// Get all products
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const { branch_id, is_active } = req.query;
    const products = await Product.getAll(branch_id || null);
    
    res.json({ 
      success: true,
      data: products 
    });
  } catch (error) {
    console.error('Error fetching products:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      constraint: error.constraint
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single product
app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    res.json({ 
      success: true,
      data: product 
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch product' 
    });
  }
});

// Create product
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    console.log('Received product creation request:', req.body);
    
    if (!req.body.product_name) {
      console.log('Validation failed: Product name missing');
      return res.status(400).json({ 
        success: false,
        error: 'Product name is required' 
      });
    }
    if (!req.body.branch_id) {
      console.log('Validation failed: Branch ID missing');
      return res.status(400).json({ 
        success: false,
        error: 'Branch is required' 
      });
    }

    const product = await Product.create(req.body);
    console.log('Successfully created product:', product);
    
    res.status(201).json({ 
      success: true,
      data: product 
    });
  } catch (error) {
    console.error('Product creation error:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      stack: error.stack
    });

    let errorMessage = 'Failed to create product';
    let statusCode = 500;

    if (error.code === '23503') { // Foreign key violation
      if (error.constraint === 'fk_products_branches') {
        errorMessage = 'Invalid branch ID: Branch does not exist';
        statusCode = 400;
      } else if (error.constraint === 'products_category_id_fkey') {
        errorMessage = 'Invalid category ID: Category does not exist';
        statusCode = 400;
      }
    }

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Received update for product:', req.params.id);
    console.log('Update data:', req.body);

    const product = await Product.update(req.params.id, req.body);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: product 
    });
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      stack: error.stack
    });

    let errorMessage = 'Failed to update product';
    let statusCode = 500;

    if (error.code === '23503') { // Foreign key violation
      if (error.constraint === 'fk_products_branches') {
        errorMessage = 'Invalid branch ID: Branch does not exist';
        statusCode = 400;
      } else if (error.constraint === 'products_category_id_fkey') {
        errorMessage = 'Invalid category ID: Category does not exist';
        statusCode = 400;
      }
    } else if (error.message === 'No valid fields provided for update') {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message === 'Product not found') {
      errorMessage = error.message;
      statusCode = 404;
    }

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Product.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    res.json({ 
      success: true,
      data: { message: 'Product deleted successfully' } 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete product' 
    });
  }
});




// ---------------------
// ✅ Category Endpoints
// ---------------------
// Get all categories
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.getAll();
    
    if (!Array.isArray(categories)) {
      console.error('Categories is not an array:', categories);
      throw new Error('Invalid data format returned from database');
    }
    
    res.json({ 
      success: true,
      data: categories 
    });
  } catch (error) {
    console.error('Full error in /api/categories:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create category
app.post('/api/categories', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { category_name, description, parent_category_id } = req.body;
    
    // Validate required fields
    if (!category_name?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required',
        field: 'category_name'
      });
    }

    // Check for existing category name (case-insensitive)
    const existingCheck = await client.query(
      'SELECT 1 FROM categories WHERE LOWER(category_name) = LOWER($1)',
      [category_name.trim()]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists',
        field: 'category_name'
      });
    }

    // Validate parent category exists if provided
    if (parent_category_id) {
      const parentCheck = await client.query(
        'SELECT 1 FROM categories WHERE category_id = $1',
        [parent_category_id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Parent category does not exist',
          field: 'parent_category_id'
        });
      }
    }

    const result = await client.query(
      `INSERT INTO categories 
       (category_name, description, parent_category_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [
        category_name.trim(),
        description?.trim() || null,
        parent_category_id || null
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// Update category
app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { category_name, description, parent_category_id } = req.body;

    // Validate required fields
    if (!category_name?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required',
        field: 'category_name'
      });
    }

    // Check if new name conflicts with other categories (excluding current one)
    const nameCheck = await client.query(
      'SELECT 1 FROM categories WHERE LOWER(category_name) = LOWER($1) AND category_id != $2',
      [category_name.trim(), id]
    );
    
    if (nameCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists',
        field: 'category_name'
      });
    }

    // Validate parent category if provided
    if (parent_category_id) {
      const parentCheck = await client.query(
        'SELECT 1 FROM categories WHERE category_id = $1',
        [parent_category_id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Parent category does not exist',
          field: 'parent_category_id'
        });
      }
    }

    const result = await client.query(
      `UPDATE categories SET
        category_name = $1,
        description = $2,
        parent_category_id = $3
       WHERE category_id = $4
       RETURNING *`,
      [
        category_name.trim(),
        description?.trim() || null,
        parent_category_id || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// Delete category
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Category.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }
    res.json({ 
      success: true,
      data: { message: 'Category deleted successfully' } 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete category' 
    });
  }
});


// ---------------------
// ✅ Public Booking
// ---------------------
// app.post('/api/appointments', async (req, res) => {
//   const { customer_first_name, customer_last_name, customer_phone, customer_email,
//     employee_id, service_id, appointment_date, branch_id } = req.body;

//   try {
//     const serviceResult = await pool.query('SELECT duration FROM services WHERE service_id = $1', [service_id]);
//     if (serviceResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Service not found' });
//     }

//     const duration = serviceResult.rows[0].duration;

//     const existing = await pool.query(
//       `SELECT * FROM appointments 
//        WHERE employee_id = $1 
//        AND appointment_date = $2
//        AND status != 'Cancelled'`,
//       [employee_id, appointment_date]
//     );

//     if (existing.rows.length > 0) {
//       return res.status(409).json({ error: 'Time slot already booked' });
//     }

//     const result = await pool.query(
//       `INSERT INTO appointments (
//         customer_first_name, customer_last_name, customer_phone, customer_email,
//         employee_id, service_id, appointment_date, duration, branch_id, status
//       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Booked') RETURNING *`,
//       [
//         customer_first_name,
//         customer_last_name,
//         customer_phone,
//         customer_email,
//         employee_id,
//         service_id,
//         appointment_date,
//         duration,
//         branch_id
//       ]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error('Error creating appointment:', error);
//     res.status(500).json({ error: 'Failed to create appointment' });
//   }
// });




// app.post('/api/pos/transactions', authenticateToken, async (req, res) => {
//   const { branch_id, cashier_id, total_amount, amount_tendered, change_amount, payment_method, items } = req.body;

//   try {
//     // Insert into pos_transactions
//     const transactionResult = await pool.query(
//       `INSERT INTO pos_transactions (branch_id, cashier_id, total_amount, amount_tendered, change_amount, payment_method)
//        VALUES ($1, $2, $3, $4, $5, $6) RETURNING transaction_id`,
//       [branch_id, cashier_id, total_amount, amount_tendered, change_amount, payment_method]
//     );

//     const transactionId = transactionResult.rows[0].transaction_id;

//     // Insert into pos_transaction_items
//     const itemPromises = items.map(item => {
//       return pool.query(
//         `INSERT INTO pos_transaction_items (transaction_id, product_id, quantity, price)
//          VALUES ($1, $2, $3, $4)`,
//         [transactionId, item.product_id, item.quantity, item.price]
//       );
//     });

//     await Promise.all(itemPromises);

//     res.status(201).json({ message: 'Transaction recorded successfully', transactionId });
//   } catch (error) {
//     console.error('Error recording transaction:', error);
//     res.status(500).json({ error: 'Failed to record transaction' });
//   }
// });










// Process POS transaction
app.post('/api/pos/transactions', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Create transaction
    const transactionQuery = `
      INSERT INTO pos_transactions (
        branch_id, cashier_id, customer_id,
        total_amount, amount_tendered, change_amount, payment_method, gcash_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const transactionResult = await client.query(transactionQuery, [
      req.body.branch_id,
      req.body.cashier_id,
      req.body.customer_id || null,
      req.body.total_amount,
      req.body.amount_tendered,
      req.body.change_amount,
      req.body.payment_method,
      req.body.gcash_reference
    ]);
    
    const transaction = transactionResult.rows[0];
    
    // 2. Add items and update inventory
    for (const item of req.body.items) {
      await client.query(
        `INSERT INTO pos_transaction_items (
          transaction_id, product_id, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          transaction.transaction_id,
          item.product_id,
          item.quantity,
          item.price,
          item.price * item.quantity
        ]
      );
      
      // Update inventory
      await client.query(
        `UPDATE branch_inventory
         SET quantity = quantity - $1
         WHERE branch_id = $2 AND product_id = $3`,
        [item.quantity, req.body.branch_id, item.product_id]
      );
      
      await client.query(
        `UPDATE stocks
         SET quantity = quantity - $1
         WHERE branch_id = $2 AND product_id = $3`,
        [item.quantity, req.body.branch_id, item.product_id]
      );

      // Record inventory movement
      await client.query(
        `INSERT INTO inventory_transactions (
          product_id, branch_id, transaction_type, quantity, created_by
        ) VALUES ($1, $2, 'Sale', $3, $4)`,
        [item.product_id, req.body.branch_id, item.quantity, req.body.cashier_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      transaction_id: transaction.transaction_id,
      receipt_number: transaction.receipt_number
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    res.status(500).json({ error: 'Failed to process transaction' });
  } finally {
    client.release();
  }
});

// Add to server.js
app.get('/api/pos/receipt/:transaction_id', authenticateToken, async (req, res) => {
  try {
    const { transaction_id } = req.params;
    
    const transactionResult = await pool.query(`
      SELECT 
        pt.*,
        b.branch_name, b.location as branch_address,
        u.first_name || ' ' || u.last_name as cashier_name,
        c.first_name || ' ' || c.last_name as customer_name
      FROM pos_transactions pt
      JOIN branches b ON pt.branch_id = b.branch_id
      JOIN users u ON pt.cashier_id = u.user_id
      LEFT JOIN customers c ON pt.customer_id = c.customer_id
      WHERE pt.transaction_id = $1
    `, [transaction_id]);
    
    const itemsResult = await pool.query(`
      SELECT 
        pti.*,
        p.product_name
      FROM pos_transaction_items pti
      JOIN products p ON pti.product_id = p.product_id
      WHERE pti.transaction_id = $1
    `, [transaction_id]);
    
    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({
      transaction: transactionResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
});


// Enhanced inventory check middleware
app.use('/api/pos/transactions', async (req, res, next) => {
  try {
    const items = req.body.items || [];
    const branchId = req.body.branch_id;
    
    const inventoryChecks = items.map(async item => {
      const result = await pool.query(
        `SELECT quantity FROM branch_inventory 
         WHERE branch_id = $1 AND product_id = $2`,
        [branchId, item.product_id]
      );
      
      if (result.rows.length === 0 || result.rows[0].quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ID ${item.product_id}`);
      }
    });

    await Promise.all(inventoryChecks);
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//ATTENDANCE

app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
      cb(null, `${req.body.employeeId}_${Date.now()}${path.extname(file.originalname)}`);
    }
  });

  const descriptorCache = new Map();

  const upload = multer({ storage });


  const modelPath = path.join(__dirname, 'models');
  Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
    faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath)
  ])
  .then(() => {
    console.log("✅ Face-api models loaded");
    app.listen(PORT, () => {
      console.log(`Server is running on ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Error loading models:", err);
    process.exit(1);
  });

    // REGISTER
    app.post('/register', upload.single('faceImage'), async (req, res) => {
      const { userId: rawUserId, pin } = req.body;
      const faceImage = req.file;
    
      console.log("Received data:", { rawUserId, pin, faceImage });
    
      const userId = rawUserId?.trim();
      
      console.log("Attempting registration for userId:", userId);
    
      if (!userId || !pin || !faceImage) {
        console.log("Missing data:", { userId, pin, faceImage });
        return res.status(400).json({ error: 'User ID, PIN, and face image are required' });
      }
    
      try {
        const userResult = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [userId]);
        console.log("Employee lookup result:", userResult.rows.length);
    
        if (userResult.rows.length === 0) {
          console.log(`User ${userId} not found in the employees table`);
          return res.status(404).json({ error: 'User ID not found. Please contact admin.' });
        }
    
        const credsResult = await pool.query('SELECT * FROM employee_credentials WHERE employee_user_id = $1', [userId]);
        console.log("Credentials lookup result:", credsResult.rows.length);
    
        if (credsResult.rows.length > 0) {
          console.log(`Existing credentials for userId ${userId}:`, credsResult.rows);
          return res.status(400).json({ error: 'Credentials already registered for this user.' });
        }
    
        const hashedPin = await bcryptjs.hash(pin, 10);
        console.log("Hashed PIN for user:", userId);
    
        await pool.query(
          'INSERT INTO employee_credentials (employee_user_id, pin_hash, face_image_path) VALUES ($1, $2, $3)',
          [userId, hashedPin, faceImage.path]
        );
    
        console.log("Registration successful for userId:", userId);
        return res.status(200).json({ message: 'Registration successful' });
    
      } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });  

  // CREDENTIALS
  app.post("/check-credentials", async (req, res) => {
    const { userId } = req.body;
  
    try {
      const userResult = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [userId]);
  
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Employee ID not found. Please contact admin.' });
      }
  
      const credsResult = await pool.query('SELECT * FROM employee_credentials WHERE employee_user_id = $1', [userId]);
  
      if (credsResult.rows.length > 0) {
        return res.status(400).json({ error: 'Credentials already registered for this user.' });
      }
  
      return res.status(200).json({ message: 'Valid user.' });
    } catch (err) {
      console.error("Check-credentials error:", err);
      return res.status(500).json({ error: 'Server error. Try again later.' });
    }
  });

  // LOGIN
  app.post("/login", async (req, res) => {
    const { employeeId, pin } = req.body;
  
    if (!employeeId || !pin) {
      return res.status(400).json({ success: false, error: "Employee ID and PIN are required" });
    }
  
    try {
      const result = await pool.query(
        `SELECT c.employee_user_id, c.pin_hash, e.first_name
         FROM employee_credentials c
         JOIN employees e ON c.employee_user_id = e.employee_id
         WHERE c.employee_user_id = $1`,
        [employeeId]
      );
  
      if (result.rows.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid Employee ID or PIN" });
      }
  
      const { employee_user_id, pin_hash, first_name } = result.rows[0];
  
      const isPinValid = await bcryptjs.compare(pin, pin_hash);
  
      if (!isPinValid) {
        return res.status(400).json({ success: false, error: "Invalid Employee ID or PIN" });
      }
  
      return res.json({
        success: true,
        message: "Login successful",
        employeeId: employee_user_id,
        firstName: first_name,
      });
    } catch (err) {
      console.error("Error during login:", err);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  

  // FACE VERIFICATION
  app.post("/verify-face", async (req, res) => {
    const { employeeId, pin, imageData } = req.body;

    if (!employeeId || !pin || !imageData) {
      return res.status(400).json({ success: false, error: "Missing required data" });
    }

    try {

      const result = await pool.query('SELECT * FROM employee_credentials WHERE employee_user_id = $1', [employeeId]);

      if (result.rows.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid Employee ID or PIN" });
      }

      const employee = result.rows[0];

      const isPinValid = await bcryptjs.compare(pin, employee.pin_hash);

      if (!isPinValid) {
        return res.status(400).json({ success: false, error: "Invalid Employee ID or PIN" });
      }

      let referenceDescriptor;
      if (descriptorCache.has(employeeId)) {
        referenceDescriptor = descriptorCache.get(employeeId);
      } else {
        const referenceFacePath = path.resolve(__dirname, employee.face_image_path);

        console.time("load-ref");
        const refImage = await canvas.loadImage(referenceFacePath);
        console.timeEnd("load-ref");

        console.time("detect-ref");
        const refFace = await faceapi
          .detectSingleFace(refImage)
          .withFaceLandmarks()
          .withFaceDescriptor();
        console.timeEnd("detect-ref");

        if (!refFace?.descriptor) {
          return res.status(400).json({ success: false, error: "No face in reference image" });
        }

        referenceDescriptor = refFace.descriptor;
        descriptorCache.set(employeeId, referenceDescriptor);
      }

      const buffer = Buffer.from(imageData.split(",")[1], "base64");
      console.time("sharp");
      const resizedBuffer = await sharp(buffer)
        .resize({ width: 160 })
        .grayscale()
        .jpeg({ quality: 70 })
        .toBuffer();
      console.timeEnd("sharp");      

      console.time("detect-uploaded");
      const uploadedImage = await canvas.loadImage(resizedBuffer);
      const uploadedFace = await faceapi
        .detectSingleFace(
          uploadedImage,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 256,
            scoreThreshold: 0.5,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
      console.timeEnd("detect-uploaded");

      if (!uploadedFace?.descriptor) {
        return res.status(400).json({ success: false, error: "No face detected in uploaded image" });
      }

      const distance = faceapi.euclideanDistance(referenceDescriptor, uploadedFace.descriptor);

      if (distance < 0.5) {
        return res.json({ success: true, message: "Face verification successful" });
      } else {
        return res.status(400).json({ success: false, error: "Face verification failed" });
      }
    } catch (err) {
      console.error("Face verification error:", err);
      return res.status(500).json({ success: false, error: "Internal server error during verification" });
    }
  });

  async function getEmployeeId(userId) {
    const res = await pool.query(
      'SELECT employee_id FROM employees WHERE employee_id = $1', 
      [userId]
    );
    return res.rows[0]?.employee_id;
  }

// TIME IN
app.post('/api/timein', async (req, res) => {
  const { employeeId: userId } = req.body;

  // Validate input
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Employee ID is required',
      code: 'MISSING_EMPLOYEE_ID'
    });
  }

  try {
    const employeeId = Number(userId);
    
    // Verify employee exists
    const empRes = await pool.query(
      'SELECT employee_id, first_name FROM employees WHERE employee_id = $1',
      [employeeId]
    );

    if (empRes.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found in system',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    const employeeName = empRes.rows[0].first_name;

    // Check for existing time-in without time-out
    const existingTimeIn = await pool.query(
      `SELECT * FROM attendance 
       WHERE employee_id = $1 
       AND date = CURRENT_DATE 
       AND time_out IS NULL
       ORDER BY time_in DESC
       LIMIT 1`,
      [employeeId]
    );

    if (existingTimeIn.rows.length > 0) {
      // Return current status along with error
      const currentRecord = existingTimeIn.rows[0];
      return res.status(200).json({
        success: false,
        error: `${employeeName} is already clocked in since ${currentRecord.time_in}`,
        code: 'ALREADY_CLOCKED_IN',
        currentStatus: {
          isClockedIn: true,
          timeIn: currentRecord.time_in,
          date: currentRecord.date
        }
      });
    }

    // Record new time-in
    const insertRes = await pool.query(
      `INSERT INTO attendance (employee_id, time_in, date) 
       VALUES ($1, NOW(), CURRENT_DATE) 
       RETURNING *`,
      [employeeId]
    );

    if (insertRes.rows.length > 0) {
      const newRecord = insertRes.rows[0];
      return res.json({ 
        success: true, 
        message: `${employeeName} successfully clocked in at ${newRecord.time_in}`,
        record: {
          timeIn: newRecord.time_in,
          date: newRecord.date
        }
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create time-in record',
        code: 'INSERT_FAILED'
      });
    }
  } catch (err) {
    console.error('Time In error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
    
// TIME OUT
app.post('/api/timeout', async (req, res) => {
  const { employeeId: userId } = req.body;
  const currentDate = new Date().toLocaleDateString('en-CA'); // outputs 'YYYY-MM-DD'
  const currentTimestamp = new Date();

  try {
    const empCheck = await pool.query(
      'SELECT employee_id FROM employees WHERE employee_id = $1', 
      [userId]
    );

    if (empCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employeeId = empCheck.rows[0].employee_id;

    const result = await pool.query(
      `UPDATE attendance 
       SET time_out = $1 
       WHERE employee_id = $2 
         AND date = $3
         AND time_out IS NULL
       RETURNING *`,
      [currentTimestamp, employeeId, currentDate]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active clock-in found for today' 
      });
    }

    res.json({ success: true, message: 'Successfully Clocked Out' });
  } catch (err) {
    console.error('Timeout error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Database error during timeout',
      error: err.message
    });
  }
});
  
  // CLOCK STATUS
app.post('/api/getClockStatus', async (req, res) => {
  const { employeeId: userId } = req.body;  
  const currentDate = new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD


  try {
    const employeeResult = await pool.query(
      `SELECT employee_id FROM employees WHERE employee_id = $1`,
      [userId]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const employeeId = employeeResult.rows[0].employee_id;  

    const attendanceResult = await pool.query(
      `SELECT a.* 
       FROM attendance a
       JOIN employees e ON a.employee_id = e.employee_id
       WHERE a.employee_id = $1
         AND a.date = $2
         AND a.time_out IS NULL`,
      [employeeId, currentDate]
    );

    // DEBUG LOGS
    console.log('Clock status check:');
    console.log('Current Date:', currentDate);
    console.log('Employee ID:', employeeId);
    console.log('Attendance Result:', attendanceResult.rows);

    res.json({ isClockedIn: attendanceResult.rows.length > 0 });

  } catch (err) {
    console.error('Clock status error:', err);
    res.status(500).json({ error: 'Failed to check clock status' });
  }
});

  
// ---------------------
// ✅ HRM
// ---------------------
app.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM employees WHERE is_active = TRUE AND branch_id IS NOT NULL ORDER BY employee_id"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});



app.post("/employees", async (req, res) => {
  const {
    employee_id,
    first_name,
    last_name,
    role_id, // passed from frontend
    hire_date,
    base_salary,
    branch_id,
    birth_date
  } = req.body;

  try {
    // Check for existing employee
    const existingEmployee = await pool.query(
      "SELECT * FROM employees WHERE employee_id = $1",
      [employee_id]
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(400).json({ error: "Employee ID already exists" });
    }

    // Get role_name from roles table
    const roleResult = await pool.query(
      "SELECT role_name FROM roles WHERE role_id = $1",
      [role_id]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid role ID" });
    }

    const position = roleResult.rows[0].role_name;

    // Insert into employees table
    const result = await pool.query(
      `INSERT INTO employees 
        (employee_id, first_name, last_name, position, hire_date, base_salary, branch_id, birth_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [employee_id, first_name, last_name, position, hire_date, base_salary, branch_id, birth_date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ error: "Failed to add employee, please try again" });
  }
});

app.get("/roles", async (req, res) => {
  try {
    const result = await pool.query("SELECT role_id, role_name FROM roles");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// Edit employee
app.put("/employees/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, role_id, hire_date, base_salary, branch_id, birth_date } = req.body;
  
  try {
    // You can fetch the role name if you want to still use it for some reason (optional)
    const roleResult = await pool.query(
      "SELECT role_name FROM roles WHERE role_id = $1", 
      [role_id]
    );
    
    const role_name = roleResult.rows[0]?.role_name; // This step is optional, if you want the role name

    // Update query using role_id
    await pool.query(
      "UPDATE employees SET first_name = $1, last_name = $2, position = $3, hire_date = $4, base_salary = $5, branch_id = $6, birth_date = $7 WHERE employee_id = $8",
      [first_name, last_name, role_name, hire_date, base_salary, branch_id, birth_date, id]
    );
    
    res.json({ message: "Employee updated successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// Archive employee
app.put("/employees/:id/archive", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE employees SET is_active = FALSE WHERE employee_id = $1", [id]);
    res.send("Employee archived successfully");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

app.post('/payroll/generate', async (req, res) => {
  const { cutoff_start, cutoff_end, payroll_date, branch_id } = req.body;

  try {
    // Step 1: Check if payroll for this cutoff and branch has already been generated
    const existing = await pool.query(
      `SELECT 1 FROM payroll p
       JOIN employees e ON p.employee_id = e.employee_id
       WHERE p.cutoff_start = $1 AND p.cutoff_end = $2 AND e.branch_id = $3
       LIMIT 1`,
      [cutoff_start, cutoff_end, branch_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Payroll for this branch and cutoff period has already been generated.',
      });
    }

    // Step 2: Check if there is attendance data for the given cutoff period and branch
    const attendanceCheck = await pool.query(
      `SELECT 1 FROM attendance a
       JOIN employees e ON a.employee_id = e.employee_id
       WHERE a.date BETWEEN $1 AND $2 AND e.branch_id = $3
       LIMIT 1`,
      [cutoff_start, cutoff_end, branch_id]
    );

    if (attendanceCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'No attendance records found for this branch and cutoff period.',
      });
    }
    const working_days = computeWorkingDays(cutoff_start, cutoff_end); // Assuming you have this helper

    const query = `
      WITH attendance_data AS (
        SELECT 
          a.employee_id,
          COUNT(DISTINCT a.date) AS days_worked,
          SUM(
            CASE 
              WHEN a.time_in::time > '09:15:00'::time THEN
                EXTRACT(EPOCH FROM (a.time_in::time - '09:15:00'::time)) / 60
              ELSE 0
            END
          ) AS deductions
        FROM attendance a
        WHERE a.date BETWEEN $1 AND $2
        GROUP BY a.employee_id
      ),
      payroll_data AS (
        SELECT
          e.employee_id,
          e.branch_id,
          e.first_name || ' ' || e.last_name AS full_name,
          e.base_salary,
          COALESCE(ad.deductions, 0) AS deductions,
          $3::date AS payroll_date,
          $4::int AS working_days,
          COALESCE(ad.days_worked, 0) AS days_worked,
          e.base_salary * COALESCE(ad.days_worked, 0) / $4 AS gross_pay,
          e.base_salary * COALESCE(ad.days_worked, 0) / $4 - COALESCE(ad.deductions, 0) AS net_pay
        FROM employees e
        LEFT JOIN attendance_data ad ON e.employee_id = ad.employee_id
        WHERE e.base_salary IS NOT NULL AND e.branch_id = $5
      ),
      inserted AS (
        INSERT INTO payroll (
          employee_id, payroll_date, gross_pay, net_pay,
          working_days, days_worked, deductions,
          cutoff_start, cutoff_end, branch_id 
        )
        SELECT 
          employee_id, payroll_date, gross_pay, net_pay,
          working_days, days_worked, deductions,
          $1, $2, branch_id 
        FROM payroll_data
        RETURNING *
      )
      SELECT 
        i.*, 
        p.full_name, 
        p.base_salary 
      FROM inserted i
      JOIN payroll_data p ON i.employee_id = p.employee_id;
    `;

    const result = await pool.query(query, [cutoff_start, cutoff_end, payroll_date, working_days, branch_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/payroll/view', async (req, res) => {
  const { cutoff_start, cutoff_end, branch_id } = req.query;

  console.log('Received cutoff_start:', cutoff_start);
  console.log('Received cutoff_end:', cutoff_end);
  console.log('Received branch_id:', branch_id);

  try {
    const query = `
      SELECT 
        p.*, 
        e.first_name || ' ' || e.last_name AS full_name,
        e.base_salary
      FROM payroll p
      JOIN employees e ON p.employee_id = e.employee_id
      WHERE p.cutoff_start = $1 AND p.cutoff_end = $2 AND p.branch_id = $3
      ORDER BY p.employee_id;
    `;

    console.log('Executing query:', query);

    const result = await pool.query(query, [cutoff_start, cutoff_end, branch_id]);

    console.log('Query result:', result.rows);

    res.json({
      message: 'Payroll data retrieved successfully',
      payroll: result.rows,
    });
  } catch (error) {
    console.error('Error retrieving payroll:', error);
    res.status(500).json({ error: 'Failed to retrieve payroll data' });
  }
});




app.post('/api/payroll/mark-paid', async (req, res) => {
  const { employee_id } = req.body; // Extract employee_id from request body

  // Ensure that the employee_id is provided
  if (!employee_id) {
    return res.status(400).json({ error: 'Employee ID is required.' });
  }

  try {
    // Query to get employee first name and last name
    const employeeResult = await pool.query(
      `SELECT first_name, last_name FROM employees WHERE employee_id = $1`,
      [employee_id]
    );

    // If employee not found, return error
    if (employeeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const { first_name, last_name } = employeeResult.rows[0];

    // Query to update the status to "Paid" for the latest payroll based on cutoff_end (or payroll_date)
    const result = await pool.query(
      `UPDATE payroll
       SET status = 'True'
       WHERE employee_id = $1
       AND cutoff_end = (SELECT MAX(cutoff_end) 
                          FROM payroll 
                          WHERE employee_id = $1)`,
      [employee_id]
    );

    // Check if any rows were updated
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No payroll found for this employee to mark as paid.' });
    }

    // Send success message when update is successful
    res.json({
      message: 'Payroll marked as paid.',
      employee_name: `${first_name} ${last_name}`, // Include employee name
    });
  } catch (error) {
    console.error('Failed to mark payroll as paid:', error);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

app.get("/api/attendance", async (req, res) => {
  const { branch_id } = req.query;

  try {
    let query = `
      SELECT 
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        a.date,
        a.time_in,
        a.time_out,
        b.branch_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.employee_id
      JOIN branches b ON e.branch_id = b.branch_id
    `;

    const values = [];

    if (branch_id && branch_id !== "All") {
      query +=  `WHERE b.branch_id = $1`;
      values.push(branch_id);
    }

    query +=  `ORDER BY a.date DESC, a.time_in ASC`;

    const attendanceLogs = await pool.query(query, values);
    res.json(attendanceLogs.rows);  // Send the modified response
  } catch (err) {
    console.error("Error fetching attendance logs:", err.message);
    res.status(500).send("Server Error");
  }
});


// ---------------------
// ✅ FINANCE
// ---------------------
app.get('/api/revenue/pos_transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pos_transactions');
    res.json(result.rows);  // Return the queried rows as JSON
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});


app.post('/api/generate-revenue', async (req, res) => {
  const { branch_id, month } = req.body;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM format.' });
  }

  try {
    const startDate = `${month}-01`;
    const endDate = new Date(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth() + 1,
      1
    ).toISOString().slice(0, 10); // First day of next month for exclusive comparison

    // Check for duplicate summary
    const checkQuery = `
      SELECT 1 
      FROM revenue_summary
      WHERE branch_id = $1 
        AND TO_CHAR(date, 'YYYY-MM') = $2
      LIMIT 1;
    `;
    const checkResult = await pool.query(checkQuery, [branch_id, month]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Revenue summary already exists for this month and branch.' });
    }

    // Insert new revenue summary
    const insertQuery = `
      INSERT INTO revenue_summary (branch_id, date, total_sales)
      SELECT $1, $4::date, SUM(total_amount)
      FROM pos_transactions
      WHERE branch_id = $1 
        AND transaction_date >= $2::date
        AND transaction_date < $3::date
      GROUP BY branch_id
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [branch_id, startDate, endDate, startDate]);

    if (result.rowCount === 0) {
      return res.status(200).json({ total_sales: 0, message: 'No transactions found for this branch and month.' });
    }

    res.status(200).json({ total_sales: result.rows[0].total_sales });
  } catch (err) {
    console.error('Error generating revenue summary:', err);
    res.status(500).json({ error: 'Error generating revenue summary' });
  }
});




app.get('/api/revenue/pos_transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pos_transactions');
    res.json(result.rows);  // Return the queried rows as JSON
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});


app.get('/api/revenue-summary', async (req, res) => {
  const { branch_id, month } = req.query;

  try {
    // Build the query
    let query = `SELECT * FROM revenue_summary`;
    const queryParams = [];

    if (branch_id) {
      query += ` WHERE branch_id = $1`;
      queryParams.push(branch_id);
    }

    if (month) {
      query += queryParams.length ? ` AND TO_CHAR(date, 'YYYY-MM') = $2` : ` WHERE TO_CHAR(date, 'YYYY-MM') = $1`;
      queryParams.push(month);
    }

    // Execute the query
    const result = await pool.query(query, queryParams);

    // Return the results
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching revenue summary:', err);
    res.status(500).json({ error: 'Error fetching revenue summary' });
  }
});


app.post("/api/expense-summary", async (req, res) => {
  const {
    branch_id,
    year,
    month,
    rent,
    internet,
    payroll_expense,
    supplies,
    water,
    electricity
  } = req.body;

  if (
    !branch_id || !year || !month ||
    rent === undefined || internet === undefined || payroll_expense === undefined ||
    supplies === undefined || water === undefined || electricity === undefined
  ) {
    return res.status(400).json({
      error: "branch_id, year, month, rent, internet, payroll_expense, supplies, water, and electricity are required"
    });
  }

  try {
    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10);

    // Check for duplicate entry
    const checkQuery = `
      SELECT 1 FROM expense_summary
      WHERE branch_id = $1 AND year = $2 AND month = $3
      LIMIT 1;
    `;
    const checkResult = await pool.query(checkQuery, [branch_id, parsedYear, parsedMonth]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        error: "Expense summary already exists for this branch and month."
      });
    }

    // Convert to numbers
    const rentNum = Number(rent);
    const internetNum = Number(internet);
    const payrollNum = Number(payroll_expense);
    const suppliesNum = Number(supplies);
    const waterNum = Number(water);
    const electricityNum = Number(electricity);

    const total_expense = rentNum + internetNum + payrollNum + suppliesNum + waterNum + electricityNum;

    // Insert into table
    const result = await pool.query(
      `INSERT INTO expense_summary 
        (branch_id, year, month, rent, internet, payroll_expense, supplies, water, electricity, total_expense, created_at, updated_at)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [
        branch_id,
        parsedYear,
        parsedMonth,
        rentNum,
        internetNum,
        payrollNum,
        suppliesNum,
        waterNum,
        electricityNum,
        total_expense
      ]
    );

    res.status(201).json({
      message: "Expense summary generated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error generating expense summary:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.get("/api/expense_summary", async (req, res) => {
  const { branch_id, sort_by = "year", order = "asc" } = req.query;

  // Whitelist of allowed sortable columns
  const sortableColumns = [
    "year", "month", "rent", "internet", "payroll_expense",
    "supplies", "water", "electricity", "total_expense", "created_at"
  ];

  // Basic input validation
  if (sort_by && !sortableColumns.includes(sort_by)) {
    return res.status(400).json({ error: "Invalid sort column." });
  }

  const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  try {
    let query = "SELECT * FROM expense_summary";
    const values = [];

    // Filter by branch_id if provided
    if (branch_id) {
      values.push(branch_id);
      query += ` WHERE branch_id = $1`;
    }

    // Add sorting
    query += ` ORDER BY ${sort_by} ${sortOrder}`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching expenses summary:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

//
app.get("/api/payroll/expense-summary", async (req, res) => {
  const { branch_id, year, month } = req.query;

  if (!branch_id || !year || !month) {
    return res.status(400).json({ error: "branch_id, year, and month are required" });
  }

  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(net_pay), 0) AS total_expense
      FROM payroll
      WHERE 
        EXTRACT(YEAR FROM payroll_date) = $1 AND 
        EXTRACT(MONTH FROM payroll_date) = $2 AND 
        branch_id = $3`,
      [year, month, branch_id]
    );

    res.json({
      total_expense: parseFloat(result.rows[0].total_expense),
    });
  } catch (err) {
    console.error("Error fetching payroll summary:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/recurring-expenses?branch_id=1
app.get("/api/recurring-expenses", async (req, res) => {
  const { branch_id } = req.query;

  if (!branch_id) {
    return res.status(400).json({ error: "branch_id is required" });
  }

  try {
    const result = await pool.query(
      `SELECT rent, internet FROM recurring_expenses WHERE branch_id = $1`,
      [branch_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No recurring expenses found for this branch." });
    }

    const { rent, internet } = result.rows[0];

    res.json({ rent, internet }); // ⬅️ returns both values separately
  } catch (error) {
    console.error("Error fetching recurring expenses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//RECURRING EXPENSES VIEW
app.get('/api/recurring_expenses/view', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        re.*, 
        b.branch_name 
      FROM recurring_expenses re
      LEFT JOIN branches b ON re.branch_id = b.branch_id
    `);
    res.status(200).json(result.rows); // Send back all records including branch_name
  } catch (error) {
    console.error('Error fetching recurring expenses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//RECURRING EXPENSES EDIT
app.put('/api/recurring_expenses/:id', async (req, res) => {
  const { id } = req.params;
  const { rent, internet } = req.body; // Assuming you want to update rent and internet

  try {
    const result = await pool.query(
      `UPDATE recurring_expenses
      SET rent = $1, internet = $2, updated_at = NOW()::TIMESTAMPTZ
      WHERE id = $3 RETURNING *`,
      [rent, internet, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(result.rows[0]); // Return the updated expense
  } catch (error) {
    console.error('Error updating recurring expense:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Revenue Summary Endpoint
app.get("/api/net/revenue-summary", async (req, res) => {
  const { branch, month, year } = req.query;

  try {
    // Query to sum up the total revenue for the given branch, month, and year
    const query = `
      SELECT SUM(total_sales) AS total_revenue
      FROM revenue_summary
      WHERE branch_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `;
    const result = await pool.query(query, [branch, month, year]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ total_revenue: 0 });
    }
  } catch (error) {
    console.error("Error fetching revenue summary", error);
    res.status(500).json({ error: "Failed to fetch revenue data." });
  }
});

// Expense Summary Endpoint
app.get("/api/net/expense-summary", async (req, res) => {
  const { branch, month, year } = req.query;

  try {
    // Query to sum up the total expenses for the given branch, month, and year
    const query = `
      SELECT SUM(total_expense) AS total_expense
      FROM expense_summary
      WHERE branch_id = $1 AND month = $2 AND year = $3
    `;
    const result = await pool.query(query, [branch, month, year]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ total_expense: 0 });
    }
  } catch (error) {
    console.error("Error fetching expense summary", error);
    res.status(500).json({ error: "Failed to fetch expense data." });
  }
});

// Calculate Net Income and Insert Endpoint
app.post("/api/generate-net-income", async (req, res) => {
  const { branch_id, month, year } = req.body;

  try {
    // Fetch revenue summary
    const revenueQuery = `
      SELECT SUM(total_sales) AS total_revenue
      FROM revenue_summary
      WHERE branch_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `;
    const revenueResult = await pool.query(revenueQuery, [branch_id, month, year]);
    const totalRevenue = revenueResult.rows.length > 0 ? revenueResult.rows[0].total_revenue : 0;

    // Fetch expense summary
    const expenseQuery = `
      SELECT SUM(total_expense) AS total_expense
      FROM expense_summary
      WHERE branch_id = $1 AND month = $2 AND year = $3
    `;
    const expenseResult = await pool.query(expenseQuery, [branch_id, month, year]);
    const totalExpense = expenseResult.rows.length > 0 ? expenseResult.rows[0].total_expense : 0;

    // Calculate net income
    const netIncome = totalRevenue - totalExpense;

    // Insert net income into the database
    const insertQuery = `
      INSERT INTO net_income (branch_id, month, year, net_income, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `;
    await pool.query(insertQuery, [branch_id, month, year, netIncome]);

    res.status(201).json({ message: "Net income successfully generated and inserted." });
  } catch (error) {
    console.error("Error generating or inserting net income", error);
    res.status(500).json({ error: "Failed to generate or insert net income." });
  }
});

// Net Income View Endpoint
app.get("/api/net-income/:branch/:month/:year", async (req, res) => {
  const { branch, month, year } = req.params;

  try {
    // Query to fetch total_sales from revenue_summary, total_expense from expense_summary, and branch_name
    const query = `
      SELECT rs.branch_id, b.branch_name, 
             EXTRACT(MONTH FROM rs.date) AS month,
             EXTRACT(YEAR FROM rs.date) AS year, 
             rs.total_sales, es.total_expense, 
             (rs.total_sales - es.total_expense) AS net_income
      FROM revenue_summary AS rs
      JOIN expense_summary AS es ON rs.branch_id = es.branch_id
      JOIN branches AS b ON rs.branch_id = b.branch_id
      WHERE rs.branch_id = $1 AND EXTRACT(MONTH FROM rs.date) = $2 AND EXTRACT(YEAR FROM rs.date) = $3
    `;
    
    // Execute the query
    const result = await pool.query(query, [branch, month, year]);

    if (result.rows.length > 0) {
      // Send the result as response
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "No data found for the given criteria" });
    }
  } catch (error) {
    console.error("Error fetching net income data", error);
    res.status(500).json({ error: "Failed to fetch net income data." });
  }
});

app.get("/api/employee-schedule", async (req, res) => {
  const { branch_id } = req.query;

  try {
    let query = 
      `SELECT 
        es.id,
        es.employee_id,
        es.day_of_week,
        es.start_time,
        es.end_time,
        es.is_available,
        e.first_name,
        e.last_name,
        b.branch_id,
        b.branch_name
      FROM employee_schedule es
      JOIN employees e ON es.employee_id = e.employee_id
      JOIN branches b ON e.branch_id = b.branch_id`
    ;

    const queryParams = [];

    // Add filtering by branch_id if provided
    if (branch_id) {
      query += " WHERE b.branch_id = $1";
      queryParams.push(branch_id);
    }

    query += " ORDER BY e.first_name, es.day_of_week";

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching schedules:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// PUT to update a schedule entry
app.put("/api/employee-schedule/:id", async (req, res) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time, is_available } = req.body;

  try {
    await pool.query(
      `UPDATE employee_schedule 
       SET day_of_week = $1, start_time = $2, end_time = $3, is_available = $4 
       WHERE id = $5`,
      [day_of_week, start_time, end_time, is_available, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Error updating schedule:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ---------------------
// ✅ Start Server
// ---------------------
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });


