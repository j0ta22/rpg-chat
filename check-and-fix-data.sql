-- Check and fix data inconsistencies
-- This script helps identify and fix data issues

-- Check if there are any players without proper user_id
SELECT 'Players without user_id:' as info;
SELECT 
    id,
    name,
    user_id,
    created_at
FROM players 
WHERE user_id IS NULL OR user_id = '';

-- Check if there are any players with invalid user_id
SELECT 'Players with invalid user_id:' as info;
SELECT 
    p.id,
    p.name,
    p.user_id,
    u.username
FROM players p
LEFT JOIN users u ON u.id = p.user_id
WHERE u.id IS NULL;

-- Check all users and their players
SELECT 'All users and their players:' as info;
SELECT 
    u.id as user_id,
    u.username,
    COUNT(p.id) as player_count,
    STRING_AGG(p.name, ', ') as player_names
FROM users u
LEFT JOIN players p ON p.user_id = u.id
GROUP BY u.id, u.username
ORDER BY u.created_at DESC;

-- Check if there are any orphaned players (players without corresponding users)
SELECT 'Orphaned players:' as info;
SELECT 
    p.id,
    p.name,
    p.user_id,
    p.created_at
FROM players p
LEFT JOIN users u ON u.id = p.user_id
WHERE u.id IS NULL;

-- If you find orphaned players, you can either:
-- 1. Delete them (if they're not needed)
-- 2. Assign them to a specific user (if you know which user they belong to)

-- Example: Delete orphaned players (uncomment if needed)
-- DELETE FROM players 
-- WHERE user_id NOT IN (SELECT id FROM users);

-- Example: Assign orphaned players to a specific user (replace 'USER_ID_HERE' with actual user ID)
-- UPDATE players 
-- SET user_id = 'USER_ID_HERE' 
-- WHERE user_id IS NULL OR user_id = '';

-- Check player_inventory data
SELECT 'Player inventory data:' as info;
SELECT 
    pi.id,
    pi.player_id,
    pi.item_id,
    pi.quantity,
    p.name as player_name,
    u.username as user_name
FROM player_inventory pi
LEFT JOIN players p ON p.id = pi.player_id
LEFT JOIN users u ON u.id = p.user_id
LIMIT 10;

-- Check if there are any inventory items without proper player_id
SELECT 'Inventory items without player_id:' as info;
SELECT 
    pi.id,
    pi.player_id,
    pi.item_id,
    pi.quantity
FROM player_inventory pi
LEFT JOIN players p ON p.id = pi.player_id
WHERE p.id IS NULL;
