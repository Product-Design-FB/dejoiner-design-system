-- Migration: Add Content Index for Deep Search
-- This enables searching inside Figma frames, text layers, GitHub files, etc.

-- Add content_index JSONB column to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS content_index JSONB DEFAULT '[]';

-- Create GIN index for fast JSONB searches
CREATE INDEX IF NOT EXISTS idx_resources_content_index 
ON resources USING GIN (content_index);

-- Create text search index on title for prefix matching
CREATE INDEX IF NOT EXISTS idx_resources_title_search 
ON resources USING GIN (to_tsvector('english', title));

-- Add index on source type for filtered searches
CREATE INDEX IF NOT EXISTS idx_resources_type 
ON resources (type);

-- Add index on last_edited_at for sorting
CREATE INDEX IF NOT EXISTS idx_resources_last_edited 
ON resources (last_edited_at DESC);

-- Comment explaining the schema
COMMENT ON COLUMN resources.content_index IS 
'JSONB array of searchable content entries. Each entry has: text, location, nodeId (optional), type';

-- Example content_index structure:
-- [
--   {
--     "text": "Maritimes Header",
--     "location": "Page 2 > Hero Section > Title",
--     "nodeId": "234:567",
--     "type": "text"
--   },
--   {
--     "text": "Regional Campaign Assets",
--     "location": "Page 3 > Components",
--     "type": "frame"
--   }
-- ]
