-- This script safely adds/updates only the settings table
-- Safe to run multiple times

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update the Figma credentials
-- ⚠️ SECURITY: DO NOT store real tokens here! Configure in Supabase dashboard
INSERT INTO settings (key, value) VALUES 
('figma_access_token', 'YOUR_FIGMA_TOKEN_HERE'),
('figma_team_id', 'YOUR_TEAM_ID_HERE'),
('slack_notify_channel', 'YOUR_SLACK_CHANNEL_HERE')
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
