-- Dejoiner Database Schema (Phase 2)

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lead_designer TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Resources Table (with version instead of status)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'figma', 'github', 'drive', 'other'
  title TEXT,
  thumbnail_url TEXT,
  version TEXT DEFAULT 'v1.0', -- Replaced 'status' with 'version'
  metadata JSONB DEFAULT '{}', -- Store frame names, etc.
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- From platform (e.g. Figma)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Slack Context Table
CREATE TABLE IF NOT EXISTS slack_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  slack_text TEXT,
  gemini_summary TEXT, -- AI Summary
  author_name TEXT,
  author_avatar_url TEXT,
  channel_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Admins Table (for admin portal)
-- 41. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slack_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'editor')) DEFAULT 'editor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Force refresh schema cache hint (comment)
-- NOTIFY pgrst, 'reload config';

-- Add author tracking to resources
ALTER TABLE resources ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS author_avatar TEXT;

-- Table for Application Settings (API Keys, Channels)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default/Provided Settings
-- ⚠️ SECURITY: DO NOT store tokens here! Use environment variables (.env.local)
-- These are placeholder values - configure actual values in Supabase dashboard or via .env
INSERT INTO settings (key, value) VALUES 
('figma_access_token', 'YOUR_FIGMA_TOKEN_HERE'),
('figma_team_id', 'YOUR_TEAM_ID_HERE'),
('slack_notify_channel', 'YOUR_SLACK_CHANNEL_HERE')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value, 
  updated_at = NOW();

-- Insert a default project
INSERT INTO projects (name, lead_designer) VALUES ('General Support', 'Dejoiner Bot')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policies (open for demo, restrict in production)
CREATE POLICY "Allow all read" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON resources FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON slack_context FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON admins FOR SELECT USING (true);

CREATE POLICY "Allow all insert" ON resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON slack_context FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON admins FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update" ON resources FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON resources FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON admins FOR DELETE USING (true);

-- Migration: If you have existing data with 'status', run this to migrate:
-- ALTER TABLE resources ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0';
-- UPDATE resources SET version = status WHERE version IS NULL;
-- ALTER TABLE resources DROP COLUMN IF EXISTS status;
