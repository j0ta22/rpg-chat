-- Corregir estadísticas de combates
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar estadísticas de legacy_user
UPDATE users 
SET 
    total_wins = (
        SELECT COUNT(*) 
        FROM combats 
        WHERE winner_id = users.id
    ),
    total_losses = (
        SELECT COUNT(*) 
        FROM combats 
        WHERE (player1_id = users.id OR player2_id = users.id) 
        AND winner_id != users.id
    ),
    updated_at = NOW()
WHERE username = 'legacy_user';

-- 2. Actualizar win_rate para legacy_user
UPDATE users 
SET 
    win_rate = CASE 
        WHEN (total_wins + total_losses) > 0 
        THEN ROUND((total_wins::DECIMAL / (total_wins + total_losses)) * 100, 2)
        ELSE 0 
    END
WHERE username = 'legacy_user';

-- 3. Verificar la corrección
SELECT 
    username,
    total_wins,
    total_losses,
    win_rate,
    updated_at
FROM users 
WHERE username = 'legacy_user';

-- 4. Actualizar TODAS las estadísticas de usuarios que han tenido combates
UPDATE users 
SET 
    total_wins = (
        SELECT COUNT(*) 
        FROM combats 
        WHERE winner_id = users.id
    ),
    total_losses = (
        SELECT COUNT(*) 
        FROM combats 
        WHERE (player1_id = users.id OR player2_id = users.id) 
        AND winner_id != users.id
    ),
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT player1_id FROM combats
    UNION
    SELECT DISTINCT player2_id FROM combats
);

-- 5. Actualizar win_rate para todos los usuarios
UPDATE users 
SET 
    win_rate = CASE 
        WHEN (total_wins + total_losses) > 0 
        THEN ROUND((total_wins::DECIMAL / (total_wins + total_losses)) * 100, 2)
        ELSE 0 
    END
WHERE id IN (
    SELECT DISTINCT player1_id FROM combats
    UNION
    SELECT DISTINCT player2_id FROM combats
);

-- 6. Verificar todas las estadísticas corregidas
SELECT 
    u.username,
    u.total_wins,
    u.total_losses,
    u.win_rate,
    u.updated_at,
    (SELECT COUNT(*) FROM combats WHERE winner_id = u.id) as actual_wins,
    (SELECT COUNT(*) FROM combats WHERE (player1_id = u.id OR player2_id = u.id) AND winner_id != u.id) as actual_losses
FROM users u
WHERE u.id IN (
    SELECT DISTINCT player1_id FROM combats
    UNION
    SELECT DISTINCT player2_id FROM combats
)
ORDER BY u.total_wins DESC;
