-- Create saved_players table if it doesn't exist
-- This table stores player characters created by users

-- Check if table exists first
DO $$
BEGIN
    -- Create saved_players table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_players' AND table_schema = 'public') THEN
        CREATE TABLE public.saved_players (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name VARCHAR(50) NOT NULL,
            avatar VARCHAR(50) NOT NULL,
            x INTEGER NOT NULL DEFAULT 100,
            y INTEGER NOT NULL DEFAULT 100,
            health INTEGER NOT NULL DEFAULT 100,
            max_health INTEGER NOT NULL DEFAULT 100,
            attack INTEGER NOT NULL DEFAULT 10,
            defense INTEGER NOT NULL DEFAULT 5,
            speed INTEGER NOT NULL DEFAULT 5,
            level INTEGER NOT NULL DEFAULT 1,
            experience INTEGER NOT NULL DEFAULT 0,
            gold INTEGER NOT NULL DEFAULT 100,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, name)
        );

        -- Create indexes
        CREATE INDEX idx_saved_players_user_id ON public.saved_players(user_id);
        CREATE INDEX idx_saved_players_name ON public.saved_players(name);

        -- Add RLS
        ALTER TABLE public.saved_players ENABLE ROW LEVEL SECURITY;

        -- Create policy for saved_players
        CREATE POLICY "saved_players_all_access" ON public.saved_players
            FOR ALL USING (auth.uid() = user_id);

        RAISE NOTICE 'saved_players table created successfully';
    ELSE
        RAISE NOTICE 'saved_players table already exists';
    END IF;
END $$;

-- Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'saved_players' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

