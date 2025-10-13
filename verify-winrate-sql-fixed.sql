-- Verificación completa del almacenamiento del winrate (VERSIÓN CORREGIDA)
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('total_wins', 'total_losses', 'win_rate')
ORDER BY ordinal_position;

-- 2. Estadísticas actuales de todos los usuarios
SELECT 
    id,
    username,
    COALESCE(total_wins, 0) as total_wins,
    COALESCE(total_losses, 0) as total_losses,
    COALESCE(win_rate, 0) as win_rate,
    (COALESCE(total_wins, 0) + COALESCE(total_losses, 0)) as total_combats,
    created_at
FROM users 
WHERE COALESCE(total_wins, 0) > 0 OR COALESCE(total_losses, 0) > 0
ORDER BY COALESCE(win_rate, 0) DESC, COALESCE(total_wins, 0) DESC;

-- 3. Verificar consistencia de datos - Comparar datos almacenados vs calculados
WITH user_combat_stats AS (
    SELECT 
        u.id,
        u.username,
        COALESCE(u.total_wins, 0) as stored_wins,
        COALESCE(u.total_losses, 0) as stored_losses,
        COALESCE(u.win_rate, 0) as stored_win_rate,
        COUNT(c.id) as actual_total_combats,
        COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as actual_wins,
        COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END) as actual_losses
    FROM users u
    LEFT JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
    GROUP BY u.id, u.username, u.total_wins, u.total_losses, u.win_rate
)
SELECT 
    username,
    stored_wins,
    stored_losses,
    stored_win_rate,
    actual_wins,
    actual_losses,
    actual_total_combats,
    CASE 
        WHEN actual_total_combats > 0 THEN 
            ROUND((actual_wins::decimal / actual_total_combats) * 100, 2)
        ELSE 0 
    END as calculated_win_rate,
    CASE 
        WHEN stored_wins = actual_wins 
        AND stored_losses = actual_losses
        AND ABS(stored_win_rate - CASE 
            WHEN actual_total_combats > 0 THEN 
                ROUND((actual_wins::decimal / actual_total_combats) * 100, 2)
            ELSE 0 
        END) < 0.01
        THEN '✅ CONSISTENTE'
        ELSE '⚠️ INCONSISTENTE'
    END as data_consistency,
    CASE 
        WHEN stored_wins != actual_wins OR stored_losses != actual_losses THEN
            'Actualizar: wins=' || actual_wins || ', losses=' || actual_losses || 
            ', win_rate=' || CASE 
                WHEN actual_total_combats > 0 THEN 
                    ROUND((actual_wins::decimal / actual_total_combats) * 100, 2)
                ELSE 0 
            END
        ELSE NULL
    END as update_needed
FROM user_combat_stats
WHERE actual_total_combats > 0 OR stored_wins > 0 OR stored_losses > 0
ORDER BY actual_wins DESC, calculated_win_rate DESC;

-- 4. Resumen de inconsistencias
WITH user_combat_stats AS (
    SELECT 
        u.id,
        u.username,
        COALESCE(u.total_wins, 0) as stored_wins,
        COALESCE(u.total_losses, 0) as stored_losses,
        COALESCE(u.win_rate, 0) as stored_win_rate,
        COUNT(c.id) as actual_total_combats,
        COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as actual_wins,
        COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END) as actual_losses
    FROM users u
    LEFT JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
    GROUP BY u.id, u.username, u.total_wins, u.total_losses, u.win_rate
)
SELECT 
    COUNT(*) as total_users_checked,
    COUNT(CASE WHEN stored_wins = actual_wins AND stored_losses = actual_losses THEN 1 END) as consistent_users,
    COUNT(CASE WHEN stored_wins != actual_wins OR stored_losses != actual_losses THEN 1 END) as inconsistent_users,
    CASE 
        WHEN COUNT(*) > 0 THEN
            ROUND(
                (COUNT(CASE WHEN stored_wins = actual_wins AND stored_losses = actual_losses THEN 1 END)::decimal / COUNT(*)) * 100, 
                2
            )
        ELSE 0
    END as consistency_percentage
FROM user_combat_stats
WHERE actual_total_combats > 0 OR stored_wins > 0 OR stored_losses > 0;

-- 5. Últimos combates para verificar que se están registrando
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

-- 6. Verificar si hay usuarios con combates pero sin estadísticas actualizadas
SELECT 
    u.id,
    u.username,
    COALESCE(u.total_wins, 0) as total_wins,
    COALESCE(u.total_losses, 0) as total_losses,
    COALESCE(u.win_rate, 0) as win_rate,
    COUNT(c.id) as total_combats,
    COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as actual_wins,
    COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END) as actual_losses
FROM users u
INNER JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
GROUP BY u.id, u.username, u.total_wins, u.total_losses, u.win_rate
HAVING 
    COALESCE(u.total_wins, 0) != COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) OR
    COALESCE(u.total_losses, 0) != COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END)
ORDER BY total_combats DESC;

-- 7. Consulta simple para verificar datos básicos (sin divisiones complejas)
SELECT 
    u.username,
    COALESCE(u.total_wins, 0) as wins,
    COALESCE(u.total_losses, 0) as losses,
    COALESCE(u.win_rate, 0) as win_rate,
    (SELECT COUNT(*) FROM combats WHERE winner_id = u.id) as actual_wins,
    (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id) as actual_losses
FROM users u
WHERE (SELECT COUNT(*) FROM combats WHERE player1_id = u.id OR player2_id = u.id) > 0
ORDER BY COALESCE(u.total_wins, 0) DESC;

-- 8. Verificar funciones RPC disponibles
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%ranking%' OR routine_name LIKE '%combat%')
ORDER BY routine_name;
