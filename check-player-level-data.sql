-- Check player level data
-- This script helps verify that player level data is correct

-- Check all players and their levels
SELECT 
    p.id,
    p.name,
    p.user_id,
    u.username,
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

-- Check if there are any players with missing or invalid level data
SELECT 
    p.id,
    p.name,
    p.user_id,
    u.username,
    p.stats,
    CASE 
        WHEN p.stats IS NULL THEN 'No stats'
        WHEN p.stats->>'level' IS NULL THEN 'No level in stats'
        WHEN (p.stats->>'level')::int IS NULL THEN 'Invalid level format'
        WHEN (p.stats->>'level')::int < 1 THEN 'Level too low'
        ELSE 'OK'
    END as level_status
FROM players p
JOIN users u ON u.id = p.user_id
WHERE p.stats IS NULL 
   OR p.stats->>'level' IS NULL 
   OR (p.stats->>'level')::int IS NULL 
   OR (p.stats->>'level')::int < 1;

-- Check items and their level requirements
SELECT 
    id,
    name,
    item_type,
    equipment_slot,
    level_required,
    price,
    rarity
FROM items 
WHERE equipment_slot != 'consumable'
ORDER BY level_required, name;

-- Check if there are any items with missing level_required
SELECT 
    id,
    name,
    item_type,
    equipment_slot,
    level_required,
    CASE 
        WHEN level_required IS NULL THEN 'Missing level_required'
        WHEN level_required < 1 THEN 'Invalid level_required'
        ELSE 'OK'
    END as level_required_status
FROM items 
WHERE equipment_slot != 'consumable'
  AND (level_required IS NULL OR level_required < 1);
