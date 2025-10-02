-- Check if saved_players table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'saved_players' 
ORDER BY ordinal_position;

-- Check RLS status for saved_players table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'saved_players';

-- Check existing policies on saved_players table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'saved_players';

-- Check if there are any saved players for any user
SELECT COUNT(*) as total_saved_players FROM saved_players;

-- Check if there are any users in the users table
SELECT COUNT(*) as total_users FROM users;

-- Check if there are any players in the players table
SELECT COUNT(*) as total_players FROM players;