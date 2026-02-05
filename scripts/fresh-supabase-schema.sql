-- Complete Dejoiner Database Schema for Fresh Supabase Project
-- Run this entire script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  lead_designer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  type TEXT NOT NULL,
  version TEXT DEFAULT 'v1.0',
  thumbnail_url TEXT,
  project_id UUID REFERENCES projects(id),
  metadata JSONB,
  last_edited_at TIMESTAMP WITH TIME ZONE,
  author_name TEXT,
  author_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slack context table
CREATE TABLE IF NOT EXISTS slack_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES resources(id),
  slack_text TEXT,
  gemini_summary TEXT,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slack_user_id TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings with your Figma credentials
INSERT INTO settings (key, value) VALUES 
('figma_access_token', 'figd_kG15Zn9R4q12CMn-7CL2bQXOpq2uEJFLR11Fu7Sr'),
('figma_team_id', '1133445507023682143'),
('slack_notify_channel', 'C0A9HM0GP0W'),
('groq_api_key', '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')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value, 
  updated_at = NOW();

-- Insert default project
INSERT INTO projects (name, lead_designer, status) VALUES 
('General Support', 'Dejoiner Bot', 'Active')
ON CONFLICT DO NOTHING;

-- Row Level Security Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all read" ON projects;
DROP POLICY IF EXISTS "Allow all read" ON resources;
DROP POLICY IF EXISTS "Allow all read" ON slack_context;
DROP POLICY IF EXISTS "Allow all read" ON admins;
DROP POLICY IF EXISTS "Allow all read" ON settings;

DROP POLICY IF EXISTS "Allow all insert" ON projects;
DROP POLICY IF EXISTS "Allow all insert" ON resources;
DROP POLICY IF EXISTS "Allow all insert" ON slack_context;
DROP POLICY IF EXISTS "Allow all insert" ON admins;
DROP POLICY IF EXISTS "Allow all insert" ON settings;

DROP POLICY IF EXISTS "Allow all update" ON projects;
DROP POLICY IF EXISTS "Allow all update" ON resources;
DROP POLICY IF EXISTS "Allow all update" ON slack_context;
DROP POLICY IF EXISTS "Allow all update" ON admins;
DROP POLICY IF EXISTS "Allow all update" ON settings;

DROP POLICY IF EXISTS "Allow all delete" ON projects;
DROP POLICY IF EXISTS "Allow all delete" ON resources;
DROP POLICY IF EXISTS "Allow all delete" ON slack_context;
DROP POLICY IF EXISTS "Allow all delete" ON admins;
DROP POLICY IF EXISTS "Allow all delete" ON settings;

-- Create policies (without IF NOT EXISTS)
CREATE POLICY "Allow all read" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON resources FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON slack_context FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON admins FOR SELECT USING (true);
CREATE POLICY "Allow all read" ON settings FOR SELECT USING (true);

CREATE POLICY "Allow all insert" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON slack_context FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all insert" ON settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow all update" ON resources FOR UPDATE USING (true);
CREATE POLICY "Allow all update" ON slack_context FOR UPDATE USING (true);
CREATE POLICY "Allow all update" ON admins FOR UPDATE USING (true);
CREATE POLICY "Allow all update" ON settings FOR UPDATE USING (true);

CREATE POLICY "Allow all delete" ON projects FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON resources FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON slack_context FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON admins FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON settings FOR DELETE USING (true);

-- Verify setup
SELECT 'Setup complete!' as status;
SELECT key, 
  CASE 
    WHEN key LIKE '%token%' OR key LIKE '%key%' THEN SUBSTRING(value, 1, 15) || '...'
    ELSE value 
  END as value
FROM settings;
