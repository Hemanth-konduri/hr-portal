const { pool } = require('../config/database');

const applyLeave = async (req, res) => {
  try {
    const { leave_type, from_date, to_date, reason } = req.body;
    const userId = req.user.id;
    
    const start = new Date(from_date);
    const end = new Date(to_date);
    const total_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (leave_type === 'casual') {
      const [balanceRows] = await pool.query('SELECT casual_total, casual_used FROM leave_balance WHERE user_id = ?', [userId]);
      const casual_remaining = balanceRows.length
        ? (balanceRows[0].casual_total ?? 1) - (balanceRows[0].casual_used ?? 0)
        : 1;
      
      if (total_days > casual_remaining) {
        return res.status(400).json({ msg: 'Insufficient Casual Leave balance.' });
      }
    }

    await pool.query(
      `INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, total_days, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, leave_type, from_date, to_date, total_days, reason]
    );

    res.json({ msg: 'Leave application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getEmployeeLeaves = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT lr.*, u.full_name, u.employee_id 
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      ORDER BY lr.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { status, review_remark } = req.body; // 'approved' or 'rejected'
    const leaveId = req.params.id;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const [leave] = await pool.query('SELECT user_id, leave_type, total_days FROM leave_requests WHERE id = ?', [leaveId]);
    
    if (!leave.length) {
      return res.status(404).json({ msg: 'Leave request not found' });
    }

    // Process balance if approved
    if (status === 'approved') {
      if (leave[0].leave_type === 'casual') {
        await pool.query('UPDATE leave_balance SET casual_used = casual_used + ? WHERE user_id = ?', [leave[0].total_days, leave[0].user_id]);
      } else if (leave[0].leave_type === 'lop') {
        await pool.query('UPDATE leave_balance SET lop_count = lop_count + ? WHERE user_id = ?', [leave[0].total_days, leave[0].user_id]);
      }
    }

    await pool.query(
      `UPDATE leave_requests SET status = ?, reviewed_by = ?, review_remark = ?, reviewed_at = NOW() WHERE id = ?`,
      [status, req.user.id, review_remark, leaveId]
    );

    res.json({ msg: `Leave request ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const [balance] = await pool.query('SELECT * FROM leave_balance WHERE user_id = ?', [userId]);
    if (balance.length) {
      // Compute casual_remaining manually in case generated column is missing
      const row = balance[0];
      row.casual_remaining = (row.casual_total ?? 1) - (row.casual_used ?? 0);
      return res.json(row);
    }
    // Auto-create balance row if missing
    await pool.query(
      'INSERT INTO leave_balance (user_id, casual_total, casual_used, lop_count) VALUES (?, 1, 0, 0)',
      [userId]
    );
    res.json({ user_id: userId, casual_total: 1, casual_used: 0, casual_remaining: 1, lop_count: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Employee: cancel a pending leave request
const cancelLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT id, status FROM leave_requests WHERE id = ? AND user_id = ?',
      [leaveId, userId]
    );
    if (!rows.length) return res.status(404).json({ msg: 'Leave request not found' });
    if (rows[0].status !== 'pending') return res.status(400).json({ msg: 'Only pending requests can be cancelled' });

    await pool.query('DELETE FROM leave_requests WHERE id = ?', [leaveId]);
    res.json({ msg: 'Leave request cancelled' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: summary stats for leave dashboard
const getLeaveStats = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*)                     AS total,
        COALESCE(SUM(status = 'pending'),  0) AS pending,
        COALESCE(SUM(status = 'approved'), 0) AS approved,
        COALESCE(SUM(status = 'rejected'), 0) AS rejected,
        COALESCE(SUM(leave_type = 'casual'), 0) AS casual_count,
        COALESCE(SUM(leave_type = 'lop'),    0) AS lop_count,
        COALESCE(SUM(total_days), 0)         AS total_days
      FROM leave_requests
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { applyLeave, getEmployeeLeaves, getAllLeaves, updateLeaveStatus, getLeaveBalance, cancelLeave, getLeaveStats };
