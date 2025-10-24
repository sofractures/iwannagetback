-- Add missing columns to the existing comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author VARCHAR(50) NOT NULL DEFAULT 'Anonymous';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS text TEXT NOT NULL DEFAULT '';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the default values for existing rows (if any)
UPDATE comments SET author = 'Anonymous' WHERE author IS NULL;
UPDATE comments SET text = 'No comment' WHERE text IS NULL;
UPDATE comments SET created_at = NOW() WHERE created_at IS NULL;

-- Make the columns NOT NULL (remove the defaults first)
ALTER TABLE comments ALTER COLUMN author DROP DEFAULT;
ALTER TABLE comments ALTER COLUMN text DROP DEFAULT;

-- Enable RLS if not already enabled
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;

CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);






