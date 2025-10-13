-- Verificación SIMPLE del winrate (sin divisiones por cero)
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura básica
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('total_wins', 'total_losses', 'win_rate')
ORDER BY ordinal_position;

-- 2. Usuarios con estadísticas
SELECT 
    id,
    username,
    COALESCE(total_wins, 0) as total_wins,
    COALESCE(total_losses, 0) as total_losses,
    COALESCE(win_rate, 0) as win_rate
FROM users 
ORDER BY COALESCE(total_wins, 0) DESC, COALESCE(total_losses, 0) DESC;

-- 3. Combates registrados
SELECT 
    COUNT(*) as total_combats,
    COUNT(DISTINCT player1_id) + COUNT(DISTINCT player2_id) as unique_players_in_combats,
    MAX(created_at) as latest_combat,
    MIN(created_at) as earliest_combat
FROM combats;

-- 4. Últimos 10 combates
SELECT 
    c.id,
    c.player1_id,
    c.player2_id,
    c.winner_id,
    c.created_at,
    u1.username as player1_name,
    u2.username as player2_name,
    uw.username as winner_name
FROM combats c
LEFT JOIN users u1 ON u1.id = c.player1_id
LEFT JOIN users u2 ON u2.id = c.player2_id
LEFT JOIN users uw ON uw.id = c.winner_id
ORDER BY c.created_at DESC
LIMIT 10;

-- 5. Verificar usuarios que participaron en combates
SELECT 
    u.id,
    u.username,
    COALESCE(u.total_wins, 0) as stored_wins,
    COALESCE(u.total_losses, 0) as stored_losses,
    COALESCE(u.win_rate, 0) as stored_win_rate,
    (SELECT COUNT(*) FROM combats WHERE player1_id = u.id OR player2_id = u.id) as total_combats,
    (SELECT COUNT(*) FROM combats WHERE winner_id = u.id) as actual_wins,
    (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id) as actual_losses
FROM users u
WHERE EXISTS (SELECT 1 FROM combats WHERE player1_id = u.id OR player2_id = u.id)
ORDER BY (SELECT COUNT(*) FROM combats WHERE player1_id = u.id OR player2_id = u.id) DESC;

-- 6. Identificar inconsistencias (sin cálculos complejos)
SELECT 
    u.username,
    COALESCE(u.total_wins, 0) as stored_wins,
    COALESCE(u.total_losses, 0) as stored_losses,
    (SELECT COUNT(*) FROM combats WHERE winner_id = u.id) as actual_wins,
    (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id) as actual_losses,
    CASE 
        WHEN COALESCE(u.total_wins, 0) = (SELECT COUNT(*) FROM combats WHERE winner_id = u.id)
        AND COALESCE(u.total_losses, 0) = (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id)
        THEN '✅ CONSISTENTE'
        ELSE '⚠️ INCONSISTENTE'
    END as status
FROM users u
WHERE EXISTS (SELECT 1 FROM combats WHERE player1_id = u.id OR player2_id = u.id)
ORDER BY (SELECT COUNT(*) FROM combats WHERE player1_id = u.id OR player2_id = u.id) DESC;

-- 7. Resumen simple
SELECT 
    'Usuarios con combates' as metric,
    COUNT(*) as count
FROM users u
WHERE EXISTS (SELECT 1 FROM combats WHERE player1_id = u.id OR player2_id = u.id)

UNION ALL

SELECT 
    'Usuarios con estadísticas inconsistentes' as metric,
    COUNT(*) as count
FROM users u
WHERE EXISTS (SELECT 1 FROM combats WHERE player1_id = u.id OR player2_id = u.id)
AND (
    COALESCE(u.total_wins, 0) != (SELECT COUNT(*) FROM combats WHERE winner_id = u.id)
    OR COALESCE(u.total_losses, 0) != (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id)
)

UNION ALL

SELECT 
    'Total de combates' as metric,
    COUNT(*) as count
FROM combats;
