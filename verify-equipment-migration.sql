-- Verify Equipment Migration
-- Run this after executing fix-equipment-system.sql to verify everything is working

-- 1. Check if user_equipment table exists and structure
SELECT 
  'user_equipment table' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_equipment') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- 2. Check if items table has the required columns
SELECT 
  'items table columns' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'equipment_slot')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'level_required')
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- 3. Count items with proper equipment data
SELECT 
  'items with equipment data' as check_name,
  COUNT(*) as count
FROM items 
WHERE equipment_slot IS NOT NULL AND level_required IS NOT NULL;

-- 4. Show sample items by equipment slot
SELECT 
  equipment_slot,
  COUNT(*) as item_count,
  MIN(level_required) as min_level,
  MAX(level_required) as max_level
FROM items 
WHERE equipment_slot IS NOT NULL
GROUP BY equipment_slot
ORDER BY equipment_slot;

-- 5. Show sample items that can be equipped
SELECT 
  name,
  equipment_slot,
  level_required,
  rarity,
  item_type
FROM items 
WHERE equipment_slot != 'consumable'
ORDER BY level_required, name
LIMIT 15;

-- 6. Check if any users have equipment records
SELECT 
  'users with equipment' as check_name,
  COUNT(DISTINCT user_id) as user_count
FROM user_equipment;

