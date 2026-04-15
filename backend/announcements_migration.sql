-- ============================================================
-- ANNOUNCEMENTS — Enhanced Schema Migration
-- Run AFTER the base schema.sql
-- ============================================================

-- 1. Alter announcements table — add new scalable columns
ALTER TABLE announcements
  ADD COLUMN priority      ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal' AFTER is_active,
  ADD COLUMN category      ENUM('general', 'hr', 'policy', 'event', 'it', 'finance', 'other') NOT NULL DEFAULT 'general' AFTER priority,
  ADD COLUMN pinned        BOOLEAN NOT NULL DEFAULT FALSE AFTER category,
  ADD COLUMN expires_at    TIMESTAMP NULL DEFAULT NULL AFTER pinned,
  ADD COLUMN target_audience ENUM('all', 'employees', 'admins') NOT NULL DEFAULT 'all' AFTER expires_at,
  ADD COLUMN deleted_at    TIMESTAMP NULL DEFAULT NULL AFTER target_audience;

-- 2. Read tracking — which users have read which announcements
CREATE TABLE announcement_reads (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NOT NULL,
  user_id         INT NOT NULL,
  read_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_read (announcement_id, user_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
);

CREATE INDEX idx_announcement_reads ON announcement_reads(announcement_id);
CREATE INDEX idx_announcements_active_pinned ON announcements(is_active, pinned, created_at);
