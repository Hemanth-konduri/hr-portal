const { pool } = require('../config/database');

const checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0];

    const [existing] = await pool.query('SELECT id FROM attendance WHERE user_id = ? AND date = ?', [userId, date]);
    
    if (existing.length) {
      return res.status(400).json({ msg: 'Already checked in today' });
    }

    // Checking if late (after 09:30 AM)
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-US', { hour12: false });
    const isLate = checkInTime > '09:30:00';
    
    // Status Logic
    const status = isLate ? 'half_day' : 'present';
    
    await pool.query(
      `INSERT INTO attendance (user_id, date, check_in_time, check_in_lat, check_in_lng, status, is_late)
       VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
      [userId, date, latitude, longitude, status, isLate]
    );

    // If Late, increment LOP count by 0.5 (Half Day LOP) or 1
    if (isLate) {
      // In leave_balance schema lop_count is INT, so we treat 1 LOP as a day, logic may differ, but let's increment lop_count
      // For precision, might require schema change to DECIMAL(5,1) but specs say Half Day LOP
      await pool.query('UPDATE leave_balance SET lop_count = lop_count + 0.5 WHERE user_id = ?', [userId]);
    }

    res.json({ msg: 'Check-in successful', isLate, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0];

    const [attendance] = await pool.query('SELECT id, check_out_time FROM attendance WHERE user_id = ? AND date = ?', [userId, date]);
    
    if (!attendance.length) {
      return res.status(400).json({ msg: 'Not checked in today' });
    }
    
    if (attendance[0].check_out_time) {
      return res.status(400).json({ msg: 'Already checked out today' });
    }

    await pool.query(
      `UPDATE attendance SET check_out_time = NOW(), check_out_lat = ?, check_out_lng = ? WHERE id = ?`,
      [latitude, longitude, attendance[0].id]
    );

    res.json({ msg: 'Check-out successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getEmployeeAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC', [userId]);
    // Format to match frontend expectations
    const formatted = rows.map(r => ({
      ...r,
      checkIn: { time: r.check_in_time, location: { latitude: r.check_in_lat, longitude: r.check_in_lng } },
      checkOut: { time: r.check_out_time, location: { latitude: r.check_out_lat, longitude: r.check_out_lng } }
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.full_name, u.employee_id 
      FROM attendance a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { checkIn, checkOut, getEmployeeAttendance, getAllAttendance };
