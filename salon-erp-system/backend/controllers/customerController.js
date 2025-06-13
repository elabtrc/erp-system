const pool = require('../../backend/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO customers (first_name, last_name, email, phone, password)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [first_name, last_name, email, phone, hashedPassword]
    );

    const customer = result.rows[0];
    const token = jwt.sign(
      { id: customer.customer_id, type: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      customer: {
        customer_id: customer.customer_id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
      const customer = result.rows[0];
  
      if (!customer) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const token = jwt.sign(
        { id: customer.customer_id, type: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.json({
        token,
        customer: {
          customer_id: customer.customer_id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Login failed' });
    }
  };

  exports.updateProfile = async (req, res) => {
    const { customer_id } = req.params;
    const { first_name, last_name, phone, email } = req.body;
  
    try {
      const result = await pool.query(
        `UPDATE customers
         SET first_name = $1, last_name = $2, phone = $3, email = $4
         WHERE customer_id = $5
         RETURNING *`,
        [first_name, last_name, phone, email, customer_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  };
  