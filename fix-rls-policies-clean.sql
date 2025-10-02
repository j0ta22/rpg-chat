-- Fix RLS Policies - Clean Version
-- This script removes all existing policies and recreates them properly

-- 1. Drop ALL existing policies on the affected tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on items table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'items')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.items';
    END LOOP;
    
    -- Drop all policies on player_inventory table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'player_inventory')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.player_inventory';
    END LOOP;
    
    -- Drop all policies on user_equipment table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_equipment')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_equipment';
    END LOOP;
    
    -- Drop all policies on weekly_champions table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'weekly_champions')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.weekly_champions';
    END LOOP;
    
    -- Drop all policies on combats table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'combats')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.combats';
    END LOOP;
END $$;

-- 2. Create new policies for items (everyone can read, only service can modify)
CREATE POLICY "items_select_policy" ON public.items
    FOR SELECT USING (true);

CREATE POLICY "items_modify_policy" ON public.items
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Create policies for player_inventory (users can only access their own)
CREATE POLICY "player_inventory_select_policy" ON public.player_inventory
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "player_inventory_insert_policy" ON public.player_inventory
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "player_inventory_update_policy" ON public.player_inventory
    FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "player_inventory_delete_policy" ON public.player_inventory
    FOR DELETE USING (auth.uid() = player_id);

-- 4. Create policies for user_equipment (users can only access their own)
CREATE POLICY "user_equipment_select_policy" ON public.user_equipment
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_equipment_insert_policy" ON public.user_equipment
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_equipment_update_policy" ON public.user_equipment
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_equipment_delete_policy" ON public.user_equipment
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create policies for weekly_champions (everyone can read, only service can modify)
CREATE POLICY "weekly_champions_select_policy" ON public.weekly_champions
    FOR SELECT USING (true);

CREATE POLICY "weekly_champions_modify_policy" ON public.weekly_champions
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Create policies for combats (users can only access their own combats)
CREATE POLICY "combats_select_policy" ON public.combats
    FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "combats_insert_policy" ON public.combats
    FOR INSERT WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "combats_update_policy" ON public.combats
    FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- 7. Verify the policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('items', 'player_inventory', 'user_equipment', 'weekly_champions', 'combats')
ORDER BY tablename, policyname;
