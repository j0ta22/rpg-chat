-- URGENT: Restore player inventories after economy balance update
-- This script fixes the issue where DELETE FROM items; broke player inventories

-- First, let's check the current state
SELECT 'Current state check:' as status;

-- Check if there are any items in the items table
SELECT COUNT(*) as items_count FROM items;

-- Check if there are any player inventory items
SELECT COUNT(*) as inventory_count FROM player_inventory;

-- Check if there are any broken references (items that don't exist)
SELECT COUNT(*) as broken_references 
FROM player_inventory pi 
LEFT JOIN items i ON pi.item_id = i.id 
WHERE i.id IS NULL;

-- If there are broken references, we need to clean them up
-- This will remove inventory items that reference non-existent items
DELETE FROM player_inventory 
WHERE item_id NOT IN (SELECT id FROM items);

-- Check if we need to restore items
-- If items table is empty, we need to restore the items with new prices
SELECT CASE 
  WHEN (SELECT COUNT(*) FROM items) = 0 
  THEN 'Items table is empty - need to restore items'
  ELSE 'Items table has data - inventories should be working'
END as items_status;

-- If items table is empty, restore items with balanced prices
-- (This is the same as the economy balance script but without DELETE FROM items)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) 
SELECT * FROM (VALUES
-- Common items (8-25 gold)
('Cloth Hood', 'Basic head protection', 'armor', 'common', '{"defense": 1}'::jsonb, 8, '/Items Pack/armor/common/cloth_hood.png', 1, 'helmet'),
('Cloth Robe', 'Simple clothing', 'armor', 'common', '{"defense": 2}'::jsonb, 12, '/Items Pack/armor/common/cloth_robe.png', 1, 'chest'),
('Cloth Pants', 'Comfortable pants', 'armor', 'common', '{"defense": 1}'::jsonb, 8, '/Items Pack/armor/common/cloth_pants.png', 1, 'legs'),
('Cloth Shoes', 'Basic footwear', 'armor', 'common', '{"defense": 1, "speed": 1}'::jsonb, 10, '/Items Pack/armor/common/cloth_shoes.png', 1, 'boots'),
('Cloth Gloves', 'Simple hand protection', 'armor', 'common', '{"defense": 1}'::jsonb, 6, '/Items Pack/armor/common/cloth_gloves.png', 1, 'gloves'),
('Leather Cap', 'Sturdy headgear', 'armor', 'common', '{"defense": 3}'::jsonb, 15, '/Items Pack/armor/common/leather_cap.png', 2, 'helmet'),
('Leather Jacket', 'Protective chest piece', 'armor', 'common', '{"defense": 4}'::jsonb, 20, '/Items Pack/armor/common/leather_jacket.png', 2, 'chest'),
('Leather Pants', 'Durable leg protection', 'armor', 'common', '{"defense": 3}'::jsonb, 18, '/Items Pack/armor/common/leather_pants.png', 2, 'legs'),
('Leather Boots', 'Sturdy footwear', 'armor', 'common', '{"defense": 2, "speed": 2}'::jsonb, 19, '/Items Pack/armor/common/leather_boots.png', 2, 'boots'),
('Leather Gloves', 'Protective handwear', 'armor', 'common', '{"defense": 2}'::jsonb, 14, '/Items Pack/armor/common/leather_gloves.png', 2, 'gloves'),
('Wooden Sword', 'Basic training weapon', 'weapon', 'common', '{"attack": 3}'::jsonb, 8, '/Items Pack/weapons/common/wooden_sword.png', 1, 'weapon'),
('Short Sword', 'A quick and agile blade', 'weapon', 'common', '{"attack": 4, "speed": 1}'::jsonb, 10, '/Items Pack/weapons/common/short_sword.png', 1, 'weapon'),
('Rusty Sword', 'A basic sword found in the tavern', 'weapon', 'common', '{"attack": 5}'::jsonb, 12, '/Items Pack/weapons/common/rusty_sword.png', 2, 'weapon'),
('Iron Dagger', 'Sharp blade for quick strikes', 'weapon', 'common', '{"attack": 5, "speed": 2}'::jsonb, 14, '/Items Pack/weapons/common/iron_dagger.png', 2, 'weapon'),
('Battle Axe', 'Heavy axe for powerful strikes', 'weapon', 'common', '{"attack": 6, "speed": -1}'::jsonb, 18, '/Items Pack/weapons/common/battle_axe.png', 2, 'weapon'),
('War Axe', 'Axe designed for combat', 'weapon', 'common', '{"attack": 7, "speed": -1}'::jsonb, 22, '/Items Pack/weapons/common/war_axe.png', 3, 'weapon'),
('Iron Mace', 'Heavy blunt weapon', 'weapon', 'common', '{"attack": 6, "speed": -1}'::jsonb, 16, '/Items Pack/weapons/common/iron_mace.png', 2, 'weapon'),
('Hunting Spear', 'Long reach weapon', 'weapon', 'common', '{"attack": 5, "speed": 1}'::jsonb, 14, '/Items Pack/weapons/common/hunting_spear.png', 2, 'weapon'),
('Iron Spear', 'Metal-tipped spear', 'weapon', 'common', '{"attack": 6, "speed": 1}'::jsonb, 18, '/Items Pack/weapons/common/iron_spear.png', 3, 'weapon'),
('War Hammer', 'Heavy hammer for crushing blows', 'weapon', 'common', '{"attack": 8, "speed": -2}'::jsonb, 25, '/Items Pack/weapons/common/war_hammer.png', 3, 'weapon'),
('Wooden Staff', 'Basic magical staff', 'weapon', 'common', '{"attack": 4, "health": 10}'::jsonb, 8, '/Items Pack/weapons/common/wooden_staff.png', 1, 'weapon'),
('Health Potion', 'Restores health', 'consumable', 'common', '{"health_restore": 50}'::jsonb, 8, '/Items Pack/potions/health_potion.png', 1, 'consumable'),
('Strength Elixir', 'Temporarily increases attack', 'consumable', 'common', '{"attack_boost": 5}'::jsonb, 12, '/Items Pack/potions/strength_elixir.png', 2, 'consumable'),
('Defense Elixir', 'Temporarily increases defense', 'consumable', 'common', '{"defense_boost": 5}'::jsonb, 12, '/Items Pack/potions/defense_elixir.png', 2, 'consumable'),
('Speed Elixir', 'Temporarily increases speed', 'consumable', 'common', '{"speed_boost": 5}'::jsonb, 12, '/Items Pack/potions/speed_elixir.png', 2, 'consumable'),
('Power Ring', 'Ring that enhances abilities', 'accessory', 'common', '{"attack": 2, "defense": 1}'::jsonb, 20, '/Items Pack/items/power_ring.png', 3, 'accessory')
) AS t(name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot)
WHERE NOT EXISTS (SELECT 1 FROM items LIMIT 1);

-- Final verification
SELECT 'Final verification:' as status;
SELECT COUNT(*) as items_restored FROM items;
SELECT COUNT(*) as inventory_items FROM player_inventory;
SELECT COUNT(*) as working_inventories 
FROM player_inventory pi 
JOIN items i ON pi.item_id = i.id;

-- Show any remaining broken references
SELECT 'Broken references (should be 0):' as status;
SELECT COUNT(*) as broken_references 
FROM player_inventory pi 
LEFT JOIN items i ON pi.item_id = i.id 
WHERE i.id IS NULL;
