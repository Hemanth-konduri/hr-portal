const { pool } = require('../config/database');
const fs = require('fs');

// Upsert Salary Structure
const setSalaryStructure = async (req, res) => {
  try {
    const { user_id, basic, hra, allowances, effective_from } = req.body;
    const [existing] = await pool.query('SELECT id FROM salary_structure WHERE user_id = ?', [user_id]);
    if (existing.length) {
      await pool.query(
        'UPDATE salary_structure SET basic = ?, hra = ?, allowances = ?, effective_from = ? WHERE user_id = ?',
        [basic, hra, allowances, effective_from, user_id]
      );
      return res.json({ msg: 'Salary structure updated' });
    }
    await pool.query(
      'INSERT INTO salary_structure (user_id, basic, hra, allowances, effective_from) VALUES (?, ?, ?, ?, ?)',
      [user_id, basic, hra, allowances, effective_from]
    );
    res.json({ msg: 'Salary structure created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getSalaryStructure = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM salary_structure WHERE user_id = ?', [req.params.user_id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// All employees with their salary structure
const getAllSalaryStructures = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.full_name, u.employee_id, u.department_id,
             d.name AS department, u.position,
             s.basic, s.hra, s.allowances, s.gross_salary, s.effective_from
      FROM users u
      LEFT JOIN salary_structure s ON u.id = s.user_id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'employee' AND u.status = 'active'
      ORDER BY u.full_name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Payroll summary stats
const getPayrollStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();
    const [stats] = await pool.query(`
      SELECT
        COUNT(DISTINCT p.user_id)        AS employees_paid,
        COALESCE(SUM(p.gross_salary), 0) AS total_gross,
        COALESCE(SUM(p.lop_deduction), 0) AS total_deductions,
        COALESCE(SUM(p.net_salary), 0)   AS total_net,
        COALESCE(SUM(p.lop_days), 0)     AS total_lop_days
      FROM payslips p
      WHERE p.month = ? AND p.year = ?
    `, [m, y]);
    const [structCount] = await pool.query(
      `SELECT COUNT(*) AS total FROM salary_structure`
    );
    res.json({ ...stats[0], total_structured: structCount[0].total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const generatePayslip = async (req, res) => {
  try {
    const { user_id, month, year } = req.body;
    const [salary] = await pool.query(
      'SELECT basic, hra, allowances, gross_salary FROM salary_structure WHERE user_id = ?',
      [user_id]
    );
    if (!salary.length) {
      return res.status(400).json({ msg: 'Salary structure not found for this employee' });
    }
    const gross_salary = Number(salary[0].gross_salary);
    const perDaySalary = gross_salary / 30;
    const [attendance] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN status = 'half_day' THEN 0.5 ELSE 1 END), 0) AS lop_days
       FROM attendance
       WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
         AND (status = 'lop' OR status = 'half_day')`,
      [user_id, month, year]
    );
    const lop_days = Number(attendance[0].lop_days) || 0;
    const lop_deduction = parseFloat((lop_days * perDaySalary).toFixed(2));
    const net_salary    = parseFloat((gross_salary - lop_deduction).toFixed(2));
    const file_path     = req.file ? `/uploads/payslips/${req.file.filename}` : null;

    await pool.query(
      `INSERT INTO payslips (user_id, month, year, gross_salary, lop_days, lop_deduction, net_salary, file_path, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         gross_salary=VALUES(gross_salary), lop_days=VALUES(lop_days),
         lop_deduction=VALUES(lop_deduction), net_salary=VALUES(net_salary),
         file_path=COALESCE(VALUES(file_path), file_path), uploaded_by=VALUES(uploaded_by)`,
      [user_id, month, year, gross_salary, lop_days, lop_deduction, net_salary, file_path, req.user.id]
    );
    res.json({ msg: 'Payslip generated successfully', lop_days, gross_salary, lop_deduction, net_salary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getMyPayslips = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.basic, s.hra, s.allowances
       FROM payslips p
       LEFT JOIN salary_structure s ON p.user_id = s.user_id
       WHERE p.user_id = ? ORDER BY p.year DESC, p.month DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllPayslips = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = `
      SELECT p.*, u.full_name, u.employee_id, d.name AS department
      FROM payslips p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (month) { query += ' AND p.month = ?'; params.push(month); }
    if (year)  { query += ' AND p.year = ?';  params.push(year); }
    query += ' ORDER BY p.year DESC, p.month DESC, u.full_name';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const deletePayslip = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT file_path FROM payslips WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ msg: 'Payslip not found' });
    if (rows[0].file_path) {
      const abs = require('path').join(__dirname, '..', rows[0].file_path);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    }
    await pool.query('DELETE FROM payslips WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Payslip deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  setSalaryStructure, getSalaryStructure, getAllSalaryStructures,
  getPayrollStats, generatePayslip, getMyPayslips, getAllPayslips, deletePayslip,
};
