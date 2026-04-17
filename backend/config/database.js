const mysql = require('mysql2/promise');

const dbConfig = process.env.DATABASE_URL
  ? { uri: process.env.DATABASE_URL, waitForConnections: true, connectionLimit: 10 }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    };

const pool = mysql.createPool(dbConfig);

const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL Connected');
    conn.release();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
