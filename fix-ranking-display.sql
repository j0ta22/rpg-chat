-- Fix the ranking display to show all users, not just those who have fought
-- This will show users with 0 wins/losses as well

-- Drop and recreate the get_player_rankings function to show all users
DROP FUNCTION IF EXISTS get_player_rankings();

CREATE OR REPLACE FUNCTION get_player_rankings()
RETURNS TABLE (
    username TEXT,
    wins INTEGER,
    losses INTEGER,
    win_rate DECIMAL(5,2),
    total_combats INTEGER,
    rank_position BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.username,
        u.total_wins,
        u.total_losses,
        u.win_rate,
        (u.total_wins + u.total_losses) as total_combats,
        ROW_NUMBER() OVER (ORDER BY u.win_rate DESC, u.total_wins DESC) as rank_position
    FROM users u
    -- Removed the filter: WHERE u.total_wins > 0 OR u.total_losses > 0
    -- Now shows all users, including those with 0 combat data
    ORDER BY u.win_rate DESC, u.total_wins DESC;
END;
$$ LANGUAGE plpgsql;
