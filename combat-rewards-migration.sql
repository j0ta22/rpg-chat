-- Combat Rewards System Migration
-- Crea las funciones necesarias para manejar recompensas de combate

-- Función para incrementar oro del usuario
CREATE OR REPLACE FUNCTION increment_user_gold(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET gold = COALESCE(gold, 0) + amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para agregar experiencia al usuario
CREATE OR REPLACE FUNCTION add_user_experience(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET experience = COALESCE(experience, 0) + xp_amount 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para remover experiencia del usuario (penalización)
CREATE OR REPLACE FUNCTION remove_user_experience(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET experience = GREATEST(COALESCE(experience, 0) - xp_amount, 0) 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener stats de combate de un usuario
CREATE OR REPLACE FUNCTION get_user_combat_stats(user_id UUID)
RETURNS TABLE(
  attack INTEGER,
  defense INTEGER,
  speed INTEGER,
  health INTEGER,
  level INTEGER,
  gold INTEGER,
  experience INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.attack, 10) as attack,
    COALESCE(p.defense, 5) as defense,
    COALESCE(p.speed, 3) as speed,
    COALESCE(p.health, 100) as health,
    COALESCE(p.level, 1) as level,
    COALESCE(u.gold, 0) as gold,
    COALESCE(u.experience, 0) as experience
  FROM users u
  LEFT JOIN players p ON p.user_id = u.id
  WHERE u.id = user_id
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar resultado de combate con recompensas
CREATE OR REPLACE FUNCTION record_combat_result(
  winner_id UUID,
  loser_id UUID,
  winner_level INTEGER,
  loser_level INTEGER,
  combat_duration INTEGER,
  damage_dealt INTEGER,
  critical_hits INTEGER,
  gold_reward INTEGER,
  xp_reward INTEGER,
  xp_loss INTEGER,
  item_dropped_id UUID DEFAULT NULL,
  level_difference INTEGER DEFAULT 0,
  no_rewards BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  combat_id UUID;
BEGIN
  -- Insertar resultado del combate
  INSERT INTO combats (
    player1_id,
    player2_id,
    winner_id,
    player1_level,
    player2_level,
    combat_duration,
    damage_dealt,
    critical_hits,
    gold_reward,
    xp_reward,
    xp_loss,
    item_dropped_id,
    level_difference,
    no_rewards,
    created_at
  ) VALUES (
    winner_id,
    loser_id,
    winner_id,
    winner_level,
    loser_level,
    combat_duration,
    damage_dealt,
    critical_hits,
    gold_reward,
    xp_reward,
    xp_loss,
    item_dropped_id,
    level_difference,
    no_rewards,
    NOW()
  ) RETURNING id INTO combat_id;
  
  RETURN combat_id;
END;
$$ LANGUAGE plpgsql;

-- Actualizar tabla de combates para incluir nuevas columnas
ALTER TABLE combats 
ADD COLUMN IF NOT EXISTS player1_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS player2_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS damage_dealt INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS critical_hits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gold_reward INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_loss INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS item_dropped_id UUID REFERENCES items(id),
ADD COLUMN IF NOT EXISTS level_difference INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_rewards BOOLEAN DEFAULT FALSE;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_combats_winner_id ON combats(winner_id);
CREATE INDEX IF NOT EXISTS idx_combats_created_at ON combats(created_at);
CREATE INDEX IF NOT EXISTS idx_combats_level_difference ON combats(level_difference);

-- Función para obtener historial de combates de un usuario
CREATE OR REPLACE FUNCTION get_user_combat_history(user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  combat_id UUID,
  opponent_name TEXT,
  won BOOLEAN,
  combat_duration INTEGER,
  damage_dealt INTEGER,
  gold_reward INTEGER,
  xp_reward INTEGER,
  xp_loss INTEGER,
  item_name TEXT,
  item_rarity TEXT,
  level_difference INTEGER,
  no_rewards BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as combat_id,
    CASE 
      WHEN c.player1_id = user_id THEN p2.name
      ELSE p1.name
    END as opponent_name,
    (c.winner_id = user_id) as won,
    c.combat_duration,
    c.damage_dealt,
    c.gold_reward,
    c.xp_reward,
    c.xp_loss,
    i.name as item_name,
    i.rarity as item_rarity,
    c.level_difference,
    c.no_rewards,
    c.created_at
  FROM combats c
  LEFT JOIN players p1 ON p1.user_id = c.player1_id
  LEFT JOIN players p2 ON p2.user_id = c.player2_id
  LEFT JOIN items i ON i.id = c.item_dropped_id
  WHERE c.player1_id = user_id OR c.player2_id = user_id
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de combate de un usuario
CREATE OR REPLACE FUNCTION get_user_combat_stats_summary(user_id UUID)
RETURNS TABLE(
  total_combats INTEGER,
  wins INTEGER,
  losses INTEGER,
  win_rate DECIMAL,
  total_gold_earned INTEGER,
  total_xp_earned INTEGER,
  total_xp_lost INTEGER,
  items_dropped INTEGER,
  avg_combat_duration DECIMAL,
  highest_damage_dealt INTEGER,
  total_critical_hits INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_combats,
    COUNT(CASE WHEN winner_id = user_id THEN 1 END)::INTEGER as wins,
    COUNT(CASE WHEN winner_id != user_id THEN 1 END)::INTEGER as losses,
    ROUND(
      COUNT(CASE WHEN winner_id = user_id THEN 1 END)::DECIMAL / 
      NULLIF(COUNT(*), 0) * 100, 2
    ) as win_rate,
    COALESCE(SUM(CASE WHEN winner_id = user_id THEN gold_reward ELSE 0 END), 0)::INTEGER as total_gold_earned,
    COALESCE(SUM(CASE WHEN winner_id = user_id THEN xp_reward ELSE 0 END), 0)::INTEGER as total_xp_earned,
    COALESCE(SUM(CASE WHEN winner_id != user_id THEN xp_loss ELSE 0 END), 0)::INTEGER as total_xp_lost,
    COUNT(CASE WHEN winner_id = user_id AND item_dropped_id IS NOT NULL THEN 1 END)::INTEGER as items_dropped,
    ROUND(AVG(combat_duration), 2) as avg_combat_duration,
    COALESCE(MAX(damage_dealt), 0)::INTEGER as highest_damage_dealt,
    COALESCE(SUM(critical_hits), 0)::INTEGER as total_critical_hits
  FROM combats
  WHERE player1_id = user_id OR player2_id = user_id;
END;
$$ LANGUAGE plpgsql;
