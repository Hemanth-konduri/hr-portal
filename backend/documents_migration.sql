-- ============================================================
-- DOCUMENTS — Enhanced Schema Migration
-- Run AFTER base schema.sql
-- ============================================================

ALTER TABLE documents
  ADD COLUMN verification_status ENUM('pending', 'verified', 'rejected', 'expired')
      NOT NULL DEFAULT 'pending' AFTER file_path,
  ADD COLUMN verified_by   INT NULL DEFAULT NULL AFTER verification_status,
  ADD COLUMN verified_at   TIMESTAMP NULL DEFAULT NULL AFTER verified_by,
  ADD COLUMN hr_notes      TEXT NULL DEFAULT NULL AFTER verified_at,
  ADD COLUMN expiry_date   DATE NULL DEFAULT NULL AFTER hr_notes,
  ADD COLUMN is_required   BOOLEAN NOT NULL DEFAULT FALSE AFTER expiry_date,
  MODIFY COLUMN document_type ENUM(
    'aadhar', 'pan', 'offer_letter', 'appointment_letter',
    'resume', 'education_certificate', 'experience_letter',
    'bank_details', 'passport', 'driving_license',
    'nda', 'contract', 'other'
  ) NOT NULL;

ALTER TABLE documents
  ADD CONSTRAINT fk_doc_verified_by
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_user       ON documents(user_id);
CREATE INDEX idx_documents_status     ON documents(verification_status);
CREATE INDEX idx_documents_type       ON documents(document_type);
