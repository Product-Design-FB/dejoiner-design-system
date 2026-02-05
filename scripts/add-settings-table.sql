-- This script safely adds/updates only the settings table
-- Safe to run multiple times

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update the Figma credentials
INSERT INTO settings (key, value) VALUES 
('figma_access_token', 'figd_kG15Zn9R4q12CMn-7CL2bQXOpq2uEJFLR11Fu7Sr'),
('figma_team_id', '1133445507023682143'),
('slack_notify_channel', 'C0A9HM0GP0W')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value, 
  updated_at = NOW();

-- Verify the update
SELECT key, 
  CASE 
    WHEN key LIKE '%token%' OR key LIKE '%key%' THEN SUBSTRING(value, 1, 15) || '...' || SUBSTRING(value, LENGTH(value)-3, 4)
    ELSE value 
  END as value
FROM settings;
