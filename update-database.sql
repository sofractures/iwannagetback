-- Add is_winner column to existing leaderboard table
ALTER TABLE leaderboard ADD COLUMN is_winner BOOLEAN DEFAULT FALSE;

-- Create index for faster winner queries
CREATE INDEX idx_leaderboard_winners ON leaderboard(is_winner) WHERE is_winner = true;

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







