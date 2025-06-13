const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

const validateDatabaseSchema = async (req, res, next) => {
  try {
    // Check if required columns exist
    const requiredColumns = [
      { table: 'services', column: 'service_name' },
      { table: 'pos_transactions', column: 'appointment_id' }
    ];
    
    for (const { table, column } of requiredColumns) {
      const result = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name = $2`,
        [table, column]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Column ${column} not found in table ${table}`);
      }
    }
    
    next();
  } catch (err) {
    console.error('Database validation failed:', err);
    res.status(500).json({ 
      success: false,
      message: 'Database configuration error',
      error: err.message
    });
  }
};

module.exports = validateDatabaseSchema;