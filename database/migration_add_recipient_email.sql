-- Migration: Add recipient_email column to petition_cases table
-- Date: 2025-01-XX
-- Description: Adds recipient_email column to store email address for sending generated documents

-- Add recipient_email column to petition_cases table
ALTER TABLE petition_cases
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN petition_cases.recipient_email IS 'Email address where generated documents will be sent';

-- Optional: Add an index if you plan to query by email frequently
-- CREATE INDEX IF NOT EXISTS idx_petition_cases_recipient_email ON petition_cases(recipient_email);

-- Update schema version
INSERT INTO schema_version (version, description)
VALUES (2, 'Added recipient_email column to petition_cases table')
ON CONFLICT (version) DO NOTHING;

