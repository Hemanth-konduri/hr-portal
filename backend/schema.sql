-- ============================================================
-- HR PORTAL — MySQL Database Schema
-- Run this file in MySQL Workbench or mysql CLI:
--   mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS hr_portal;
USE hr_portal;

-- ============================================================
-- 1. SYSTEM SETTINGS
-- Controls one-time bootstrap (first admin registration)
-- ============================================================
CREATE TABLE system_settings (
  id              INT PRIMARY KEY DEFAULT 1,
  registration_open BOOLEAN NOT NULL DEFAULT TRUE,
  setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Ensure only one row ever exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the one and only settings row
INSERT INTO system_settings (id, registration_open, setup_completed) VALUES (1, TRUE, FALSE);

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,
  description     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. USERS
-- Core table for Super Admin, Admin, Employee
-- ============================================================
CREATE TABLE users (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  employee_id             VARCHAR(20) UNIQUE,                        -- e.g. EMP001, auto-generated
  full_name               VARCHAR(150) NOT NULL,
  email                   VARCHAR(255) NOT NULL UNIQUE,
  password_hash           VARCHAR(255) NOT NULL,                     -- bcrypt hash only, never plain text
  role                    ENUM('super_admin', 'admin', 'employee') NOT NULL DEFAULT 'employee',
  status                  ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  department_id           INT,
  position                VARCHAR(100),
  phone                   VARCHAR(20),
  date_of_birth           DATE,
  date_of_joining         DATE,
  profile_photo           VARCHAR(255),
  address                 TEXT,

  -- First login security
  password_reset_required BOOLEAN NOT NULL DEFAULT TRUE,             -- forced password change on first login
  
  -- Account lock after failed attempts
  failed_login_attempts   INT NOT NULL DEFAULT 0,
  account_locked_until    TIMESTAMP NULL DEFAULT NULL,               -- NULL = not locked

  -- Password reset token
  reset_token_hash        VARCHAR(255) NULL DEFAULT NULL,            -- hashed token, never raw
  reset_token_expires_at  TIMESTAMP NULL DEFAULT NULL,               -- 10-15 min expiry
  reset_token_used        BOOLEAN NOT NULL DEFAULT FALSE,            -- single-use enforcement

  -- Who created this user
  created_by              INT NULL,                                  -- FK to users.id (admin who created)

  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 4. SESSIONS (if using session-based auth instead of JWT)
-- Optional — keep for session timeout & concurrent session limit
-- ============================================================
CREATE TABLE user_sessions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  session_token   VARCHAR(512) NOT NULL UNIQUE,                      -- hashed JWT or session ID
  ip_address      VARCHAR(45),                                       -- supports IPv6
  user_agent      TEXT,
  expires_at      TIMESTAMP NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. AUDIT LOGS
-- Logs all sensitive actions for production security
-- ============================================================
CREATE TABLE audit_logs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NULL,                                          -- who performed the action
  action          VARCHAR(100) NOT NULL,                             -- e.g. 'LOGIN_SUCCESS', 'USER_CREATED'
  target_user_id  INT NULL,                                          -- who was affected (if applicable)
  details         TEXT,                                              -- extra context / JSON string
  ip_address      VARCHAR(45),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 6. SALARY STRUCTURE
-- Per employee salary breakdown
-- ============================================================
CREATE TABLE salary_structure (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  basic           DECIMAL(10,2) NOT NULL DEFAULT 0,
  hra             DECIMAL(10,2) NOT NULL DEFAULT 0,
  allowances      DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_salary    DECIMAL(10,2) GENERATED ALWAYS AS (basic + hra + allowances) STORED,
  effective_from  DATE NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. ATTENDANCE
-- Check-in / Check-out with GPS location
-- ============================================================
CREATE TABLE attendance (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  date            DATE NOT NULL,
  check_in_time   TIMESTAMP NULL DEFAULT NULL,
  check_out_time  TIMESTAMP NULL DEFAULT NULL,
  check_in_lat    DECIMAL(10,8),                                     -- GPS latitude
  check_in_lng    DECIMAL(11,8),                                     -- GPS longitude
  check_out_lat   DECIMAL(10,8),
  check_out_lng   DECIMAL(11,8),
  status          ENUM('present', 'absent', 'half_day', 'lop', 'holiday', 'weekend') NOT NULL DEFAULT 'absent',
  is_late         BOOLEAN NOT NULL DEFAULT FALSE,
  overtime_hours  DECIMAL(4,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_date (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 8. LEAVE BALANCE
-- 1 casual leave per employee, rest LOP
-- ============================================================
CREATE TABLE leave_balance (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  casual_total    INT NOT NULL DEFAULT 1,                            -- always 1 as per spec
  casual_used     INT NOT NULL DEFAULT 0,
  casual_remaining INT GENERATED ALWAYS AS (casual_total - casual_used) STORED,
  lop_count       INT NOT NULL DEFAULT 0,                            -- auto incremented on LOP
  year            YEAR NOT NULL DEFAULT (YEAR(CURDATE())),
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 9. LEAVE REQUESTS
-- ============================================================
CREATE TABLE leave_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  leave_type      ENUM('casual', 'lop') NOT NULL,
  from_date       DATE NOT NULL,
  to_date         DATE NOT NULL,
  total_days      INT NOT NULL DEFAULT 1,
  reason          TEXT NOT NULL,
  status          ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by     INT NULL,                                          -- admin who approved/rejected
  review_remark   TEXT,
  reviewed_at     TIMESTAMP NULL DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 10. PAYSLIPS
-- ============================================================
CREATE TABLE payslips (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  month           TINYINT NOT NULL,                                  -- 1-12
  year            YEAR NOT NULL,
  gross_salary    DECIMAL(10,2) NOT NULL,
  lop_days        INT NOT NULL DEFAULT 0,
  lop_deduction   DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_salary      DECIMAL(10,2) NOT NULL,
  file_path       VARCHAR(255),                                      -- uploaded PDF path
  uploaded_by     INT NOT NULL,                                      -- admin who uploaded
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_month_year (user_id, month, year),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 11. DOCUMENTS
-- Employee documents (Aadhar, PAN, Offer Letter etc.)
-- ============================================================
CREATE TABLE documents (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  document_type   ENUM('aadhar', 'pan', 'offer_letter', 'appointment_letter', 'other') NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_path       VARCHAR(255) NOT NULL,
  uploaded_by     INT NOT NULL,                                      -- could be admin or employee
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 12. ANNOUNCEMENTS / NOTICES
-- ============================================================
CREATE TABLE announcements (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  content         TEXT NOT NULL,
  posted_by       INT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 13. DAILY WORK UPDATES
-- ============================================================
CREATE TABLE work_updates (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  date            DATE NOT NULL,
  update_text     TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_date (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 14. PERFORMANCE
-- Monthly/quarterly ratings and feedback from manager
-- ============================================================
CREATE TABLE performance (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  reviewed_by     INT NOT NULL,                                      -- admin/manager
  period          VARCHAR(20) NOT NULL,                              -- e.g. '2025-Q1', '2025-06'
  rating          TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback        TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 15. RESPONSIBILITIES & REMARKS
-- ============================================================
CREATE TABLE responsibilities (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  description     TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE remarks (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  remark          TEXT NOT NULL,
  added_by        INT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 16. FEEDBACK FORMS
-- Employee submits workplace feedback
-- ============================================================
CREATE TABLE feedback_forms (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  feedback_text   TEXT NOT NULL,
  is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 17. EXIT INTERVIEW
-- ============================================================
CREATE TABLE exit_interviews (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL UNIQUE,
  reason_for_leaving  TEXT,
  last_working_date   DATE,
  feedback            TEXT,
  would_rejoin        BOOLEAN,
  suggestions         TEXT,
  submitted_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 18. COMPANY POLICIES & SOPs
-- ============================================================
CREATE TABLE policies (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  type            ENUM('policy', 'sop') NOT NULL,
  file_path       VARCHAR(255),
  content         TEXT,
  uploaded_by     INT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 19. ANNUAL CALENDAR (Holidays & Events)
-- ============================================================
CREATE TABLE calendar_events (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  event_date      DATE NOT NULL,
  type            ENUM('holiday', 'event') NOT NULL DEFAULT 'holiday',
  description     TEXT,
  created_by      INT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 20. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,                                      -- who receives it
  type            VARCHAR(50) NOT NULL,                              -- 'leave_approved', 'payslip_uploaded' etc.
  message         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_attendance_user_date   ON attendance(user_id, date);
CREATE INDEX idx_leave_requests_user    ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status  ON leave_requests(status);
CREATE INDEX idx_audit_logs_user        ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action      ON audit_logs(action);
CREATE INDEX idx_notifications_user     ON notifications(user_id, is_read);
CREATE INDEX idx_payslips_user          ON payslips(user_id, year, month);
