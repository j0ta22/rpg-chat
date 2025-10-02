-- Check if there are items in player_inventory for the user
SELECT 
    pi.id,
    pi.player_id,
    pi.item_id,
    pi.quantity,
    pi.equipped,
    i.name as item_name,
    i.rarity
FROM player_inventory pi
JOIN items i ON i.id = pi.item_id
WHERE pi.player_id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- Check if there are any items in player_inventory at all
SELECT COUNT(*) as total_inventory_items FROM player_inventory;

-- Check recent inventory entries
SELECT 
    pi.player_id,
    pi.item_id,
    pi.quantity,
    i.name as item_name
FROM player_inventory pi
JOIN items i ON i.id = pi.item_id
LIMIT 10;
