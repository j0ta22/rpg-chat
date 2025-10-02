-- Check what tables exist and their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('saved_players', 'players', 'users', 'player_inventory')
ORDER BY table_name, ordinal_position;

-- Check if saved_players table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_players'
) as saved_players_exists;

-- Check if players table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'players'
) as players_exists;
