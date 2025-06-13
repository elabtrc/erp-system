const express = require('express');
const router = express.Router();
const pool = require('../db'); // Make sure this is your database connection
const Product = require('../models/Product');


// Get products with inventory
router.get('/with-inventory', async (req, res) => {
  try {
    const { branch_id } = req.query;
    let is_active = req.query.is_active;

    if (is_active === 'true') is_active = true;
    else if (is_active === 'false') is_active = false;
    else is_active = null;

    const result = await pool.query(
      `SELECT 
         p.product_id,
         p.product_name,
         p.description,
         p.price,
         c.category_name,
         bi.quantity,
         bi.branch_id
       FROM products p
       JOIN branch_inventory bi ON bi.product_id = p.product_id AND bi.branch_id = $1
       LEFT JOIN categories c ON p.category_id = c.category_id
       WHERE ($2::boolean IS NULL OR p.is_active = $2::boolean)
       ORDER BY p.product_name`,
      [branch_id, is_active]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching products with inventory:', error);
    res.status(500).json({ error: 'Failed to fetch products with inventory' });
  }
});




router.post('/', async (req, res) => {
  try {
    // Validation
    if (!req.body.product_name) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    if (!req.body.branch_id) {
      return res.status(400).json({
        success: false,
        message: 'Branch is required'
      });
    }

    const productData = {
      product_name: req.body.product_name,
      description: req.body.description,
      category_id: req.body.category_id,
      branch_id: req.body.branch_id,
      reorder_level: req.body.reorder_level,
      is_active: req.body.is_active
    };

    const newProduct = await Product.create(productData);
    
    res.status(201).json({
      success: true,
      data: newProduct
    });

  } catch (err) {
    console.error('Error creating product:', err);

    // Handle foreign key violations
    if (err.code === '23503') {
      if (err.constraint === 'fk_products_branches') {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch ID'
        });
      }
      if (err.constraint === 'products_category_id_fkey') {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;