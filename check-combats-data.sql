-- Verificar datos en la tabla combats
-- Ejecutar en Supabase SQL Editor

-- 1. Contar registros en combats
SELECT COUNT(*) as total_combats FROM combats;

-- 2. Ver estructura de la tabla combats
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'combats' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver los últimos 10 combates
SELECT 
    id,
    player1_id,
    player2_id,
    winner_id,
    created_at,
    combat_duration,
    player1_level,
    player2_level
FROM combats 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar si hay usuarios en la tabla users
SELECT COUNT(*) as total_users FROM users;

-- 5. Ver algunos usuarios
SELECT 
    id,
    username,
    total_wins,
    total_losses,
    win_rate,
    created_at
FROM users 
LIMIT 5;

-- 6. Verificar si los IDs de combats coinciden con usuarios
SELECT 
    c.id as combat_id,
    c.player1_id,
    c.player2_id,
    c.winner_id,
    u1.username as player1_name,
    u2.username as player2_name,
    uw.username as winner_name,
    c.created_at
FROM combats c
LEFT JOIN users u1 ON u1.id = c.player1_id
LEFT JOIN users u2 ON u2.id = c.player2_id
LEFT JOIN users uw ON uw.id = c.winner_id
ORDER BY c.created_at DESC
LIMIT 10;

-- 7. Verificar estadísticas de usuarios vs combates
SELECT 
    u.id,
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate,
    (SELECT COUNT(*) FROM combats WHERE player1_id = u.id OR player2_id = u.id) as total_combats,
    (SELECT COUNT(*) FROM combats WHERE winner_id = u.id) as actual_wins,
    (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id) as actual_losses
FROM users u
WHERE EXISTS (SELECT 1 FROM combats WHERE player1_id = u.id OR player2_id = u.id)
ORDER BY (SELECT COUNT(*) FROM combats WHERE player1_id = u.id OR player2_id = u.id) DESC;
