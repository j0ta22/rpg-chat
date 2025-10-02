-- Fix Equipment System - Complete Migration
-- This script fixes the equipment system by creating missing tables and updating item fields

-- 1. Create user_equipment table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  helmet_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  chest_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  legs_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  boots_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  gloves_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  weapon_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  accessory_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Create index for user equipment
CREATE INDEX IF NOT EXISTS idx_user_equipment_user ON user_equipment(user_id);

-- 3. Add missing columns to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS level_required INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS equipment_slot TEXT CHECK (equipment_slot IN ('helmet', 'chest', 'legs', 'boots', 'gloves', 'weapon', 'accessory', 'consumable'));

-- 4. Update existing items with proper equipment slots and level requirements
UPDATE items SET 
  equipment_slot = CASE 
    WHEN item_type = 'weapon' THEN 'weapon'
    WHEN item_type = 'armor' THEN 'chest'
    WHEN item_type = 'accessory' THEN 'accessory'
    WHEN item_type = 'consumable' THEN 'consumable'
    WHEN name ILIKE '%helmet%' OR name ILIKE '%crown%' OR name ILIKE '%cap%' THEN 'helmet'
    WHEN name ILIKE '%chest%' OR name ILIKE '%armor%' OR name ILIKE '%vest%' THEN 'chest'
    WHEN name ILIKE '%legs%' OR name ILIKE '%pants%' OR name ILIKE '%leggings%' THEN 'legs'
    WHEN name ILIKE '%boots%' OR name ILIKE '%shoes%' THEN 'boots'
    WHEN name ILIKE '%gloves%' OR name ILIKE '%gauntlets%' THEN 'gloves'
    WHEN name ILIKE '%necklace%' OR name ILIKE '%ring%' OR name ILIKE '%amulet%' THEN 'accessory'
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

-- 5. Add inventory size limit to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS inventory_size INTEGER DEFAULT 20;

-- 6. Create function to get user's equipped items
CREATE OR REPLACE FUNCTION get_user_equipment(user_id UUID)
RETURNS TABLE (
  slot TEXT,
  item_id UUID,
  item_name TEXT,
  item_description TEXT,
  item_rarity TEXT,
  stat_bonuses JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'helmet' as slot,
    ue.helmet_item_id as item_id,
    i.name as item_name,
    i.description as item_description,
    i.rarity as item_rarity,
    i.stat_bonuses as stat_bonuses
  FROM user_equipment ue
  LEFT JOIN items i ON i.id = ue.helmet_item_id
  WHERE ue.user_id = get_user_equipment.user_id
  
  UNION ALL
  
  SELECT 
    'chest' as slot,
    ue.chest_item_id as item_id,
    i.name as item_name,
    i.description as item_description,
    i.rarity as item_rarity,
    i.stat_bonuses as stat_bonuses
  FROM user_equipment ue
  LEFT JOIN items i ON i.id = ue.chest_item_id
  WHERE ue.user_id = get_user_equipment.user_id
  
  UNION ALL
  
  SELECT 
    'legs' as slot,
    ue.legs_item_id as item_id,
    i.name as item_name,
    i.description as item_description,
    i.rarity as item_rarity,
    i.stat_bonuses as stat_bonuses
  FROM user_equipment ue
  LEFT JOIN items i ON i.id = ue.legs_item_id
  WHERE ue.user_id = get_user_equipment.user_id
  
  UNION ALL
  
  SELECT 
    'boots' as slot,
    ue.boots_item_id as item_id,
    i.name as item_name,
    i.description as item_description,
    i.rarity as item_rarity,
    i.stat_bonuses as stat_bonuses
  FROM user_equipment ue
  LEFT JOIN items i ON i.id = ue.boots_item_id
  WHERE ue.user_id = get_user_equipment.user_id
  
  UNION ALL
  
  SELECT 
    'gloves' as slot,
    ue.gloves_item_id as item_id,
    i.name as item_name,
    i.description as item_description,
    i.rarity as item_rarity,
    i.stat_bonuses as stat_bonuses
  FROM user_equipment ue
  LEFT JOIN items i ON i.id = ue.gloves_item_id
  WHERE ue.user_id = get_user_equipment.user_id
  
  UNION ALL
  
  SELECT 
    'weapon' as slot,
    ue.weapon_item_id as item_id,
    i.name as item_name,
    i.description as item_description,
    i.rarity as item_rarity,
    i.stat_bonuses as stat_bonuses
  FROM user_equipment ue
  LEFT JOIN items i ON i.id = ue.weapon_item_id
  WHERE ue.user_id = get_user_equipment.user_id
  
  UNION ALL
  
  SELECT 
    'accessory' as slot,
    ue.accessory_item_id as item_id,
    i.name as item_name,
    i.description as item_description,
    i.rarity as item_rarity,
    i.stat_bonuses as stat_bonuses
  FROM user_equipment ue
  LEFT JOIN items i ON i.id = ue.accessory_item_id
  WHERE ue.user_id = get_user_equipment.user_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Verify the migration was successful
-- Check if user_equipment table exists
SELECT 'user_equipment table exists' as status, COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_name = 'user_equipment';

-- Check items with their equipment_slot and level_required
SELECT 'Items with equipment data' as status, COUNT(*) as item_count
FROM items 
WHERE equipment_slot IS NOT NULL AND level_required IS NOT NULL;

-- Show sample items with their equipment slots
SELECT name, item_type, equipment_slot, level_required, rarity
FROM items 
WHERE equipment_slot IS NOT NULL 
ORDER BY level_required, name 
LIMIT 10;

