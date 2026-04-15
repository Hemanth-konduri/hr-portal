const { pool } = require('../config/database');
const fs = require('fs');

// Create Salary Structure
const setSalaryStructure = async (req, res) => {
  try {
    const { user_id, basic, hra, allowances, effective_from } = req.body;
    
    const [existing] = await pool.query('SELECT id FROM salary_structure WHERE user_id = ?', [user_id]);
    
    if (existing.length) {
      // Update
      await pool.query(
        'UPDATE salary_structure SET basic = ?, hra = ?, allowances = ?, effective_from = ? WHERE user_id = ?',
        [basic, hra, allowances, effective_from, user_id]
      );
      res.json({ msg: 'Salary structure updated' });
    } else {
      // Insert
      await pool.query(
        'INSERT INTO salary_structure (user_id, basic, hra, allowances, effective_from) VALUES (?, ?, ?, ?, ?)',
        [user_id, basic, hra, allowances, effective_from]
      );
      res.json({ msg: 'Salary structure created' });
    }
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

const generatePayslip = async (req, res) => {
  try {
    const { user_id, month, year } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ msg: 'Payslip PDF file is required' });
    }

    const [salary] = await pool.query('SELECT basic, hra, allowances, gross_salary FROM salary_structure WHERE user_id = ?', [user_id]);
    
    if (!salary.length) {
      return res.status(400).json({ msg: 'Salary structure not found for employee' });
    }

    const { gross_salary } = salary[0];
    
    // Calculate LOP deduction (assume 30 days a month for simple calculation)
    const perDaySalary = gross_salary / 30;
    
    // Fetch LOP count for the month
    // In a real app we query attendance table for 'lop' and 'half_day' statuses in this month
    // For this demonstration, we read from leave_balance (yearly), but actually requirement says:
    // "LOP Deduction = Per Day Salary x Number of LOP Days"
    // We will calculate exact from attendance table:
    const [attendance] = await pool.query(
      `SELECT count(*) as total_lops, SUM(CASE WHEN status = 'half_day' THEN 0.5 ELSE 1 END) as calculated_lop_days 
       FROM attendance 
       WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ? AND (status = 'lop' OR status = 'half_day')`,
      [user_id, month, year]
    );

    const lop_days = attendance[0].calculated_lop_days || 0;
    const lop_deduction = lop_days * perDaySalary;
    const net_salary = gross_salary - lop_deduction;

    const file_path = `/uploads/payslips/` + req.file.filename;

    await pool.query(
      `INSERT INTO payslips (user_id, month, year, gross_salary, lop_days, lop_deduction, net_salary, file_path, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       gross_salary=?, lop_days=?, lop_deduction=?, net_salary=?, file_path=?`,
      [user_id, month, year, gross_salary, lop_days, lop_deduction, net_salary, file_path, req.user.id,
      gross_salary, lop_days, lop_deduction, net_salary, file_path]
    );

    res.json({ msg: 'Payslip generated successfully', lop_days, net_salary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getMyPayslips = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payslips WHERE user_id = ? ORDER BY year DESC, month DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllPayslips = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.full_name, u.employee_id 
      FROM payslips p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.year DESC, p.month DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { setSalaryStructure, getSalaryStructure, generatePayslip, getMyPayslips, getAllPayslips };
