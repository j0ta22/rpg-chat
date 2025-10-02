-- Check if there are players in the players table
SELECT 
    id,
    user_id,
    name,
    avatar,
    created_at
FROM players 
WHERE user_id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d'
ORDER BY created_at DESC;

-- Check if there are any players at all
SELECT COUNT(*) as total_players FROM players;

-- Check all players regardless of user
SELECT 
    user_id,
    name,
    avatar,
    created_at
FROM players 
ORDER BY created_at DESC
LIMIT 10;
