-- Add combat statistics columns to players table
-- Execute this in Supabase SQL Editor

-- Add the missing columns to the players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00;

-- Update existing players to have default values
UPDATE players 
SET 
  total_wins = COALESCE(total_wins, 0),
  total_losses = COALESCE(total_losses, 0),
  win_rate = COALESCE(win_rate, 0.00)
WHERE total_wins IS NULL OR total_losses IS NULL OR win_rate IS NULL;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
  AND column_name IN ('total_wins', 'total_losses', 'win_rate')
ORDER BY column_name;

-- Show current players and their combat stats
SELECT 
  id,
  name,
  user_id,
  total_wins,
  total_losses,
  win_rate,
  created_at
FROM players 
ORDER BY total_wins DESC, win_rate DESC
LIMIT 10;
