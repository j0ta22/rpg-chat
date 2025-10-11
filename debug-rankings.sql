-- Script SQL para debuggear el sistema de rankings
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar usuarios y sus estadísticas de combate
SELECT 
    u.id,
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate,
    u.created_at,
    CASE 
        WHEN u.total_wins IS NULL THEN 'total_wins is NULL'
        WHEN u.total_losses IS NULL THEN 'total_losses is NULL'
        WHEN u.win_rate IS NULL THEN 'win_rate is NULL'
        ELSE 'All columns exist'
    END as column_status
FROM users u
ORDER BY u.created_at DESC;

-- 2. Verificar combates
SELECT 
    c.id,
    c.player1_id,
    c.player2_id,
    c.winner_id,
    c.combat_date,
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

-- 3. Verificar estadísticas reales de combate por usuario
SELECT 
    u.id,
    u.username,
    u.total_wins as stored_wins,
    u.total_losses as stored_losses,
    u.win_rate as stored_win_rate,
    COUNT(c.id) as total_combats,
    COUNT(CASE WHEN c.winner_id = u.id THEN 1 END) as actual_wins,
    COUNT(CASE WHEN c.winner_id != u.id AND (c.player1_id = u.id OR c.player2_id = u.id) THEN 1 END) as actual_losses,
    CASE 
        WHEN COUNT(c.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN c.winner_id = u.id THEN 1 END)::decimal / COUNT(c.id)) * 100, 2)
        ELSE 0 
    END as actual_win_rate
FROM users u
LEFT JOIN combats c ON (c.player1_id = u.id OR c.player2_id = u.id)
GROUP BY u.id, u.username, u.total_wins, u.total_losses, u.win_rate
ORDER BY actual_win_rate DESC, actual_wins DESC;

-- 4. Verificar si las columnas de ranking existen en la tabla users
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

-- 5. Verificar estructura completa de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Contar total de combates
SELECT COUNT(*) as total_combats FROM combats;

-- 7. Verificar si hay combates recientes
SELECT 
    COUNT(*) as combats_today,
    COUNT(CASE WHEN combat_date >= CURRENT_DATE THEN 1 END) as combats_today_with_date,
    MAX(combat_date) as latest_combat_date,
    MIN(combat_date) as earliest_combat_date
FROM combats;
