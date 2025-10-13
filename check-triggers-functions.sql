-- Verificar triggers y funciones que deberían actualizar estadísticas
-- Ejecutar en Supabase SQL Editor

-- 1. Ver triggers en la tabla combats
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'combats'
AND event_object_schema = 'public';

-- 2. Ver funciones relacionadas con combates o rankings
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
    routine_name LIKE '%combat%' OR 
    routine_name LIKE '%ranking%' OR 
    routine_name LIKE '%win%' OR
    routine_name LIKE '%stats%'
)
ORDER BY routine_name;

-- 3. Ver si hay funciones para actualizar estadísticas de usuario
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- 4. Verificar si existe la función update_user_ranking_stats
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_user_ranking_stats';

-- 5. Ver políticas RLS en la tabla combats
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'combats'
AND schemaname = 'public';

-- 6. Ver si RLS está habilitado en combats
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'combats'
AND schemaname = 'public';
