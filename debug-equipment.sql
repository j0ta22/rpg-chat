-- Debug Equipment System
-- Run these queries to check the equipment system

-- 1. Check if user_equipment table exists and has data
SELECT * FROM user_equipment LIMIT 5;

-- 2. Check items and their equipment_slot values
SELECT name, item_type, equipment_slot, level_required FROM items ORDER BY name LIMIT 10;

-- 3. Check player inventory
SELECT pi.*, i.name, i.equipment_slot 
FROM player_inventory pi 
JOIN items i ON pi.item_id = i.id 
LIMIT 10;

-- 4. Check if a specific user has equipment
-- Replace 'USER_ID_HERE' with actual user ID
-- SELECT * FROM user_equipment WHERE user_id = 'USER_ID_HERE';

-- 5. Check items that can be equipped (not consumables)
SELECT name, equipment_slot, level_required 
FROM items 
WHERE equipment_slot != 'consumable' 
ORDER BY level_required, name;
