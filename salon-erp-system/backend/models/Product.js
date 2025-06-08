const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

class Product {
  static async create(productData) {
    const { product_name, description, category_id, branch_id, reorder_level = 10, is_active = true } = productData;
  
    if (!product_name) throw new Error('Product name is required');
    if (!branch_id) throw new Error('Branch ID is required');
  
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      // First try normal insert
      try {
        const query = `
          INSERT INTO products (
            product_name, description, category_id, 
            branch_id, reorder_level, is_active
          ) 
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const values = [
          product_name.trim(),
          description?.trim() || null,
          category_id || null,
          branch_id,
          reorder_level,
          is_active
        ];
  
        const { rows } = await client.query(query, values);
        await client.query('COMMIT');
        return rows[0];
      } catch (err) {
        if (err.code === '23505') { // Unique violation
          // Reset sequence and try again
          await client.query('SELECT setval(\'products_product_id_seq\', (SELECT MAX(product_id) FROM products) + 1)');
          
          const retryQuery = `
            INSERT INTO products (
              product_name, description, category_id, 
              branch_id, reorder_level, is_active
            ) 
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          
          const { rows } = await client.query(retryQuery, values);
          await client.query('COMMIT');
          return rows[0];
        }
        throw err;
      }
    } catch (err) {
      await client.query('ROLLBACK');
      
      if (err.code === '23503') {
        if (err.constraint === 'fk_products_branches') {
          throw new Error('Invalid branch ID: Branch does not exist');
        }
        if (err.constraint === 'products_category_id_fkey') {
          throw new Error('Invalid category ID: Category does not exist');
        }
      }
      throw err;
    } finally {
      client.release();
    }
  }

  static async getAll(branch_id = null) {
    let query = `
      SELECT 
        p.*,
        c.category_name,
        b.branch_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN branches b ON p.branch_id = b.branch_id
    `;
  
    const values = [];
    if (branch_id) {
      query += ' WHERE p.branch_id = $1';
      values.push(branch_id);
    }
  
    query += ' ORDER BY p.product_name';
    
    try {
      const { rows } = await pool.query(query, values);
      return rows;
    } catch (err) {
      console.error('Database error in Product.getAll:', err);
      throw err;
    }
  }

  static async getById(product_id) {
    const { rows } = await pool.query(`
      SELECT 
        p.*,
        c.category_name,
        b.branch_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN branches b ON p.branch_id = b.branch_id
      WHERE p.product_id = $1
    `, [product_id]);

    return rows[0] || null;
  }

  static async update(product_id, updateData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      console.log('Attempting to update product:', product_id, 'with data:', updateData);
  
      // Dynamic query building
      const setClauses = [];
      const values = [];
      let paramIndex = 1;
  
      // Add each field that exists in updateData
      const fields = ['product_name', 'description', 'category_id', 'branch_id', 'reorder_level', 'is_active'];
      fields.forEach(field => {
        if (updateData[field] !== undefined) {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(updateData[field]);
          paramIndex++;
        }
      });
  
      if (setClauses.length === 0) {
        throw new Error('No valid fields provided for update');
      }
  
      values.push(product_id);
      const setClause = setClauses.join(', ');
  
      const query = `
        UPDATE products
        SET ${setClause}, updated_at = NOW()
        WHERE product_id = $${paramIndex}
        RETURNING *
      `;
  
      console.log('Executing query:', query);
      console.log('With values:', values);
  
      const { rows } = await client.query(query, values);
  
      if (!rows[0]) {
        throw new Error('Product not found');
      }
  
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Database update error:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        constraint: err.constraint,
        stack: err.stack
      });
      throw err;
    } finally {
      client.release();
    }
  }

  static async delete(product_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: inventoryRows } = await client.query(
        'SELECT 1 FROM branch_inventory WHERE product_id = $1 LIMIT 1',
        [product_id]
      );

      const { rows: salesRows } = await client.query(
        'SELECT 1 FROM sale_items WHERE product_id = $1 LIMIT 1',
        [product_id]
      );

      if (inventoryRows.length > 0 || salesRows.length > 0) {
        throw new Error('Cannot delete: Product has inventory or sales records');
      }

      const { rowCount } = await client.query(
        'DELETE FROM products WHERE product_id = $1',
        [product_id]
      );

      await client.query('COMMIT');
      return rowCount > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = Product;