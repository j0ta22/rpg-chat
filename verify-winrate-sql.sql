-- Verificación completa del almacenamiento del winrate
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
    total_wins,
    total_losses,
    win_rate,
    (total_wins + total_losses) as total_combats,
    created_at
FROM users 
WHERE total_wins > 0 OR total_losses > 0
ORDER BY win_rate DESC, total_wins DESC;

-- 3. Verificar consistencia de datos - Comparar datos almacenados vs calculados
WITH user_combat_stats AS (
    SELECT 
        u.id,
        u.username,
        u.total_wins as stored_wins,
        u.total_losses as stored_losses,
        u.win_rate as stored_win_rate,
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
        u.total_wins as stored_wins,
        u.total_losses as stored_losses,
        u.win_rate as stored_win_rate,
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
    ROUND(
        (COUNT(CASE WHEN stored_wins = actual_wins AND stored_losses = actual_losses THEN 1 END)::decimal / COUNT(*)) * 100, 
        2
    ) as consistency_percentage
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
    u.total_wins,
    u.total_losses,
    u.win_rate,
    COUNT(c.id) as total_combats,
    COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as actual_wins,
    COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END) as actual_losses
FROM users u
INNER JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
GROUP BY u.id, u.username, u.total_wins, u.total_losses, u.win_rate
HAVING 
    u.total_wins != COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) OR
    u.total_losses != COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END)
ORDER BY total_combats DESC;

-- 7. Función para actualizar estadísticas de un usuario específico (ejemplo)
-- SELECT update_user_ranking_stats('user_id_aqui');

-- 8. Verificar funciones RPC disponibles
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%ranking%' OR routine_name LIKE '%combat%'
ORDER BY routine_name;
