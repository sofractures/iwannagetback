-- Create comments table for the game
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  author VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policy to allow public read/write
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read comments
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

-- Allow anyone to insert comments
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);




