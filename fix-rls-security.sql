-- Fix Row Level Security (RLS) for all public tables
-- This script enables RLS and creates appropriate policies for game tables

-- 1. Enable RLS on all public tables
ALTER TABLE public.combats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_equipment ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for combats table
-- Users can only see their own combat records
CREATE POLICY "Users can view their own combats" ON public.combats
    FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can insert their own combats" ON public.combats
    FOR INSERT WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can update their own combats" ON public.combats
    FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- 3. Create policies for items table
-- All authenticated users can read items (for shop/inventory)
CREATE POLICY "Authenticated users can view items" ON public.items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can modify items (for admin operations)
CREATE POLICY "Service role can modify items" ON public.items
    FOR ALL USING (auth.role() = 'service_role');

-- 4. Create policies for player_inventory table
-- Users can only access their own inventory
CREATE POLICY "Users can view their own inventory" ON public.player_inventory
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert to their own inventory" ON public.player_inventory
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own inventory" ON public.player_inventory
    FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "Users can delete from their own inventory" ON public.player_inventory
    FOR DELETE USING (auth.uid() = player_id);

-- 5. Create policies for weekly_champions table
-- All authenticated users can read champions (for rankings)
CREATE POLICY "Authenticated users can view weekly champions" ON public.weekly_champions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can modify champions
CREATE POLICY "Service role can modify weekly champions" ON public.weekly_champions
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Create policies for user_equipment table
-- Users can only access their own equipment
CREATE POLICY "Users can view their own equipment" ON public.user_equipment
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equipment" ON public.user_equipment
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment" ON public.user_equipment
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment" ON public.user_equipment
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create policies for users table (if not already exists)
-- Users can only access their own user record
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 8. Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('combats', 'items', 'player_inventory', 'weekly_champions', 'user_equipment', 'users')
ORDER BY tablename;
