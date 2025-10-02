-- Check if there are saved players for the specific user
SELECT 
    id,
    user_id,
    name,
    avatar,
    created_at
FROM saved_players 
WHERE user_id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d'
ORDER BY created_at DESC;

-- Check if there are any saved players at all
SELECT COUNT(*) as total_saved_players FROM saved_players;

-- Check if the user_id in saved_players matches the user's auth.users id
SELECT 
    sp.user_id as saved_players_user_id,
    u.id as users_table_id,
    u.username
FROM saved_players sp
JOIN users u ON u.id = sp.user_id
WHERE u.username = 'Jota12';
