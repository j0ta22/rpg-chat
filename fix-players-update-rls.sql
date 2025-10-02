-- Fix RLS policies for players table to allow updates
-- Check current policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'players' 
AND schemaname = 'public';

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Users can manage own players" ON players;

-- Create new policies for players table
-- Allow anyone to view players (for character selection)
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);

-- Allow users to manage their own players (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can manage own players" ON players FOR ALL USING (auth.uid() = user_id);

-- Verify the new policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'players' 
AND schemaname = 'public'
ORDER BY policyname;
