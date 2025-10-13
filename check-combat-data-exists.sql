-- Verificar si existen datos de combates
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla combats existe y tiene datos
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'combats' AND table_schema = 'public') 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END as tabla_combats_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'combats' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM combats)::text
        ELSE 'N/A'
    END as total_combats;

-- 2. Si la tabla combats existe, ver su estructura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'combats' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver los últimos combates (si existen)
SELECT 
    id,
    player1_id,
    player2_id,
    winner_id,
    created_at,
    combat_duration
FROM combats 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar si hay datos en users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN total_wins > 0 OR total_losses > 0 THEN 1 END) as users_with_stats
FROM users;

-- 5. Ver usuarios con estadísticas
SELECT 
    id,
    username,
    total_wins,
    total_losses,
    win_rate,
    created_at
FROM users 
WHERE total_wins > 0 OR total_losses > 0
ORDER BY total_wins DESC;

-- 6. Buscar en players si hay datos de combates
SELECT 
    COUNT(*) as total_players,
    COUNT(CASE WHEN stats IS NOT NULL THEN 1 END) as players_with_stats
FROM players;

-- 7. Ver algunos players con stats
SELECT 
    id,
    name,
    user_id,
    stats,
    updated_at
FROM players 
WHERE stats IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- 8. Verificar si hay tablas con nombres similares
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name LIKE '%combat%' OR 
    table_name LIKE '%fight%' OR 
    table_name LIKE '%battle%' OR
    table_name LIKE '%match%' OR
    table_name LIKE '%game%'
)
ORDER BY table_name;
