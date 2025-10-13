-- Fix gold update permissions issue
-- Run this in Supabase SQL Editor

-- 1. Check RLS status on users table
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Check current RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Temporarily disable RLS to test updates
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 4. Test gold update with a specific user
-- Replace with your actual user ID
UPDATE users 
SET gold = 100, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 5. Verify the update worked
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 6. If the update worked, create proper RLS policies
-- Allow users to update their own gold
CREATE POLICY "Users can update their own gold" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role to update any user's gold (for WebSocket server)
CREATE POLICY "Service role can update any user gold" ON users
FOR UPDATE USING (true)
WITH CHECK (true);

-- 7. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 8. Test the update again with RLS enabled
UPDATE users 
SET gold = 150, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 9. Final verification
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 10. Show final RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';
