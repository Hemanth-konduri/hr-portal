const { pool } = require('../config/database');

const getLocalDateString = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const checkIn = async (req, res) => {
  try {
    const { latitude, longitude, location_name, client_time } = req.body;
    const userId = req.user.id;
    const date = getLocalDateString();

    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    if (existing.length) return res.status(400).json({ msg: 'Already checked in today' });

    // Use client's local time for late calculation, fallback to server time
    let checkInTime;
    if (client_time) {
      // Parse client time and extract HH:MM:SS
      const clientDate = new Date(client_time);
      checkInTime = clientDate.toLocaleTimeString('en-US', { hour12: false });
    } else {
      // Fallback to server time
      const now = new Date();
      checkInTime = now.toLocaleTimeString('en-US', { hour12: false });
    }

    const isLate = checkInTime > '09:30:00';
    const status = isLate ? 'half_day' : 'present';

    await pool.query(
      `INSERT INTO attendance (user_id, date, check_in_time, check_in_lat, check_in_lng, status, is_late, notes)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [userId, date, latitude, longitude, status, isLate, location_name || null]
    );

    if (isLate) {
      await pool.query(
        'UPDATE leave_balance SET lop_count = lop_count + 0.5 WHERE user_id = ?',
        [userId]
      );
    }

    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
      [userId, date]
    );

    res.json({ msg: 'Check-in successful', isLate, status, attendance: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;
    const date = getLocalDateString();

    const [attendance] = await pool.query(
      'SELECT id, check_in_time, check_out_time FROM attendance WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    if (!attendance.length) return res.status(400).json({ msg: 'Not checked in today' });
    if (attendance[0].check_out_time) return res.status(400).json({ msg: 'Already checked out today' });

    // Calculate overtime: if checkout > 18:30
    const now = new Date();
    const checkOutTime = now.toLocaleTimeString('en-US', { hour12: false });
    const overtimeHours = checkOutTime > '18:30:00'
      ? parseFloat(((now - new Date(attendance[0].check_in_time)) / 3600000 - 9).toFixed(2))
      : 0;

    await pool.query(
      `UPDATE attendance SET check_out_time = NOW(), check_out_lat = ?, check_out_lng = ?, overtime_hours = ? WHERE id = ?`,
      [latitude, longitude, Math.max(0, overtimeHours), attendance[0].id]
    );

    const [rows] = await pool.query('SELECT * FROM attendance WHERE id = ?', [attendance[0].id]);

    res.json({ msg: 'Check-out successful', overtimeHours: Math.max(0, overtimeHours), attendance: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Employee: own attendance with optional date range filter
const getEmployeeAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from_date, to_date, status, month, year } = req.query;

    let query = 'SELECT * FROM attendance WHERE user_id = ?';
    const params = [userId];

    if (from_date) { query += ' AND date >= ?'; params.push(from_date); }
    if (to_date)   { query += ' AND date <= ?'; params.push(to_date); }
    if (status)    { query += ' AND status = ?'; params.push(status); }
    if (month)     { query += ' AND MONTH(date) = ?'; params.push(month); }
    if (year)      { query += ' AND YEAR(date) = ?'; params.push(year); }

    query += ' ORDER BY date DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Employee: monthly summary stats
const getMyAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.query.month || new Date().getMonth() + 1;
    const year  = req.query.year  || new Date().getFullYear();

    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total_days,
        SUM(status = 'present')  AS present,
        SUM(status = 'absent')   AS absent,
        SUM(status = 'half_day') AS half_day,
        SUM(status = 'lop')      AS lop,
        SUM(is_late = 1)         AS late_count,
        SUM(overtime_hours)      AS total_overtime
       FROM attendance
       WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
      [userId, month, year]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: all attendance with rich filters
const getAllAttendance = async (req, res) => {
  try {
    const { user_id, from_date, to_date, status, is_late, department, month, year, search } = req.query;

    let query = `
      SELECT a.*, u.full_name, u.employee_id, u.department_id,
             d.name AS department
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'employee'
    `;
    const params = [];

    if (user_id)    { query += ' AND a.user_id = ?';          params.push(user_id); }
    if (from_date)  { query += ' AND a.date >= ?';            params.push(from_date); }
    if (to_date)    { query += ' AND a.date <= ?';            params.push(to_date); }
    if (status)     { query += ' AND a.status = ?';           params.push(status); }
    if (is_late === 'true')  { query += ' AND a.is_late = 1'; }
    if (is_late === 'false') { query += ' AND a.is_late = 0'; }
    if (department) { query += ' AND d.name = ?';             params.push(department); }
    if (month)      { query += ' AND MONTH(a.date) = ?';      params.push(month); }
    if (year)       { query += ' AND YEAR(a.date) = ?';       params.push(year); }
    if (search)     {
      query += ' AND (u.full_name LIKE ? OR u.employee_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY a.date DESC, u.full_name ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: summary stats for dashboard/reports
const getAttendanceSummary = async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();

    let query = `
      SELECT
        COUNT(DISTINCT a.user_id)       AS total_employees,
        SUM(a.status = 'present')       AS present,
        SUM(a.status = 'absent')        AS absent,
        SUM(a.status = 'half_day')      AS half_day,
        SUM(a.status = 'lop')           AS lop,
        SUM(a.is_late = 1)              AS late_count,
        SUM(a.overtime_hours)           AS total_overtime,
        COUNT(*)                        AS total_records
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'employee'
        AND MONTH(a.date) = ? AND YEAR(a.date) = ?
    `;
    const params = [m, y];

    if (department) { query += ' AND d.name = ?'; params.push(department); }

    const [rows] = await pool.query(query, params);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: per-employee monthly summary (for report table)
const getEmployeeMonthlySummary = async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year  || new Date().getFullYear();

    let query = `
      SELECT
        u.id, u.full_name, u.employee_id, d.name AS department,
        SUM(a.status = 'present')  AS present,
        SUM(a.status = 'absent')   AS absent,
        SUM(a.status = 'half_day') AS half_day,
        SUM(a.status = 'lop')      AS lop,
        SUM(a.is_late = 1)         AS late_count,
        ROUND(SUM(a.overtime_hours), 2) AS overtime_hours
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id
        AND MONTH(a.date) = ? AND YEAR(a.date) = ?
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'employee' AND u.status = 'active'
    `;
    const params = [m, y];

    if (department) { query += ' AND d.name = ?'; params.push(department); }

    query += ' GROUP BY u.id, u.full_name, u.employee_id, d.name ORDER BY u.full_name';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  checkIn, checkOut,
  getEmployeeAttendance, getMyAttendanceSummary,
  getAllAttendance, getAttendanceSummary, getEmployeeMonthlySummary,
};
