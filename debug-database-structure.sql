-- Debug: Verificar estructura de la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las tablas disponibles
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Ver estructura de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver estructura de la tabla combats (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'combats' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Contar registros en cada tabla
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'combats' as tabla, COUNT(*) as registros FROM combats
UNION ALL
SELECT 'players' as tabla, COUNT(*) as registros FROM players;

-- 5. Ver algunos registros de users
SELECT id, username, total_wins, total_losses, win_rate, created_at
FROM users 
LIMIT 5;

-- 6. Ver algunos registros de combats
SELECT id, player1_id, player2_id, winner_id, created_at
FROM combats 
LIMIT 5;

-- 7. Buscar tablas que contengan 'combat' en el nombre
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%combat%'
ORDER BY table_name;

-- 8. Buscar tablas que contengan 'player' en el nombre
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%player%'
ORDER BY table_name;
