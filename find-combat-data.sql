-- Buscar datos de combates en todas las tablas posibles
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las tablas y sus registros
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 2. Buscar columnas que contengan 'combat', 'fight', 'battle' en cualquier tabla
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (
    column_name LIKE '%combat%' OR 
    column_name LIKE '%fight%' OR 
    column_name LIKE '%battle%' OR
    column_name LIKE '%winner%' OR
    column_name LIKE '%player1%' OR
    column_name LIKE '%player2%'
)
ORDER BY table_name, column_name;

-- 3. Buscar columnas que contengan 'win', 'loss', 'rate' en cualquier tabla
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (
    column_name LIKE '%win%' OR 
    column_name LIKE '%loss%' OR 
    column_name LIKE '%rate%' OR
    column_name LIKE '%stats%'
)
ORDER BY table_name, column_name;

-- 4. Verificar si hay datos en players (tabla alternativa)
SELECT 
    COUNT(*) as total_players,
    COUNT(CASE WHEN stats IS NOT NULL THEN 1 END) as players_with_stats
FROM players;

-- 5. Ver algunos registros de players
SELECT id, name, user_id, stats, created_at, updated_at
FROM players 
ORDER BY updated_at DESC
LIMIT 5;

-- 6. Buscar en players si hay datos de combates en el campo stats
SELECT 
    name,
    stats,
    updated_at
FROM players 
WHERE stats IS NOT NULL
AND (
    stats::text LIKE '%combat%' OR 
    stats::text LIKE '%win%' OR 
    stats::text LIKE '%loss%' OR
    stats::text LIKE '%battle%'
)
ORDER BY updated_at DESC
LIMIT 10;

-- 7. Verificar si existe una tabla de historial o logs
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name LIKE '%history%' OR 
    table_name LIKE '%log%' OR 
    table_name LIKE '%event%' OR
    table_name LIKE '%match%' OR
    table_name LIKE '%game%'
)
ORDER BY table_name;
