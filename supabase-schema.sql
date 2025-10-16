-- Create leaderboard table
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  initials VARCHAR(3) NOT NULL,
  email VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX idx_leaderboard_created_at ON leaderboard(created_at DESC);
CREATE INDEX idx_leaderboard_winners ON leaderboard(is_winner) WHERE is_winner = true;

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert scores
CREATE POLICY "Allow score submission" ON leaderboard
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anyone to read scores
CREATE POLICY "Allow score reading" ON leaderboard
  FOR SELECT USING (true);

-- Optional: Create a view for top 10 scores
CREATE VIEW top_scores AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
  initials,
  score,
  created_at
FROM leaderboard
ORDER BY score DESC
LIMIT 10;

-- Create a view for winners (prize eligible players)
CREATE VIEW winners AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY score DESC) as winner_rank,
  initials,
  email,
  score,
  created_at
FROM leaderboard
WHERE is_winner = true
ORDER BY score DESC;

