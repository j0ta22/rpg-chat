-- Fix player_inventory table structure to include user_id column
-- This script will add the missing user_id column if it doesn't exist

-- Check current structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'player_inventory' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'player_inventory' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) THEN
        -- Add user_id column
        ALTER TABLE public.player_inventory 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Create index for better performance
        CREATE INDEX idx_player_inventory_user_id ON public.player_inventory(user_id);
        
        RAISE NOTICE 'Added user_id column to player_inventory table';
    ELSE
        RAISE NOTICE 'user_id column already exists in player_inventory table';
    END IF;
END $$;

-- Check if we need to populate user_id for existing records
-- This is a placeholder - you might need to populate this based on your data
-- For now, we'll just verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'player_inventory' 
AND table_schema = 'public'
ORDER BY ordinal_position;
