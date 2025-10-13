-- Check RLS policies and test gold updates
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

-- 3. Check current gold values
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 4. Test gold update with explicit user ID (replace with your actual user ID)
UPDATE users 
SET gold = 17, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 5. Verify the update
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 6. If update failed, temporarily disable RLS and test again
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 7. Test update with RLS disabled
UPDATE users 
SET gold = 17, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 8. Verify the update
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 9. If update worked, create proper RLS policies
CREATE POLICY "Users can update their own gold" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 10. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 11. Test update with RLS enabled
UPDATE users 
SET gold = 17, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 12. Final verification
SELECT id, gold, updated_at 
FROM users 
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 13. Show final RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';
