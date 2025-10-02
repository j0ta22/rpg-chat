-- Fix Equipment Data - Update items with proper equipment slots and level requirements
-- This script ensures all items have the correct equipment_slot and level_required values

-- First, let's check the current state
SELECT 
  'Current items status' as check_name,
  COUNT(*) as total_items,
  COUNT(CASE WHEN equipment_slot IS NOT NULL THEN 1 END) as items_with_slot,
  COUNT(CASE WHEN level_required IS NOT NULL THEN 1 END) as items_with_level
FROM items;

-- Update items with proper equipment slots based on their names and types
UPDATE items SET 
  equipment_slot = CASE 
    WHEN item_type = 'weapon' THEN 'weapon'
    WHEN item_type = 'armor' THEN 'chest'
    WHEN item_type = 'accessory' THEN 'accessory'
    WHEN item_type = 'consumable' THEN 'consumable'
    WHEN name ILIKE '%helmet%' OR name ILIKE '%crown%' OR name ILIKE '%cap%' OR name ILIKE '%hat%' THEN 'helmet'
    WHEN name ILIKE '%chest%' OR name ILIKE '%armor%' OR name ILIKE '%vest%' OR name ILIKE '%plate%' THEN 'chest'
    WHEN name ILIKE '%legs%' OR name ILIKE '%pants%' OR name ILIKE '%leggings%' OR name ILIKE '%trousers%' THEN 'legs'
    WHEN name ILIKE '%boots%' OR name ILIKE '%shoes%' OR name ILIKE '%footwear%' THEN 'boots'
    WHEN name ILIKE '%gloves%' OR name ILIKE '%gauntlets%' OR name ILIKE '%hand%' THEN 'gloves'
    WHEN name ILIKE '%necklace%' OR name ILIKE '%ring%' OR name ILIKE '%amulet%' OR name ILIKE '%pendant%' THEN 'accessory'
    ELSE 'weapon'
  END,
  level_required = CASE 
    WHEN rarity = 'common' THEN 1
    WHEN rarity = 'uncommon' THEN 4
    WHEN rarity = 'rare' THEN 8
    WHEN rarity = 'epic' THEN 12
    WHEN rarity = 'legendary' THEN 16
    ELSE 1
  END
WHERE equipment_slot IS NULL OR level_required IS NULL;

-- Verify the update
SELECT 
  'After update' as check_name,
  COUNT(*) as total_items,
  COUNT(CASE WHEN equipment_slot IS NOT NULL THEN 1 END) as items_with_slot,
  COUNT(CASE WHEN level_required IS NOT NULL THEN 1 END) as items_with_level
FROM items;

-- Show sample items by equipment slot
SELECT 
  equipment_slot,
  COUNT(*) as item_count,
  MIN(level_required) as min_level,
  MAX(level_required) as max_level
FROM items 
WHERE equipment_slot IS NOT NULL
GROUP BY equipment_slot
ORDER BY equipment_slot;

-- Show some sample items that can be equipped
SELECT 
  name,
  equipment_slot,
  level_required,
  rarity,
  item_type
FROM items 
WHERE equipment_slot != 'consumable'
ORDER BY level_required, name
LIMIT 10;
