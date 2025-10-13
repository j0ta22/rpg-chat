-- Check gold update issue in Supabase
-- Run this in Supabase SQL Editor

-- 1. Check users table structure and RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Check RLS policies on users table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Check current gold values for users with combat wins
SELECT 
  u.id,
  u.gold,
  u.total_wins,
  u.total_losses,
  u.updated_at,
  COUNT(c.id) as combat_count,
  SUM(c.gold_reward) as total_gold_earned
FROM users u
LEFT JOIN combats c ON c.winner_id = u.id
WHERE u.total_wins > 0 OR u.total_losses > 0
GROUP BY u.id, u.gold, u.total_wins, u.total_losses, u.updated_at
ORDER BY u.updated_at DESC;

-- 4. Test gold update with explicit user ID
-- Replace 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d' with your actual user ID
UPDATE users 
SET gold = 100, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 5. Verify the update
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 6. Check if there are any triggers on the users table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 7. Check for any constraints on the gold column
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'users' 
  AND ccu.column_name = 'gold';
