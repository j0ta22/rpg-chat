-- Temporarily disable RLS for testing
-- This will allow full access to all tables for debugging

-- Disable RLS on all problematic tables
ALTER TABLE player_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('player_inventory', 'players', 'user_equipment')
AND schemaname = 'public'
ORDER BY tablename;
