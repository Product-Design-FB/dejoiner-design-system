-- Dejoiner Database Migration Script
-- Run this in your Supabase SQL Editor to fix missing columns and policies

-- ========================================
-- 1. Add missing 'name' column to admins table
-- ========================================
ALTER TABLE admins ADD COLUMN IF NOT EXISTS name TEXT;

-- ========================================
-- 2. Ensure all RLS policies exist for DELETE operations
-- ========================================
DROP POLICY IF EXISTS "Allow all delete" ON resources;
DROP POLICY IF EXISTS "Allow all delete" ON slack_context;
DROP POLICY IF EXISTS "Allow all delete" ON admins;
DROP POLICY IF EXISTS "Allow all delete" ON projects;
DROP POLICY IF EXISTS "Allow all delete" ON settings;

CREATE POLICY "Allow all delete" ON resources FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON slack_context FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON admins FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON projects FOR DELETE USING (true);
CREATE POLICY "Allow all delete" ON settings FOR DELETE USING (true);

-- ========================================
-- 3. Add CASCADE delete for slack_context when resource is deleted
-- ========================================
ALTER TABLE slack_context DROP CONSTRAINT IF EXISTS slack_context_resource_id_fkey;
ALTER TABLE slack_context ADD CONSTRAINT slack_context_resource_id_fkey 
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;

-- ========================================
-- 4. Verify the changes
-- ========================================
SELECT 'Migration complete!' as status;

-- Show admins table structure to confirm 'name' column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admins';
