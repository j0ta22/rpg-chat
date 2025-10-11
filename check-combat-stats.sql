-- Consulta completa de estadísticas de combates
-- Ejecutar en Supabase SQL Editor

-- 1. Usuarios y sus estadísticas actuales
SELECT 
    u.id,
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate,
    (u.total_wins + u.total_losses) as total_combats,
    u.created_at
FROM users u
ORDER BY u.win_rate DESC, u.total_wins DESC;

-- 2. Combates registrados (últimos 20)
SELECT 
    c.id,
    c.player1_id,
    c.player2_id,
    c.winner_id,
    c.combat_date,
    c.combat_duration,
    u1.username as player1_name,
    u2.username as player2_name,
    uw.username as winner_name,
    c.player1_stats,
    c.player2_stats
FROM combats c
LEFT JOIN users u1 ON u1.id = c.player1_id
LEFT JOIN users u2 ON u2.id = c.player2_id
LEFT JOIN users uw ON uw.id = c.winner_id
ORDER BY c.created_at DESC
LIMIT 20;

-- 3. Estadísticas generales
SELECT 
    COUNT(*) as total_combats,
    COUNT(CASE WHEN combat_date >= CURRENT_DATE THEN 1 END) as combats_today,
    COUNT(CASE WHEN combat_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as combats_this_week,
    COUNT(CASE WHEN combat_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as combats_this_month,
    MAX(combat_date) as latest_combat,
    MIN(combat_date) as earliest_combat,
    AVG(combat_duration) as avg_duration_seconds
FROM combats;

-- 4. Verificar consistencia de datos por usuario
SELECT 
    u.id,
    u.username,
    u.total_wins as stored_wins,
    u.total_losses as stored_losses,
    u.win_rate as stored_win_rate,
    COUNT(c.id) as actual_total_combats,
    COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as actual_wins,
    COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END) as actual_losses,
    CASE 
        WHEN COUNT(c.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN c.winner_id = u.id THEN 1 END)::decimal / COUNT(c.id)) * 100, 2)
        ELSE 0 
    END as actual_win_rate,
    CASE 
        WHEN u.total_wins = COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) 
        AND u.total_losses = COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END)
        THEN '✅ CONSISTENTE'
        ELSE '⚠️ INCONSISTENTE'
    END as data_consistency
FROM users u
LEFT JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
GROUP BY u.id, u.username, u.total_wins, u.total_losses, u.win_rate
ORDER BY actual_win_rate DESC, actual_wins DESC;

-- 5. Top 10 jugadores por win rate
SELECT 
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate,
    (u.total_wins + u.total_losses) as total_combats,
    ROW_NUMBER() OVER (ORDER BY u.win_rate DESC, u.total_wins DESC) as rank
FROM users u
WHERE u.total_wins > 0 OR u.total_losses > 0
ORDER BY u.win_rate DESC, u.total_wins DESC
LIMIT 10;

-- 6. Estadísticas de combates por día (últimos 7 días)
SELECT 
    DATE(combat_date) as combat_day,
    COUNT(*) as combats_count,
    COUNT(DISTINCT player1_id) + COUNT(DISTINCT player2_id) as unique_players,
    AVG(combat_duration) as avg_duration
FROM combats
WHERE combat_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(combat_date)
ORDER BY combat_day DESC;

-- 7. Verificar si las funciones RPC existen
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_player_rankings',
    'update_user_ranking_stats',
    'get_user_combat_history',
    'get_weekly_champions'
)
ORDER BY routine_name;

-- 8. Probar función de ranking (si existe)
-- SELECT * FROM get_player_rankings();

-- 9. Verificar estructura de tablas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'combats')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
