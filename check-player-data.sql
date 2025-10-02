-- Check player data specifically
-- This script helps verify player data and level information

-- Check all players and their detailed stats
SELECT 
    p.id,
    p.name,
    p.user_id,
    u.username,
    p.stats,
    p.stats->>'level' as player_level,
    p.stats->>'experience' as player_experience,
    p.stats->>'health' as player_health,
    p.stats->>'maxHealth' as player_max_health,
    p.stats->>'attack' as player_attack,
    p.stats->>'defense' as player_defense,
    p.stats->>'speed' as player_speed,
    p.created_at,
    p.updated_at
FROM players p
JOIN users u ON u.id = p.user_id
ORDER BY p.created_at DESC;

-- Check if there are any players with missing stats
SELECT 
    p.id,
    p.name,
    p.user_id,
    u.username,
    p.stats,
    CASE 
        WHEN p.stats IS NULL THEN 'No stats object'
        WHEN p.stats->>'level' IS NULL THEN 'No level in stats'
        WHEN (p.stats->>'level')::int IS NULL THEN 'Invalid level format'
        WHEN (p.stats->>'level')::int < 1 THEN 'Level too low'
        ELSE 'OK'
    END as level_status
FROM players p
JOIN users u ON u.id = p.user_id;

-- Check player inventory for a specific user (replace with actual user ID)
-- SELECT 
--     pi.id,
--     pi.player_id,
--     pi.item_id,
--     pi.quantity,
--     pi.equipped,
--     i.name as item_name,
--     i.equipment_slot,
--     i.level_required,
--     i.rarity
-- FROM player_inventory pi
-- JOIN items i ON i.id = pi.item_id
-- WHERE pi.player_id = 'USER_ID_HERE'
-- ORDER BY pi.created_at DESC;
