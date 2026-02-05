-- Add thumbnail_url column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'thumbnail_url') THEN 
        ALTER TABLE resources ADD COLUMN thumbnail_url TEXT; 
    END IF; 
END $$;
