-- Consulta simple para verificar combats
-- Ejecutar en Supabase SQL Editor

-- 1. Contar combats (más simple)
SELECT COUNT(*) FROM combats;

-- 2. Ver si hay algún combate
SELECT * FROM combats LIMIT 1;

-- 3. Ver todos los combates (si son pocos)
SELECT * FROM combats ORDER BY created_at DESC;

-- 4. Verificar usuarios
SELECT COUNT(*) FROM users;

-- 5. Ver algunos usuarios
SELECT * FROM users LIMIT 3;
