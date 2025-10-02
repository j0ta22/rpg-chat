-- Comprehensive fix for all RLS issues
-- This script will fix RLS policies for all tables to ensure proper access

-- First, let's check what tables we have
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Drop all existing policies on all tables to start fresh
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

-- Create very permissive policies for testing (we'll tighten these later)
-- Items table - anyone can view
CREATE POLICY "Anyone can view items" ON items FOR SELECT USING (true);

-- Weekly champions - anyone can view
CREATE POLICY "Anyone can view weekly champions" ON weekly_champions FOR SELECT USING (true);

-- Users table - users can view and update their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Player inventory - users can manage their own inventory
CREATE POLICY "Users can manage own inventory" ON player_inventory FOR ALL USING (auth.uid() = user_id);

-- User equipment - users can manage their own equipment
CREATE POLICY "Users can manage own equipment" ON user_equipment FOR ALL USING (auth.uid() = user_id);

-- Combats - users can view combats they participated in
CREATE POLICY "Users can view own combats" ON combats FOR SELECT USING (
    auth.uid() = player1_id OR auth.uid() = player2_id
);

-- Saved players - users can manage their own saved players
CREATE POLICY "Users can manage own saved players" ON saved_players FOR ALL USING (auth.uid() = user_id);

-- Players table - users can manage their own players
CREATE POLICY "Users can manage own players" ON players FOR ALL USING (auth.uid() = user_id);

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