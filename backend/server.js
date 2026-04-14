const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ── Active Routes ──────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/employees'));

// ── Coming Soon (will be added module by module) ───────────
// app.use('/api/attendance', require('./routes/attendance'));
// app.use('/api/leaves', require('./routes/leaves'));
// app.use('/api/payslips', require('./routes/payslips'));
// app.use('/api/documents', require('./routes/documents'));
// app.use('/api/announcements', require('./routes/announcements'));
// app.use('/api/feedback', require('./routes/feedback'));
// app.use('/api/work-updates', require('./routes/workUpdates'));

app.get('/', (req, res) => res.json({ message: 'HR Portal API Running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
