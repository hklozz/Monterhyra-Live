-- Run this in Supabase SQL Editor to apply all migrations at once

-- Migration 002: Add exhibitor auth
ALTER TABLE exhibitors 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS password TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exhibitors_username ON exhibitors(username) WHERE username IS NOT NULL;

COMMENT ON COLUMN exhibitors.username IS 'Unique username for exhibitor login';
COMMENT ON COLUMN exhibitors.password IS 'Plain text password for exhibitor (will be hashed in production)';

-- Migration 003: Add white label
ALTER TABLE events
ADD COLUMN IF NOT EXISTS white_label JSONB;

COMMENT ON COLUMN events.white_label IS 'White label branding settings (logo, colors, company name, custom domain, etc.)';

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exhibitors' 
AND column_name IN ('username', 'password');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'white_label';
