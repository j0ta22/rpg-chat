-- Diagnóstico completo del problema de rankings
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si hay usuarios
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN total_wins > 0 OR total_losses > 0 THEN 1 END) as users_with_combats
FROM users;

-- 2. Verificar si hay combates
SELECT 
    COUNT(*) as total_combats,
    COUNT(CASE WHEN winner_id IS NOT NULL THEN 1 END) as completed_combats,
    COUNT(CASE WHEN combat_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_combats
FROM combats;

-- 3. Verificar usuarios específicos y sus datos
SELECT 
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate,
    (u.total_wins + u.total_losses) as total_combats,
    u.created_at
FROM users u
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. Verificar combates específicos
SELECT 
    c.id,
    c.player1_id,
    c.player2_id,
    c.winner_id,
    c.combat_date,
    u1.username as player1_name,
    u2.username as player2_name,
    uw.username as winner_name
FROM combats c
LEFT JOIN users u1 ON u1.id = c.player1_id
LEFT JOIN users u2 ON u2.id = c.player2_id
LEFT JOIN users uw ON uw.id = c.winner_id
ORDER BY c.created_at DESC
LIMIT 10;

-- 5. Verificar si las funciones RPC existen y funcionan
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_player_rankings';

-- 6. Probar la función de ranking directamente
SELECT * FROM get_player_rankings();

-- 7. Verificar datos de combate por usuario (si hay combates)
WITH user_combat_stats AS (
    SELECT 
        u.id,
        u.username,
        COUNT(c.id) as actual_combats,
        COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as actual_wins,
        COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END) as actual_losses
    FROM users u
    LEFT JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
    GROUP BY u.id, u.username
)
SELECT 
    ucs.username,
    ucs.actual_combats,
    ucs.actual_wins,
    ucs.actual_losses,
    u.total_wins as stored_wins,
    u.total_losses as stored_losses,
    CASE 
        WHEN ucs.actual_combats > 0 THEN ROUND((ucs.actual_wins::decimal / ucs.actual_combats) * 100, 2)
        ELSE 0 
    END as calculated_win_rate,
    u.win_rate as stored_win_rate
FROM user_combat_stats ucs
JOIN users u ON u.id = ucs.id
WHERE ucs.actual_combats > 0
ORDER BY calculated_win_rate DESC;
