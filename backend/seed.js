require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./config/database');

// ── Helpers ───────────────────────────────────────────────────
const hash = (p) => bcrypt.hash(p, 12);

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const dateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const monthYear = (monthsAgo) => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

// ── Data ──────────────────────────────────────────────────────
const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design'];

const employees = [
  { name: 'Arjun Mehta',    email: 'arjun@hrportal.com',    dept: 'Engineering', position: 'Senior Developer'   },
  { name: 'Sneha Rao',      email: 'sneha@hrportal.com',     dept: 'HR',          position: 'HR Executive'        },
  { name: 'Rahul Sharma',   email: 'rahul@hrportal.com',     dept: 'Sales',       position: 'Sales Manager'       },
  { name: 'Priya Nair',     email: 'priya@hrportal.com',     dept: 'Marketing',   position: 'Marketing Lead'      },
  { name: 'Kiran Patel',    email: 'kiran@hrportal.com',     dept: 'Finance',     position: 'Finance Analyst'     },
  { name: 'Divya Singh',    email: 'divya@hrportal.com',     dept: 'Engineering', position: 'Frontend Developer'  },
  { name: 'Amit Kumar',     email: 'amit@hrportal.com',      dept: 'Operations',  position: 'Operations Head'     },
  { name: 'Neha Gupta',     email: 'neha@hrportal.com',      dept: 'Design',      position: 'UI/UX Designer'      },
  { name: 'Suresh Iyer',    email: 'suresh@hrportal.com',    dept: 'Engineering', position: 'Backend Developer'   },
  { name: 'Meera Joshi',    email: 'meera@hrportal.com',     dept: 'Sales',       position: 'Sales Executive'     },
  { name: 'Vikram Reddy',   email: 'vikram@hrportal.com',    dept: 'Marketing',   position: 'Content Writer'      },
  { name: 'Ananya Das',     email: 'ananya@hrportal.com',    dept: 'HR',          position: 'Recruiter'           },
  { name: 'Rohan Verma',    email: 'rohan@hrportal.com',     dept: 'Finance',     position: 'Accountant'          },
  { name: 'Kavya Pillai',   email: 'kavya@hrportal.com',     dept: 'Design',      position: 'Graphic Designer'    },
  { name: 'Sanjay Mishra',  email: 'sanjay@hrportal.com',    dept: 'Operations',  position: 'Logistics Manager'   },
];

const admins = [
  { name: 'Deepa Krishnan', email: 'deepa@hrportal.com',  dept: 'HR',          position: 'HR Manager'          },
  { name: 'Rajesh Nambiar', email: 'rajesh@hrportal.com', dept: 'Engineering', position: 'Engineering Manager'  },
];

const salaryMap = {
  'Senior Developer':    { basic: 60000, hra: 20000, allowances: 10000 },
  'HR Executive':        { basic: 35000, hra: 12000, allowances: 5000  },
  'Sales Manager':       { basic: 50000, hra: 17000, allowances: 8000  },
  'Marketing Lead':      { basic: 45000, hra: 15000, allowances: 7000  },
  'Finance Analyst':     { basic: 40000, hra: 14000, allowances: 6000  },
  'Frontend Developer':  { basic: 50000, hra: 17000, allowances: 8000  },
  'Operations Head':     { basic: 55000, hra: 18000, allowances: 9000  },
  'UI/UX Designer':      { basic: 45000, hra: 15000, allowances: 7000  },
  'Backend Developer':   { basic: 55000, hra: 18000, allowances: 9000  },
  'Sales Executive':     { basic: 30000, hra: 10000, allowances: 4000  },
  'Content Writer':      { basic: 28000, hra: 9000,  allowances: 3000  },
  'Recruiter':           { basic: 32000, hra: 11000, allowances: 4000  },
  'Accountant':          { basic: 38000, hra: 13000, allowances: 5000  },
  'Graphic Designer':    { basic: 35000, hra: 12000, allowances: 5000  },
  'Logistics Manager':   { basic: 42000, hra: 14000, allowances: 6000  },
  'HR Manager':          { basic: 55000, hra: 18000, allowances: 9000  },
  'Engineering Manager': { basic: 70000, hra: 23000, allowances: 12000 },
};

// ── Main Seed ─────────────────────────────────────────────────
async function seed() {
  await connectDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    console.log('🌱 Starting seed...');

    // ── 1. Departments ────────────────────────────────────────
    console.log('  → Seeding departments...');
    const deptIds = {};
    for (const name of departments) {
      const [existing] = await conn.query('SELECT id FROM departments WHERE name = ?', [name]);
      if (existing.length) {
        deptIds[name] = existing[0].id;
      } else {
        const [r] = await conn.query('INSERT INTO departments (name) VALUES (?)', [name]);
        deptIds[name] = r.insertId;
      }
    }

    // ── 2. Super Admin ────────────────────────────────────────
    console.log('  → Seeding super admin...');
    const [saExisting] = await conn.query("SELECT id FROM users WHERE email = 'admin@hrportal.com'");
    let superAdminId;
    if (saExisting.length) {
      superAdminId = saExisting[0].id;
      console.log('    Super admin already exists, skipping.');
    } else {
      const pw = await hash('Admin@1234');
      const [r] = await conn.query(
        `INSERT INTO users (employee_id, full_name, email, password_hash, role, status, department_id, position, date_of_joining, password_reset_required)
         VALUES ('SA001', 'Super Admin', 'admin@hrportal.com', ?, 'super_admin', 'active', ?, 'Super Administrator', '2022-01-01', false)`,
        [pw, deptIds['HR']]
      );
      superAdminId = r.insertId;
      await conn.query('UPDATE system_settings SET registration_open = false, setup_completed = true WHERE id = 1');
      console.log('    ✅ Super admin created: admin@hrportal.com / Admin@1234');
    }

    // ── 3. Admins ─────────────────────────────────────────────
    console.log('  → Seeding admins...');
    const adminIds = [];
    for (let i = 0; i < admins.length; i++) {
      const a = admins[i];
      const [ex] = await conn.query('SELECT id FROM users WHERE email = ?', [a.email]);
      if (ex.length) { adminIds.push(ex[0].id); continue; }
      const pw = await hash('Admin@1234');
      const empId = `ADM00${i + 1}`;
      const joiningDate = dateStr(randomBetween(300, 700));
      const [r] = await conn.query(
        `INSERT INTO users (employee_id, full_name, email, password_hash, role, status, department_id, position, date_of_joining, created_by, password_reset_required)
         VALUES (?, ?, ?, ?, 'admin', 'active', ?, ?, ?, ?, false)`,
        [empId, a.name, a.email, pw, deptIds[a.dept], a.position, joiningDate, superAdminId]
      );
      adminIds.push(r.insertId);
    }

    // ── 4. Employees ──────────────────────────────────────────
    console.log('  → Seeding employees...');
    const employeeIds = [];
    for (let i = 0; i < employees.length; i++) {
      const e = employees[i];
      const [ex] = await conn.query('SELECT id FROM users WHERE email = ?', [e.email]);
      if (ex.length) { employeeIds.push(ex[0].id); continue; }
      const pw = await hash('Emp@1234');
      const empId = `EMP${String(i + 1).padStart(3, '0')}`;
      const joiningDate = dateStr(randomBetween(30, 600));
      const createdBy = adminIds[i % adminIds.length];
      const [r] = await conn.query(
        `INSERT INTO users (employee_id, full_name, email, password_hash, role, status, department_id, position, date_of_joining, created_by, password_reset_required)
         VALUES (?, ?, ?, ?, 'employee', 'active', ?, ?, ?, ?, false)`,
        [empId, e.name, e.email, pw, deptIds[e.dept], e.position, joiningDate, createdBy]
      );
      employeeIds.push(r.insertId);

      // Leave balance
      const [lb] = await conn.query('SELECT id FROM leave_balance WHERE user_id = ?', [r.insertId]);
      if (!lb.length) {
        await conn.query('INSERT INTO leave_balance (user_id) VALUES (?)', [r.insertId]);
      }
    }

    // Mark 2 employees as inactive
    if (employeeIds.length >= 2) {
      await conn.query('UPDATE users SET status = ? WHERE id = ?', ['inactive', employeeIds[13]]);
      await conn.query('UPDATE users SET status = ? WHERE id = ?', ['suspended', employeeIds[14]]);
    }

    // ── 5. Salary Structures ──────────────────────────────────
    console.log('  → Seeding salary structures...');
    for (let i = 0; i < employees.length; i++) {
      const uid = employeeIds[i];
      const sal = salaryMap[employees[i].position];
      if (!sal || !uid) continue;
      const [ex] = await conn.query('SELECT id FROM salary_structure WHERE user_id = ?', [uid]);
      if (!ex.length) {
        await conn.query(
          'INSERT INTO salary_structure (user_id, basic, hra, allowances, effective_from) VALUES (?, ?, ?, ?, ?)',
          [uid, sal.basic, sal.hra, sal.allowances, dateStr(randomBetween(30, 365))]
        );
      }
    }

    // ── 6. Attendance (last 30 days) ──────────────────────────
    console.log('  → Seeding attendance records...');
    for (const uid of employeeIds.slice(0, 12)) {
      for (let d = 29; d >= 0; d--) {
        const date = dateStr(d);
        const dayOfWeek = new Date(date).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

        const [ex] = await conn.query('SELECT id FROM attendance WHERE user_id = ? AND date = ?', [uid, date]);
        if (ex.length) continue;

        const rand = Math.random();
        let status, isLate = false, checkIn = null, checkOut = null;

        if (rand < 0.75) {
          // Present
          const lateChance = Math.random();
          isLate = lateChance < 0.2;
          const hour = isLate ? randomBetween(10, 11) : randomBetween(8, 9);
          const min  = randomBetween(0, 59);
          checkIn  = `${date} ${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`;
          checkOut = `${date} ${String(randomBetween(17, 19)).padStart(2,'0')}:${String(randomBetween(0,59)).padStart(2,'0')}:00`;
          status = isLate ? 'half_day' : 'present';
        } else if (rand < 0.85) {
          status = 'absent';
        } else if (rand < 0.92) {
          status = 'lop';
        } else {
          status = 'present';
          checkIn  = `${date} 09:00:00`;
          checkOut = `${date} 18:00:00`;
        }

        const lat = (17.3850 + (Math.random() - 0.5) * 0.01).toFixed(6);
        const lng = (78.4867 + (Math.random() - 0.5) * 0.01).toFixed(6);

        await conn.query(
          `INSERT INTO attendance (user_id, date, check_in_time, check_out_time, check_in_lat, check_in_lng, status, is_late)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uid, date, checkIn, checkOut, checkIn ? lat : null, checkIn ? lng : null, status, isLate]
        );
      }
    }

    // ── 7. Leave Requests ─────────────────────────────────────
    console.log('  → Seeding leave requests...');
    const leaveData = [
      { uid: 0, type: 'casual', from: 5,  to: 5,  reason: 'Personal work',          status: 'pending'  },
      { uid: 1, type: 'lop',    from: 10, to: 11, reason: 'Family function',         status: 'approved' },
      { uid: 2, type: 'casual', from: 3,  to: 3,  reason: 'Medical appointment',     status: 'pending'  },
      { uid: 3, type: 'lop',    from: 15, to: 17, reason: 'Out of station',          status: 'rejected' },
      { uid: 4, type: 'casual', from: 2,  to: 2,  reason: 'Personal emergency',      status: 'approved' },
      { uid: 5, type: 'lop',    from: 20, to: 22, reason: 'Vacation',                status: 'pending'  },
      { uid: 6, type: 'casual', from: 7,  to: 7,  reason: 'Doctor visit',            status: 'approved' },
      { uid: 7, type: 'lop',    from: 25, to: 26, reason: 'Wedding in family',       status: 'pending'  },
      { uid: 8, type: 'casual', from: 1,  to: 1,  reason: 'Not feeling well',        status: 'pending'  },
      { uid: 9, type: 'lop',    from: 30, to: 32, reason: 'Travel',                  status: 'approved' },
    ];

    for (const l of leaveData) {
      const uid = employeeIds[l.uid];
      if (!uid) continue;
      const from = dateStr(l.from);
      const to   = dateStr(l.to);
      const days = l.to - l.from + 1;
      const reviewedBy = adminIds[0];

      const [ex] = await conn.query(
        'SELECT id FROM leave_requests WHERE user_id = ? AND from_date = ?', [uid, from]
      );
      if (ex.length) continue;

      await conn.query(
        `INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, total_days, reason, status, reviewed_by, review_remark, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid, l.type, from, to, days, l.reason, l.status,
         l.status !== 'pending' ? reviewedBy : null,
         l.status === 'rejected' ? 'Insufficient notice period' : l.status === 'approved' ? 'Approved' : null,
         l.status !== 'pending' ? new Date() : null]
      );

      // Update leave balance if approved
      if (l.status === 'approved') {
        if (l.type === 'casual') {
          await conn.query('UPDATE leave_balance SET casual_used = casual_used + ? WHERE user_id = ?', [days, uid]);
        } else {
          await conn.query('UPDATE leave_balance SET lop_count = lop_count + ? WHERE user_id = ?', [days, uid]);
        }
      }
    }

    // ── 8. Payslips (last 6 months) ───────────────────────────
    console.log('  → Seeding payslips...');
    for (const uid of employeeIds.slice(0, 10)) {
      const [salRows] = await conn.query('SELECT gross_salary FROM salary_structure WHERE user_id = ?', [uid]);
      if (!salRows.length) continue;
      const gross = parseFloat(salRows[0].gross_salary);

      for (let m = 5; m >= 0; m--) {
        const { month, year } = monthYear(m);
        const [ex] = await conn.query('SELECT id FROM payslips WHERE user_id = ? AND month = ? AND year = ?', [uid, month, year]);
        if (ex.length) continue;

        const lopDays = randomBetween(0, 2);
        const perDay  = gross / 30;
        const lopDed  = parseFloat((lopDays * perDay).toFixed(2));
        const net     = parseFloat((gross - lopDed).toFixed(2));

        await conn.query(
          `INSERT INTO payslips (user_id, month, year, gross_salary, lop_days, lop_deduction, net_salary, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uid, month, year, gross, lopDays, lopDed, net, superAdminId]
        );
      }
    }

    // ── 9. Announcements ──────────────────────────────────────
    console.log('  → Seeding announcements...');
    const announcements = [
      { title: 'Office Closed on Republic Day',       content: 'The office will remain closed on January 26th for Republic Day. Wishing everyone a Happy Republic Day!' },
      { title: 'Q1 Performance Reviews Starting',     content: 'Q1 performance reviews will begin from next Monday. All managers please schedule 1:1s with your team members.' },
      { title: 'New Leave Policy Update',             content: 'Please note that the leave policy has been updated. Each employee now gets 1 casual leave per quarter. Check the policy document for details.' },
      { title: 'Team Outing — Save the Date',         content: 'We are planning a team outing on the last Saturday of this month. More details will be shared soon. Please keep the day free!' },
      { title: 'Payslips for March Uploaded',         content: 'Payslips for the month of March have been uploaded. Please check your payslip section and reach out to HR for any discrepancies.' },
    ];

    for (const a of announcements) {
      const [ex] = await conn.query('SELECT id FROM announcements WHERE title = ?', [a.title]);
      if (!ex.length) {
        await conn.query(
          'INSERT INTO announcements (title, content, posted_by, is_active) VALUES (?, ?, ?, true)',
          [a.title, a.content, superAdminId]
        );
      }
    }

    // ── 10. Performance Reviews ───────────────────────────────
    console.log('  → Seeding performance reviews...');
    const periods = ['2024-Q4', '2025-Q1', '2025-Q2'];
    for (let i = 0; i < Math.min(employeeIds.length, 8); i++) {
      const uid = employeeIds[i];
      for (const period of periods) {
        const [ex] = await conn.query('SELECT id FROM performance WHERE user_id = ? AND period = ?', [uid, period]);
        if (ex.length) continue;
        const rating = randomBetween(3, 5);
        const feedbacks = [
          'Excellent work this quarter. Keep it up!',
          'Good performance. Focus on communication skills.',
          'Meets expectations. Room for improvement in delivery speed.',
          'Outstanding contributor. Promoted to senior role consideration.',
          'Consistent performer. Great team player.',
        ];
        await conn.query(
          'INSERT INTO performance (user_id, reviewed_by, period, rating, feedback) VALUES (?, ?, ?, ?, ?)',
          [uid, adminIds[i % adminIds.length], period, rating, feedbacks[randomBetween(0, 4)]]
        );
      }
    }

    // ── 11. Work Updates ──────────────────────────────────────
    console.log('  → Seeding work updates...');
    const workUpdates = [
      'Completed the API integration for the attendance module.',
      'Reviewed and approved 3 pull requests. Fixed a critical bug in the login flow.',
      'Had a client call. Prepared the Q2 sales report.',
      'Designed new onboarding screens. Shared with the team for feedback.',
      'Processed payroll for March. Reconciled accounts.',
    ];
    for (let i = 0; i < Math.min(employeeIds.length, 5); i++) {
      const uid = employeeIds[i];
      const date = dateStr(0);
      const [ex] = await conn.query('SELECT id FROM work_updates WHERE user_id = ? AND date = ?', [uid, date]);
      if (!ex.length) {
        await conn.query(
          'INSERT INTO work_updates (user_id, date, update_text) VALUES (?, ?, ?)',
          [uid, date, workUpdates[i]]
        );
      }
    }

    await conn.commit();
    console.log('\n✅ Seed completed successfully!\n');
    console.log('─────────────────────────────────────────');
    console.log('  Super Admin : admin@hrportal.com  / Admin@1234');
    console.log('  Admin 1     : deepa@hrportal.com  / Admin@1234');
    console.log('  Admin 2     : rajesh@hrportal.com / Admin@1234');
    console.log('  Employee    : arjun@hrportal.com  / Emp@1234');
    console.log('─────────────────────────────────────────\n');

  } catch (err) {
    await conn.rollback();
    console.error('❌ Seed failed:', err.message);
    console.error(err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
