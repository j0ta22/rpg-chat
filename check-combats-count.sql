-- Verificar si hay combates pero las estadísticas no se actualizaron
-- Ejecutar en Supabase SQL Editor

-- 1. Contar combates
SELECT COUNT(*) as total_combats FROM combats;

-- 2. Ver todos los combates (si hay pocos)
SELECT 
    id,
    player1_id,
    player2_id,
    winner_id,
    created_at,
    combat_duration
FROM combats 
ORDER BY created_at DESC;

-- 3. Verificar si los IDs de los usuarios coinciden con los combates
SELECT 
    c.id as combat_id,
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
ORDER BY c.created_at DESC;

-- 4. Verificar si hay combates para los usuarios específicos
SELECT 
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate,
    (SELECT COUNT(*) FROM combats WHERE player1_id = u.id OR player2_id = u.id) as total_combats,
    (SELECT COUNT(*) FROM combats WHERE winner_id = u.id) as actual_wins,
    (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id) as actual_losses
FROM users u
WHERE u.username IN ('Guada Macho', 'Dividi2', 'legacy_user')
ORDER BY u.username;
