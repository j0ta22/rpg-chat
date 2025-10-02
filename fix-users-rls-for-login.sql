-- Fix RLS policies for users table to allow login functionality
-- The current policy only allows users to see their own data, but we need to allow
-- searching for any user during login process

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create new policies that allow:
-- 1. Anyone to search for users (for login)
-- 2. Users to update their own data
-- 3. Anyone to insert new users (for registration)

-- Allow anyone to view users (needed for login)
CREATE POLICY "Anyone can view users for login" ON users FOR SELECT USING (true);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Anyone can insert new users (for registration)
CREATE POLICY "Anyone can insert users for registration" ON users FOR INSERT WITH CHECK (true);

-- Verify the new policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;
