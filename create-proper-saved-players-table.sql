-- Create the saved_players table with proper structure
-- This script will create the table if it doesn't exist or fix it if it has wrong structure

-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS public.saved_players CASCADE;

-- Create the saved_players table with correct structure
CREATE TABLE public.saved_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    avatar VARCHAR(50) NOT NULL,
    x INTEGER NOT NULL DEFAULT 100,
    y INTEGER NOT NULL DEFAULT 150,
    health INTEGER NOT NULL DEFAULT 100,
    max_health INTEGER NOT NULL DEFAULT 100,
    attack INTEGER NOT NULL DEFAULT 10,
    defense INTEGER NOT NULL DEFAULT 5,
    speed INTEGER NOT NULL DEFAULT 5,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 100,
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create indexes for better performance
CREATE INDEX idx_saved_players_user_id ON public.saved_players(user_id);
CREATE INDEX idx_saved_players_name ON public.saved_players(name);
CREATE INDEX idx_saved_players_created_at ON public.saved_players(created_at);

-- Enable RLS
ALTER TABLE public.saved_players ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for saved_players
CREATE POLICY "Users can manage own saved players" ON public.saved_players
    FOR ALL USING (auth.uid() = user_id);

-- Verify the table was created correctly
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'saved_players' 
AND table_schema = 'public'
ORDER BY ordinal_position;
