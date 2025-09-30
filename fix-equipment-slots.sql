-- Fix Equipment Slots Migration
-- This ensures all items have the correct equipment_slot values

-- First, let's check what items we have and their current equipment_slot values
-- SELECT name, item_type, equipment_slot FROM items ORDER BY name;

-- Update items to have correct equipment_slot based on their names and types
UPDATE items SET equipment_slot = 'helmet' WHERE name LIKE '%helmet%' OR name LIKE '%cap%' OR name LIKE '%hood%' OR name LIKE '%crown%';
UPDATE items SET equipment_slot = 'chest' WHERE name LIKE '%armor%' OR name LIKE '%robe%' OR name LIKE '%jacket%' OR name LIKE '%vest%' OR name LIKE '%mail%';
UPDATE items SET equipment_slot = 'legs' WHERE name LIKE '%pants%' OR name LIKE '%leggings%' OR name LIKE '%trousers%';
UPDATE items SET equipment_slot = 'boots' WHERE name LIKE '%boots%' OR name LIKE '%shoes%' OR name LIKE '%greaves%';
UPDATE items SET equipment_slot = 'gloves' WHERE name LIKE '%gloves%' OR name LIKE '%gauntlets%';
UPDATE items SET equipment_slot = 'weapon' WHERE item_type = 'weapon';
UPDATE items SET equipment_slot = 'accessory' WHERE item_type = 'accessory';
UPDATE items SET equipment_slot = 'consumable' WHERE item_type = 'consumable';

-- Ensure all items have a valid equipment_slot
UPDATE items SET equipment_slot = 'consumable' WHERE equipment_slot IS NULL;

-- Verify the update
-- SELECT name, item_type, equipment_slot FROM items WHERE equipment_slot IS NULL;
