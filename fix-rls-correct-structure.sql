-- RLS fix for the correct table structure
-- Based on: player_inventory.player_id -> users.id

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all public tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Disable RLS on all tables temporarily
ALTER TABLE IF EXISTS combats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_champions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS players DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS on all tables
ALTER TABLE IF EXISTS combats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS players ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies for testing
-- Items table - anyone can view
CREATE POLICY "Anyone can view items" ON items FOR SELECT USING (true);

-- Weekly champions - anyone can view
CREATE POLICY "Anyone can view weekly champions" ON weekly_champions FOR SELECT USING (true);

-- Users table - users can view and update their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Player inventory - users can manage their own inventory via player_id
CREATE POLICY "Users can manage own inventory" ON player_inventory FOR ALL USING (auth.uid() = player_id);

-- User equipment - check what column exists for user identification
DO $$
BEGIN
    -- Check if user_equipment has user_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_equipment' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) THEN
        CREATE POLICY "Users can manage own equipment" ON user_equipment FOR ALL USING (auth.uid() = user_id);
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_equipment' 
        AND column_name = 'player_id' 
        AND table_schema = 'public'
    ) THEN
        CREATE POLICY "Users can manage own equipment via player" ON user_equipment FOR ALL USING (auth.uid() = player_id);
    ELSE
        -- If no user identification column, make it very permissive for now
        CREATE POLICY "Anyone can manage equipment" ON user_equipment FOR ALL USING (true);
    END IF;
END $$;

-- Combats - users can view combats they participated in
CREATE POLICY "Users can view own combats" ON combats FOR SELECT USING (
    auth.uid() = player1_id OR auth.uid() = player2_id
);

-- Saved players - users can manage their own saved players
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_players' AND table_schema = 'public') THEN
        CREATE POLICY "Users can manage own saved players" ON saved_players FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Players table - users can manage their own players (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players' AND table_schema = 'public') THEN
        -- Check if players table has user_id column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name = 'user_id' 
            AND table_schema = 'public'
        ) THEN
            CREATE POLICY "Users can manage own players" ON players FOR ALL USING (auth.uid() = user_id);
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name = 'player_id' 
            AND table_schema = 'public'
        ) THEN
            CREATE POLICY "Users can manage own players via player_id" ON players FOR ALL USING (auth.uid() = player_id);
        ELSE
            CREATE POLICY "Anyone can manage players" ON players FOR ALL USING (true);
        END IF;
    END IF;
END $$;

-- Verification query
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
