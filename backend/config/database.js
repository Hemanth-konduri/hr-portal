const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`MySQL Connected: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    conn.release();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
