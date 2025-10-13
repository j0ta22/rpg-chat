-- Verificar combates específicos de beluga25 y Jota12
-- Ejecutar en Supabase SQL Editor

-- 1. Buscar usuarios específicos
SELECT id, username, total_wins, total_losses, win_rate, updated_at
FROM users 
WHERE username IN ('beluga25', 'Jota12', 'dumb')
ORDER BY username;

-- 2. Buscar combates entre estos usuarios
SELECT 
    c.id,
    c.created_at,
    p1.username as player1_name,
    p2.username as player2_name,
    winner.username as winner_name,
    c.combat_duration,
    c.gold_reward,
    c.xp_reward
FROM combats c
JOIN users p1 ON c.player1_id = p1.id
JOIN users p2 ON c.player2_id = p2.id
JOIN users winner ON c.winner_id = winner.id
WHERE p1.username IN ('beluga25', 'Jota12', 'dumb')
   OR p2.username IN ('beluga25', 'Jota12', 'dumb')
ORDER BY c.created_at DESC;

-- 3. Verificar estadísticas detalladas
SELECT 
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate,
    u.gold,
    u.experience,
    u.updated_at,
    -- Contar combates reales
    (SELECT COUNT(*) FROM combats WHERE winner_id = u.id) as actual_wins,
    (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id) as actual_losses,
    (SELECT COUNT(*) FROM combats WHERE player1_id = u.id OR player2_id = u.id) as total_combats
FROM users u
WHERE u.username IN ('beluga25', 'Jota12', 'dumb')
ORDER BY u.username;

-- 4. Verificar si hay combates recientes (últimas 2 horas)
SELECT 
    c.id,
    c.created_at,
    p1.username as player1_name,
    p2.username as player2_name,
    winner.username as winner_name,
    c.combat_duration
FROM combats c
JOIN users p1 ON c.player1_id = p1.id
JOIN users p2 ON c.player2_id = p2.id
JOIN users winner ON c.winner_id = winner.id
WHERE c.created_at >= NOW() - INTERVAL '2 hours'
ORDER BY c.created_at DESC;
