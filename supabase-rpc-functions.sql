-- RPC Functions for Combat System
-- These functions are needed for the combat system to work properly

-- Function to increment user wins
CREATE OR REPLACE FUNCTION increment_user_wins(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET total_wins = COALESCE(total_wins, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment user losses
CREATE OR REPLACE FUNCTION increment_user_losses(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET total_losses = COALESCE(total_losses, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly champion
CREATE OR REPLACE FUNCTION get_weekly_champion()
RETURNS TABLE (
  champion_username TEXT,
  wins INTEGER,
  losses INTEGER,
  win_rate DECIMAL(5,2),
  week_start DATE,
  week_end DATE
) AS $$
DECLARE
  current_week_start DATE;
  current_week_end DATE;
BEGIN
  -- Calculate current week (Monday to Sunday)
  current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  current_week_end := current_week_start + INTERVAL '6 days';
  
  RETURN QUERY
  SELECT 
    u.username,
    wc.wins,
    wc.losses,
    wc.win_rate,
    wc.week_start,
    wc.week_end
  FROM weekly_champions wc
  JOIN users u ON u.id = wc.champion_id
  WHERE wc.week_start = current_week_start
  ORDER BY wc.win_rate DESC, wc.wins DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update weekly champions
CREATE OR REPLACE FUNCTION update_weekly_champions()
RETURNS VOID AS $$
DECLARE
  current_week_start DATE;
  current_week_end DATE;
  champion_record RECORD;
BEGIN
  -- Calculate current week
  current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  current_week_end := current_week_start + INTERVAL '6 days';
  
  -- Check if we already have a champion for this week
  IF EXISTS (SELECT 1 FROM weekly_champions WHERE week_start = current_week_start) THEN
    RETURN;
  END IF;
  
  -- Get the current week's champion based on combat stats
  SELECT 
    u.id as user_id,
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate
  INTO champion_record
  FROM users u
  WHERE u.total_wins > 0 OR u.total_losses > 0
  ORDER BY u.win_rate DESC, u.total_wins DESC
  LIMIT 1;
  
  -- Insert the weekly champion if we found one
  IF champion_record.user_id IS NOT NULL THEN
    INSERT INTO weekly_champions (
      champion_id,
      week_start,
      week_end,
      wins,
      losses,
      win_rate,
      total_combats
    ) VALUES (
      champion_record.user_id,
      current_week_start,
      current_week_end,
      champion_record.total_wins,
      champion_record.total_losses,
      champion_record.win_rate,
      champion_record.total_wins + champion_record.total_losses
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get player combat history
CREATE OR REPLACE FUNCTION get_player_combat_history(player_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  combat_id UUID,
  opponent_username TEXT,
  winner_username TEXT,
  combat_date TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  won BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    CASE 
      WHEN c.player1_id = player_id THEN u2.username
      ELSE u1.username
    END as opponent_username,
    COALESCE(uw.username, 'Draw') as winner_username,
    c.combat_date,
    c.combat_duration,
    CASE 
      WHEN c.winner_id = player_id THEN TRUE
      WHEN c.winner_id IS NULL THEN NULL
      ELSE FALSE
    END as won
  FROM combats c
  LEFT JOIN users u1 ON u1.id = c.player1_id
  LEFT JOIN users u2 ON u2.id = c.player2_id
  LEFT JOIN users uw ON uw.id = c.winner_id
  WHERE c.player1_id = player_id OR c.player2_id = player_id
  ORDER BY c.combat_date DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
