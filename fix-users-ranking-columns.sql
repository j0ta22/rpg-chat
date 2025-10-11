-- Fix users table to add ranking columns
-- This adds the missing columns for the ranking system

-- Add ranking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00;

-- Create indexes for better performance on ranking queries
CREATE INDEX IF NOT EXISTS idx_users_total_wins ON users(total_wins);
CREATE INDEX IF NOT EXISTS idx_users_win_rate ON users(win_rate);
CREATE INDEX IF NOT EXISTS idx_users_ranking ON users(win_rate DESC, total_wins DESC);

-- Update existing users with their actual combat statistics
-- This will calculate the real wins/losses from the combats table
UPDATE users 
SET 
    total_wins = COALESCE((
        SELECT COUNT(*) 
        FROM combats 
        WHERE winner_id = users.id
    ), 0),
    total_losses = COALESCE((
        SELECT COUNT(*) 
        FROM combats 
        WHERE (player1_id = users.id OR player2_id = users.id) 
        AND winner_id != users.id
    ), 0),
    win_rate = CASE 
        WHEN COALESCE((
            SELECT COUNT(*) 
            FROM combats 
            WHERE (player1_id = users.id OR player2_id = users.id)
        ), 0) > 0 THEN
            ROUND((
                COALESCE((
                    SELECT COUNT(*) 
                    FROM combats 
                    WHERE winner_id = users.id
                ), 0)::decimal / 
                COALESCE((
                    SELECT COUNT(*) 
                    FROM combats 
                    WHERE (player1_id = users.id OR player2_id = users.id)
                ), 1)
            ) * 100, 2)
        ELSE 0.00
    END;

-- Verify the update worked
SELECT 
    username,
    total_wins,
    total_losses,
    win_rate,
    (total_wins + total_losses) as total_combats
FROM users 
ORDER BY win_rate DESC, total_wins DESC;
