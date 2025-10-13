-- Test different approaches to update gold
-- Run this in Supabase SQL Editor

-- 1. First, let's see the current state
SELECT 'Current state:' as test_step;
SELECT id, gold, updated_at FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 2. Test approach 1: Simple update
SELECT 'Test 1: Simple update' as test_step;
UPDATE users 
SET gold = 17
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

SELECT id, gold, updated_at FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 3. Test approach 2: Update with explicit timestamp
SELECT 'Test 2: Update with timestamp' as test_step;
UPDATE users 
SET gold = 18, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

SELECT id, gold, updated_at FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 4. Test approach 3: Update using a subquery
SELECT 'Test 3: Update with subquery' as test_step;
UPDATE users 
SET gold = (SELECT gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d') - 1,
    updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

SELECT id, gold, updated_at FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 5. Test approach 4: Disable RLS temporarily and test
SELECT 'Test 4: Disable RLS temporarily' as test_step;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

UPDATE users 
SET gold = 20, updated_at = NOW()
WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

SELECT id, gold, updated_at FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 6. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Test approach 5: Check if the issue is with the specific user ID
SELECT 'Test 5: Check other users' as test_step;
SELECT id, gold FROM users LIMIT 3;

-- 8. Test approach 6: Try updating a different user
SELECT 'Test 6: Update different user' as test_step;
UPDATE users 
SET gold = 25, updated_at = NOW()
WHERE id = (SELECT id FROM users WHERE id != 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d' LIMIT 1);

-- 9. Final check
SELECT 'Final state:' as test_step;
SELECT id, gold, updated_at FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
