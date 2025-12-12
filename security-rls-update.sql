-- Security update: Add validation constraints to RLS policies
-- Run this in your Supabase SQL Editor

-- First, drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow score submission" ON leaderboard;

-- Create a more restrictive INSERT policy with validation
CREATE POLICY "Allow score submission with validation" ON leaderboard
  FOR INSERT WITH CHECK (
    -- Initials must be 1-3 letters only
    length(initials) BETWEEN 1 AND 3 AND
    initials ~ '^[A-Za-z]+$' AND
    -- Score must be reasonable (non-negative, under 10 million)
    score >= 0 AND
    score <= 10000000 AND
    -- Email must have basic valid format
    email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
    length(email) <= 255
  );

-- Add database-level constraints as backup
ALTER TABLE leaderboard
  ADD CONSTRAINT chk_initials_format CHECK (initials ~ '^[A-Za-z]{1,3}$'),
  ADD CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 10000000),
  ADD CONSTRAINT chk_email_format CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Note: If constraints already exist, the ALTER will fail. You can drop them first:
-- ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS chk_initials_format;
-- ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS chk_score_range;
-- ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS chk_email_format;

