-- Fix RLS Policies to Allow Proper Access
-- This script adjusts RLS policies to allow proper access to items and inventory

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view items" ON public.items;
DROP POLICY IF EXISTS "Service role can modify items" ON public.items;
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can insert to their own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can update their own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can delete from their own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can view their own equipment" ON public.user_equipment;
DROP POLICY IF EXISTS "Users can insert their own equipment" ON public.user_equipment;
DROP POLICY IF EXISTS "Users can update their own equipment" ON public.user_equipment;
DROP POLICY IF EXISTS "Users can delete their own equipment" ON public.user_equipment;

-- 2. Create more permissive policies for items (everyone can read items for shop)
CREATE POLICY "Anyone can view items" ON public.items
    FOR SELECT USING (true);

-- Only service role can modify items
CREATE POLICY "Service role can modify items" ON public.items
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Create policies for player_inventory (users can only access their own)
CREATE POLICY "Users can view their own inventory" ON public.player_inventory
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert to their own inventory" ON public.player_inventory
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own inventory" ON public.player_inventory
    FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Users can delete from their own inventory" ON public.player_inventory
    FOR DELETE USING (auth.uid() = player_id);

-- 4. Create policies for user_equipment (users can only access their own)
CREATE POLICY "Users can view their own equipment" ON public.user_equipment
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equipment" ON public.user_equipment
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment" ON public.user_equipment
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment" ON public.user_equipment
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create policies for weekly_champions (everyone can read for rankings)
DROP POLICY IF EXISTS "Authenticated users can view weekly champions" ON public.weekly_champions;
DROP POLICY IF EXISTS "Service role can modify weekly champions" ON public.weekly_champions;

CREATE POLICY "Anyone can view weekly champions" ON public.weekly_champions
    FOR SELECT USING (true);

CREATE POLICY "Service role can modify weekly champions" ON public.weekly_champions
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Verify the policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('items', 'player_inventory', 'user_equipment', 'weekly_champions')
ORDER BY tablename, policyname;
