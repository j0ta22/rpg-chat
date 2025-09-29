-- Fix players table constraint for proper upsert functionality
-- This ensures the unique constraint matches the upsert onConflict parameter

-- First, check current constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'players' 
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- Drop the old constraint if it exists
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_name_key;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_name_user_unique;

-- Add the correct composite unique constraint
ALTER TABLE players 
ADD CONSTRAINT players_name_user_unique UNIQUE (name, user_id);

-- Verify the constraint was created correctly
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'players' 
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;
