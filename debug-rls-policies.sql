-- Debug RLS policies and test gold updates
-- Run this in Supabase SQL Editor

-- 1. Check RLS status on users table
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Check all RLS policies on users table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Check current user and gold values
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 4. Test if we can read the user data
SELECT id, gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 5. Test update with explicit user ID
UPDATE users 
SET gold = 17, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 6. Check if the update worked
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 7. If update failed, check if there are any triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 8. Check for any constraints on the gold column
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'users' 
  AND ccu.column_name = 'gold';

-- 9. Check the current user context
SELECT auth.uid() as current_user_id;

-- 10. Test update with different approach - use a transaction
BEGIN;
UPDATE users 
SET gold = 17, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
SELECT id, gold, updated_at FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
ROLLBACK;

-- 11. Check if there are any other policies that might be interfering
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
WHERE tablename = 'users'
ORDER BY policyname;
