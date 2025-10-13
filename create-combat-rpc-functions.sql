-- Crear funciones RPC para actualizar estadísticas de combate
-- Ejecutar en Supabase SQL Editor

-- 1. Función para incrementar wins
CREATE OR REPLACE FUNCTION increment_wins(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET 
    total_wins = total_wins + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- 2. Función para incrementar losses
CREATE OR REPLACE FUNCTION increment_losses(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET 
    total_losses = total_losses + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- 3. Función para actualizar win rate
CREATE OR REPLACE FUNCTION update_win_rate(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wins INTEGER;
  user_losses INTEGER;
  total_combats INTEGER;
  calculated_win_rate DECIMAL(5,2);
BEGIN
  -- Obtener wins y losses actuales
  SELECT total_wins, total_losses 
  INTO user_wins, user_losses
  FROM users 
  WHERE id = user_id;
  
  -- Calcular win rate
  total_combats := user_wins + user_losses;
  
  IF total_combats > 0 THEN
    calculated_win_rate := ROUND((user_wins::DECIMAL / total_combats) * 100, 2);
  ELSE
    calculated_win_rate := 0;
  END IF;
  
  -- Actualizar win rate
  UPDATE users 
  SET 
    win_rate = calculated_win_rate,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- 4. Función completa para actualizar estadísticas de combate
CREATE OR REPLACE FUNCTION update_combat_stats(winner_id UUID, loser_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Incrementar wins del ganador
  UPDATE users 
  SET 
    total_wins = total_wins + 1,
    updated_at = NOW()
  WHERE id = winner_id;
  
  -- Incrementar losses del perdedor
  UPDATE users 
  SET 
    total_losses = total_losses + 1,
    updated_at = NOW()
  WHERE id = loser_id;
  
  -- Actualizar win rates de ambos
  PERFORM update_win_rate(winner_id);
  PERFORM update_win_rate(loser_id);
END;
$$;

-- 5. Verificar que las funciones se crearon correctamente
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('increment_wins', 'increment_losses', 'update_win_rate', 'update_combat_stats');
