-- Test database connection and RLS status
-- Check if RLS is enabled on key tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'players', 'player_inventory', 'items')
ORDER BY tablename;

-- Check current RLS policies
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
WHERE tablename IN ('users', 'players', 'player_inventory', 'items')
ORDER BY tablename, policyname;

-- Test if we can query users table
SELECT COUNT(*) as user_count FROM users;

-- Test if we can query players table
SELECT COUNT(*) as player_count FROM players;

-- Check if there are any players for a specific user
SELECT 
    p.id,
    p.name,
    p.user_id,
    u.username
FROM players p
JOIN users u ON u.id = p.user_id
LIMIT 5;
