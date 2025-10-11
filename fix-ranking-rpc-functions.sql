-- Fix RPC Functions for Ranking System
-- This drops existing functions and recreates them with correct signatures

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_combat_history(uuid, integer);
DROP FUNCTION IF EXISTS get_player_rankings();
DROP FUNCTION IF EXISTS update_user_ranking_stats(uuid);
DROP FUNCTION IF EXISTS update_all_user_rankings();
DROP FUNCTION IF EXISTS get_weekly_champions(integer);

-- Function to update user ranking statistics after a combat
CREATE OR REPLACE FUNCTION update_user_ranking_stats(user_id UUID)
RETURNS VOID AS $$
DECLARE
    wins_count INTEGER;
    losses_count INTEGER;
    total_combats INTEGER;
    calculated_win_rate DECIMAL(5,2);
BEGIN
    -- Count wins (combats where user is the winner)
    SELECT COUNT(*) INTO wins_count
    FROM combats 
    WHERE winner_id = user_id;
    
    -- Count losses (combats where user participated but didn't win)
    SELECT COUNT(*) INTO losses_count
    FROM combats 
    WHERE (player1_id = user_id OR player2_id = user_id) 
    AND winner_id != user_id;
    
    -- Calculate total combats
    total_combats := wins_count + losses_count;
    
    -- Calculate win rate
    IF total_combats > 0 THEN
        calculated_win_rate := ROUND((wins_count::decimal / total_combats) * 100, 2);
    ELSE
        calculated_win_rate := 0.00;
    END IF;
    
    -- Update user statistics
    UPDATE users 
    SET 
        total_wins = wins_count,
        total_losses = losses_count,
        win_rate = calculated_win_rate,
        updated_at = NOW()
    WHERE id = user_id;
    
END;
$$ LANGUAGE plpgsql;

-- Function to get player rankings with additional stats
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
    WHERE u.total_wins > 0 OR u.total_losses > 0  -- Only show users who have fought
    ORDER BY u.win_rate DESC, u.total_wins DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update all user rankings (useful for maintenance)
CREATE OR REPLACE FUNCTION update_all_user_rankings()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users and update their ranking stats
    FOR user_record IN 
        SELECT id FROM users
    LOOP
        PERFORM update_user_ranking_stats(user_record.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's combat history
CREATE OR REPLACE FUNCTION get_user_combat_history(target_user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    combat_id UUID,
    opponent_username TEXT,
    winner_username TEXT,
    combat_date TIMESTAMP WITH TIME ZONE,
    was_winner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        CASE 
            WHEN c.player1_id = target_user_id THEN u2.username
            ELSE u1.username
        END as opponent_username,
        uw.username as winner_username,
        c.combat_date,
        (c.winner_id = target_user_id) as was_winner
    FROM combats c
    LEFT JOIN users u1 ON u1.id = c.player1_id
    LEFT JOIN users u2 ON u2.id = c.player2_id
    LEFT JOIN users uw ON uw.id = c.winner_id
    WHERE c.player1_id = target_user_id OR c.player2_id = target_user_id
    ORDER BY c.combat_date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly champions
CREATE OR REPLACE FUNCTION get_weekly_champions(weeks_back INTEGER DEFAULT 4)
RETURNS TABLE (
    week_start DATE,
    week_end DATE,
    champion_username TEXT,
    wins INTEGER,
    losses INTEGER,
    win_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_stats AS (
        SELECT 
            DATE_TRUNC('week', c.combat_date)::DATE as week_start,
            (DATE_TRUNC('week', c.combat_date) + INTERVAL '6 days')::DATE as week_end,
            c.winner_id,
            COUNT(*) as wins
        FROM combats c
        WHERE c.combat_date >= NOW() - INTERVAL '1 week' * weeks_back
        AND c.winner_id IS NOT NULL
        GROUP BY DATE_TRUNC('week', c.combat_date), c.winner_id
    ),
    weekly_champions AS (
        SELECT 
            ws.week_start,
            ws.week_end,
            ws.winner_id,
            ws.wins,
            ROW_NUMBER() OVER (PARTITION BY ws.week_start ORDER BY ws.wins DESC) as rank
        FROM weekly_stats ws
    )
    SELECT 
        wc.week_start,
        wc.week_end,
        u.username as champion_username,
        wc.wins,
        0 as losses, -- Could be calculated if needed
        100.00 as win_rate -- Could be calculated if needed
    FROM weekly_champions wc
    JOIN users u ON u.id = wc.winner_id
    WHERE wc.rank = 1
    ORDER BY wc.week_start DESC;
END;
$$ LANGUAGE plpgsql;

-- Verify functions were created successfully
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'update_user_ranking_stats',
    'get_player_rankings', 
    'update_all_user_rankings',
    'get_user_combat_history',
    'get_weekly_champions'
)
ORDER BY routine_name;
