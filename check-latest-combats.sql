-- Verificar combates más recientes y estadísticas actualizadas
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar combates más recientes
SELECT 
    id,
    player1_id,
    player2_id,
    winner_id,
    created_at,
    combat_duration,
    gold_reward,
    xp_reward
FROM combats 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Verificar estadísticas actuales de usuarios
SELECT 
    username,
    total_wins,
    total_losses,
    win_rate,
    gold,
    experience,
    updated_at
FROM users 
ORDER BY updated_at DESC;

-- 3. Contar combates por usuario
SELECT 
    u.username,
    COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as wins,
    COUNT(CASE WHEN c.player1_id = u.id OR c.player2_id = u.id THEN 1 END) as total_combats,
    u.total_wins as stored_wins,
    u.total_losses as stored_losses
FROM users u
LEFT JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
GROUP BY u.id, u.username, u.total_wins, u.total_losses
ORDER BY total_combats DESC;

-- 4. Verificar si hay inconsistencias
SELECT 
    u.username,
    u.total_wins as stored_wins,
    u.total_losses as stored_losses,
    COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as actual_wins,
    COUNT(CASE WHEN (c.player1_id = u.id OR c.player2_id = u.id) AND c.winner_id != u.id THEN 1 END) as actual_losses,
    CASE 
        WHEN u.total_wins != COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) THEN 'WINS MISMATCH'
        WHEN u.total_losses != COUNT(CASE WHEN (c.player1_id = u.id OR c.player2_id = u.id) AND c.winner_id != u.id THEN 1 END) THEN 'LOSSES MISMATCH'
        ELSE 'OK'
    END as status
FROM users u
LEFT JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
GROUP BY u.id, u.username, u.total_wins, u.total_losses
HAVING u.total_wins != COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) 
    OR u.total_losses != COUNT(CASE WHEN (c.player1_id = u.id OR c.player2_id = u.id) AND c.winner_id != u.id THEN 1 END);
