-- Add username and password columns to exhibitors table (if not exists)
ALTER TABLE exhibitors 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS password TEXT;

-- Create unique index on username to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_exhibitors_username ON exhibitors(username) WHERE username IS NOT NULL;

-- Add white label columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS white_label JSONB;

-- Add comment
COMMENT ON COLUMN exhibitors.username IS 'Unique username for exhibitor login';
COMMENT ON COLUMN exhibitors.password IS 'Plain text password for exhibitor (will be hashed in production)';
COMMENT ON COLUMN events.white_label IS 'White label branding settings (logo, colors, company name, custom domain, etc.)';
