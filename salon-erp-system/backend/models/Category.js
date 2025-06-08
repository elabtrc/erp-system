const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

class Category {
  /**
   * Create a new category
   * @param {object} categoryData - Category fields
   * @returns {Promise<object>} Created category
   */
  static async create(categoryData) {
    const { category_name, description, parent_category_id } = categoryData;
  
    if (!category_name) {
      throw new Error('Category name is required');
    }
  
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      // Check if parent category exists if provided
      if (parent_category_id) {
        const parentCheck = await client.query(
          'SELECT 1 FROM categories WHERE category_id = $1', 
          [parent_category_id]
        );
        if (parentCheck.rows.length === 0) {
          throw new Error('Parent category does not exist');
        }
      }
  
      const query = `
        INSERT INTO categories (
          category_name, description, parent_category_id
        ) VALUES ($1, $2, $3)
        RETURNING *
      `;
  
      const values = [
        category_name.trim(),
        description?.trim() || null,
        parent_category_id || null
      ];
  
      const { rows } = await client.query(query, values);
      await client.query('COMMIT');
      
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Database error in Category.create:', {
        message: err.message,
        code: err.code,
        constraint: err.constraint,
        detail: err.detail,
        query: err.query,
        stack: err.stack
      });
      
      // Convert specific database errors to more user-friendly messages
      if (err.code === '23503') { // Foreign key violation
        if (err.constraint === 'categories_parent_category_id_fkey') {
          throw new Error('Invalid parent category ID: Category does not exist');
        }
      }
      if (err.code === '23505') { // Unique violation
        if (err.constraint === 'categories_category_name_key') {
          throw new Error('Category name already exists');
        }
      }
      
      throw err;
    } finally {
      client.release();
    }
  }
  /**
   * Get all categories
   * @returns {Promise<Array>} List of categories
   */
  static async getAll() {
    const client = await pool.connect();
    try {
      console.log('Executing categories query');
      const { rows } = await client.query(`
        SELECT 
          c.category_id,
          c.category_name,
          c.description,
          c.parent_category_id,
          p.category_name AS parent_category_name
        FROM categories c
        LEFT JOIN categories p ON c.parent_category_id = p.category_id
        ORDER BY c.category_name
      `);
      console.log(`Found ${rows.length} categories`);
      return rows;
    } catch (err) {
      console.error('Database error in Category.getAll:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        query: err.query,
        stack: err.stack
      });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get category by ID
   * @param {number} category_id 
   * @returns {Promise<object|null>} Category details
   */
  static async getById(category_id) {
    try {
      const { rows } = await pool.query(`
        SELECT 
          c.*,
          p.category_name as parent_category_name
        FROM categories c
        LEFT JOIN categories p ON c.parent_category_id = p.category_id
        WHERE c.category_id = $1
      `, [category_id]);

      return rows[0] || null;
    } catch (err) {
      console.error('Database error in Category.getById:', err);
      throw err;
    }
  }

  /**
   * Update a category
   * @param {number} category_id 
   * @param {object} updateData - Fields to update
   * @returns {Promise<object>} Updated category
   */
  static async update(category_id, updateData) {
    const { category_name, description, parent_category_id } = updateData;

    if (!category_name && !description && !parent_category_id) {
      throw new Error('No valid fields provided for update');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      if (category_name) {
        setClauses.push(`category_name = $${paramIndex}`);
        values.push(category_name.trim());
        paramIndex++;
      }
      if (description !== undefined) {
        setClauses.push(`description = $${paramIndex}`);
        values.push(description?.trim() || null);
        paramIndex++;
      }
      if (parent_category_id !== undefined) {
        setClauses.push(`parent_category_id = $${paramIndex}`);
        values.push(parent_category_id || null);
        paramIndex++;
      }

      values.push(category_id);
      const setClause = setClauses.join(', ');

      const { rows } = await client.query(`
        UPDATE categories
        SET ${setClause}
        WHERE category_id = $${paramIndex}
        RETURNING *
      `, values);

      if (!rows[0]) throw new Error('Category not found');

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      
      if (err.code === '23503') {
        if (err.constraint === 'categories_parent_category_id_fkey') {
          throw new Error('Invalid parent category ID');
        }
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a category
   * @param {number} category_id 
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(category_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if category has products
      const { rows: productRows } = await client.query(
        'SELECT 1 FROM products WHERE category_id = $1 LIMIT 1',
        [category_id]
      );

      // Check if category has subcategories
      const { rows: subcategoryRows } = await client.query(
        'SELECT 1 FROM categories WHERE parent_category_id = $1 LIMIT 1',
        [category_id]
      );

      if (productRows.length > 0 || subcategoryRows.length > 0) {
        throw new Error('Cannot delete: Category has products or subcategories');
      }

      const { rowCount } = await client.query(
        'DELETE FROM categories WHERE category_id = $1',
        [category_id]
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

module.exports = Category;