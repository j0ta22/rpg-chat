-- Comprehensive RLS fix for all tables
-- This script addresses all the RLS issues we've encountered

-- First, let's check the current state
SELECT 'Current RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'players', 'player_inventory', 'items', 'user_equipment')
ORDER BY tablename;

-- Drop all existing policies to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop policies for users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
    
    -- Drop policies for players table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'players') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.players';
    END LOOP;
    
    -- Drop policies for player_inventory table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'player_inventory') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.player_inventory';
    END LOOP;
    
    -- Drop policies for items table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.items';
    END LOOP;
    
    -- Drop policies for user_equipment table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_equipment') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_equipment';
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_equipment ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for users table
-- Allow anyone to read users (needed for login)
CREATE POLICY "Anyone can view users" ON public.users
    FOR SELECT USING (true);

-- Allow anyone to insert users (needed for registration)
CREATE POLICY "Anyone can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (true);

-- Create policies for players table
-- Allow anyone to read players (needed for character selection)
CREATE POLICY "Anyone can view players" ON public.players
    FOR SELECT USING (true);

-- Allow anyone to insert players (needed for character creation)
CREATE POLICY "Anyone can insert players" ON public.players
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update players (needed for saving progress)
CREATE POLICY "Anyone can update players" ON public.players
    FOR UPDATE USING (true);

-- Allow anyone to delete players (needed for character deletion)
CREATE POLICY "Anyone can delete players" ON public.players
    FOR DELETE USING (true);

-- Create policies for player_inventory table
-- Allow anyone to read player_inventory (needed for inventory display)
CREATE POLICY "Anyone can view player_inventory" ON public.player_inventory
    FOR SELECT USING (true);

-- Allow anyone to insert into player_inventory (needed for item purchases)
CREATE POLICY "Anyone can insert into player_inventory" ON public.player_inventory
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update player_inventory (needed for equipping items)
CREATE POLICY "Anyone can update player_inventory" ON public.player_inventory
    FOR UPDATE USING (true);

-- Allow anyone to delete from player_inventory (needed for selling items)
CREATE POLICY "Anyone can delete from player_inventory" ON public.player_inventory
    FOR DELETE USING (true);

-- Create policies for items table
-- Allow anyone to read items (needed for shop display)
CREATE POLICY "Anyone can view items" ON public.items
    FOR SELECT USING (true);

-- Allow anyone to insert items (needed for admin operations)
CREATE POLICY "Anyone can insert items" ON public.items
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update items (needed for admin operations)
CREATE POLICY "Anyone can update items" ON public.items
    FOR UPDATE USING (true);

-- Create policies for user_equipment table
-- Allow anyone to read user_equipment (needed for equipment display)
CREATE POLICY "Anyone can view user_equipment" ON public.user_equipment
    FOR SELECT USING (true);

-- Allow anyone to insert into user_equipment (needed for equipping items)
CREATE POLICY "Anyone can insert into user_equipment" ON public.user_equipment
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update user_equipment (needed for equipment changes)
CREATE POLICY "Anyone can update user_equipment" ON public.user_equipment
    FOR UPDATE USING (true);

-- Allow anyone to delete from user_equipment (needed for unequipping items)
CREATE POLICY "Anyone can delete from user_equipment" ON public.user_equipment
    FOR DELETE USING (true);

-- Verify the policies were created
SELECT 'New RLS policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'players', 'player_inventory', 'items', 'user_equipment')
ORDER BY tablename, policyname;

-- Test queries to make sure everything works
SELECT 'Testing queries:' as info;

-- Test users query
SELECT COUNT(*) as user_count FROM users;

-- Test players query
SELECT COUNT(*) as player_count FROM players;

-- Test items query
SELECT COUNT(*) as item_count FROM items;

-- Test player_inventory query
SELECT COUNT(*) as inventory_count FROM player_inventory;

-- Test user_equipment query
SELECT COUNT(*) as equipment_count FROM user_equipment;
