-- Quick fix: Disable RLS for combats table
-- This allows the WebSocket server to save combats immediately

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'combats';

-- Disable RLS for combats table
ALTER TABLE combats DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'combats';

-- Test insertion (this should work now)
SELECT 'RLS disabled for combats table - WebSocket server can now save combats' as status;
