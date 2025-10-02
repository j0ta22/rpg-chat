-- Fix RLS policies for players table to allow access
-- Check current policies on players table
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'players' 
AND schemaname = 'public';

-- Drop existing policies on players table
DROP POLICY IF EXISTS "Users can manage own players" ON players;
DROP POLICY IF EXISTS "Users can manage own players via player_id" ON players;
DROP POLICY IF EXISTS "Anyone can manage players" ON players;

-- Create new policies for players table
-- Allow anyone to view players (needed for character selection)
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);

-- Users can manage their own players
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
