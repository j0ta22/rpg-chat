-- Test if we can access users table with current RLS policies
-- This should work for authenticated users
SELECT 
    id,
    username,
    created_at
FROM users
WHERE username = 'Jota12';

-- Check current RLS policies on users table
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Check if RLS is enabled on users table
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';
