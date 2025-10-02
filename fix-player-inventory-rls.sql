-- Fix RLS policies for player_inventory table
-- Check current policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'player_inventory' 
AND schemaname = 'public';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own inventory" ON player_inventory;
DROP POLICY IF EXISTS "Users can manage own inventory via player" ON player_inventory;
DROP POLICY IF EXISTS "Anyone can manage inventory" ON player_inventory;

-- Create new policies for player_inventory
-- Allow users to manage their own inventory via player_id
CREATE POLICY "Users can manage own inventory" ON player_inventory FOR ALL USING (auth.uid() = player_id);

-- Verify the new policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'player_inventory' 
AND schemaname = 'public'
ORDER BY policyname;
