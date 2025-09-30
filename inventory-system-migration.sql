-- Migration for Advanced Inventory System
-- This adds level requirements, equipment slots, and item categories

-- Add level requirement and equipment slot to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS level_required INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS equipment_slot TEXT CHECK (equipment_slot IN ('helmet', 'chest', 'legs', 'boots', 'gloves', 'weapon', 'accessory', 'consumable'));

-- Update existing items with proper equipment slots and level requirements
UPDATE items SET 
  equipment_slot = CASE 
    WHEN item_type = 'weapon' THEN 'weapon'
    WHEN item_type = 'armor' THEN 'chest'
    WHEN item_type = 'accessory' THEN 'accessory'
    WHEN item_type = 'consumable' THEN 'consumable'
  END,
  level_required = CASE 
    WHEN rarity = 'common' THEN 1
    WHEN rarity = 'uncommon' THEN 4
    WHEN rarity = 'rare' THEN 8
    WHEN rarity = 'epic' THEN 12
    WHEN rarity = 'legendary' THEN 16
  END
WHERE equipment_slot IS NULL;

-- Add inventory size limit to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS inventory_size INTEGER DEFAULT 20;

-- Create equipment slots table for each user
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

-- Create index for user equipment
CREATE INDEX IF NOT EXISTS idx_user_equipment_user ON user_equipment(user_id);

-- Insert more diverse items with different level requirements
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Level 1-3 Items (Common)
('Leather Helmet', 'Basic head protection', 'armor', 'common', '{"defense": 2}', 5, '/items/leather_helmet.png', 1, 'helmet'),
('Cloth Shirt', 'Simple clothing', 'armor', 'common', '{"defense": 1}', 3, '/items/cloth_shirt.png', 1, 'chest'),
('Cotton Pants', 'Comfortable pants', 'armor', 'common', '{"defense": 1}', 3, '/items/cotton_pants.png', 1, 'legs'),
('Cloth Boots', 'Basic footwear', 'armor', 'common', '{"defense": 1, "speed": 1}', 4, '/items/cloth_boots.png', 1, 'boots'),
('Cloth Gloves', 'Simple hand protection', 'armor', 'common', '{"defense": 1}', 2, '/items/cloth_gloves.png', 1, 'gloves'),
('Wooden Sword', 'Basic training weapon', 'weapon', 'common', '{"attack": 3}', 8, '/Items Pack/weapons/common/wooden_sword.png', 1, 'weapon'),
('Leather Cap', 'Sturdy headgear', 'armor', 'common', '{"defense": 3}', 7, '/items/leather_cap.png', 2, 'helmet'),
('Leather Vest', 'Protective chest piece', 'armor', 'common', '{"defense": 4}', 10, '/items/leather_vest.png', 2, 'chest'),
('Leather Pants', 'Durable leg protection', 'armor', 'common', '{"defense": 3}', 8, '/items/leather_pants.png', 2, 'legs'),
('Leather Boots', 'Sturdy footwear', 'armor', 'common', '{"defense": 2, "speed": 2}', 9, '/items/leather_boots.png', 2, 'boots'),
('Leather Gloves', 'Protective handwear', 'armor', 'common', '{"defense": 2}', 6, '/items/leather_gloves.png', 2, 'gloves'),
('Iron Dagger', 'Sharp blade', 'weapon', 'common', '{"attack": 5}', 12, '/Items Pack/weapons/common/iron_dagger.png', 2, 'weapon'),

-- Level 4-7 Items (Uncommon)
('Chain Coif', 'Metal head protection', 'armor', 'uncommon', '{"defense": 6}', 15, '/items/chain_coif.png', 4, 'helmet'),
('Chain Mail', 'Heavy chest armor', 'armor', 'uncommon', '{"defense": 8, "speed": -1}', 20, '/items/chain_mail.png', 4, 'chest'),
('Chain Leggings', 'Metal leg protection', 'armor', 'uncommon', '{"defense": 6, "speed": -1}', 18, '/items/chain_leggings.png', 4, 'legs'),
('Chain Boots', 'Heavy footwear', 'armor', 'uncommon', '{"defense": 4, "speed": 1}', 16, '/items/chain_boots.png', 4, 'boots'),
('Chain Gauntlets', 'Metal hand protection', 'armor', 'uncommon', '{"defense": 4}', 14, '/items/chain_gauntlets.png', 4, 'gloves'),
('Steel Sword', 'Well-crafted blade', 'weapon', 'uncommon', '{"attack": 8}', 25, '/Items Pack/weapons/uncommon/steel_sword.png', 4, 'weapon'),
('Studded Leather Cap', 'Reinforced headgear', 'armor', 'uncommon', '{"defense": 5}', 12, '/items/studded_leather_cap.png', 5, 'helmet'),
('Studded Leather', 'Reinforced chest piece', 'armor', 'uncommon', '{"defense": 6, "speed": 1}', 18, '/items/studded_leather.png', 5, 'chest'),
('Studded Pants', 'Reinforced leg protection', 'armor', 'uncommon', '{"defense": 5, "speed": 1}', 15, '/items/studded_pants.png', 5, 'legs'),
('Studded Boots', 'Reinforced footwear', 'armor', 'uncommon', '{"defense": 3, "speed": 3}', 14, '/items/studded_boots.png', 5, 'boots'),
('Studded Gloves', 'Reinforced handwear', 'armor', 'uncommon', '{"defense": 3}', 11, '/items/studded_gloves.png', 5, 'gloves'),
('Mace', 'Heavy blunt weapon', 'weapon', 'uncommon', '{"attack": 10, "speed": -1}', 30, '/Items Pack/weapons/uncommon/mace.png', 5, 'weapon'),

-- Level 8-11 Items (Rare)
('Plate Helmet', 'Heavy head protection', 'armor', 'rare', '{"defense": 10}', 35, '/items/plate_helmet.png', 8, 'helmet'),
('Plate Armor', 'Heavy chest protection', 'armor', 'rare', '{"defense": 15, "speed": -2}', 50, '/items/plate_armor.png', 8, 'chest'),
('Plate Leggings', 'Heavy leg protection', 'armor', 'rare', '{"defense": 12, "speed": -2}', 45, '/items/plate_leggings.png', 8, 'legs'),
('Plate Boots', 'Heavy footwear', 'armor', 'rare', '{"defense": 8, "speed": -1}', 40, '/items/plate_boots.png', 8, 'boots'),
('Plate Gauntlets', 'Heavy hand protection', 'armor', 'rare', '{"defense": 8}', 35, '/items/plate_gauntlets.png', 8, 'gloves'),
('Broadsword', 'Powerful blade', 'weapon', 'rare', '{"attack": 15}', 60, '/Items Pack/weapons/rare/broadsword.png', 8, 'weapon'),
('Scale Helmet', 'Flexible head protection', 'armor', 'rare', '{"defense": 8, "speed": 1}', 30, '/items/scale_helmet.png', 9, 'helmet'),
('Scale Armor', 'Flexible chest protection', 'armor', 'rare', '{"defense": 12, "speed": 1}', 45, '/items/scale_armor.png', 9, 'chest'),
('Scale Leggings', 'Flexible leg protection', 'armor', 'rare', '{"defense": 10, "speed": 1}', 40, '/items/scale_leggings.png', 9, 'legs'),
('Scale Boots', 'Flexible footwear', 'armor', 'rare', '{"defense": 6, "speed": 2}', 35, '/items/scale_boots.png', 9, 'boots'),
('Scale Gloves', 'Flexible hand protection', 'armor', 'rare', '{"defense": 6}', 30, '/items/scale_gloves.png', 9, 'gloves'),
('Rapier', 'Fast piercing weapon', 'weapon', 'rare', '{"attack": 12, "speed": 3}', 55, '/Items Pack/weapons/rare/rapier.png', 9, 'weapon'),

-- Level 12-15 Items (Epic)
('Dragon Scale Helmet', 'Magical head protection', 'armor', 'epic', '{"defense": 15, "speed": 2}', 80, '/items/dragon_scale_helmet.png', 12, 'helmet'),
('Dragon Scale Armor', 'Magical chest protection', 'armor', 'epic', '{"defense": 20, "speed": 2}', 120, '/items/dragon_scale_armor.png', 12, 'chest'),
('Dragon Scale Leggings', 'Magical leg protection', 'armor', 'epic', '{"defense": 18, "speed": 2}', 110, '/items/dragon_scale_leggings.png', 12, 'legs'),
('Dragon Scale Boots', 'Magical footwear', 'armor', 'epic', '{"defense": 12, "speed": 4}', 100, '/items/dragon_scale_boots.png', 12, 'boots'),
('Dragon Scale Gloves', 'Magical hand protection', 'armor', 'epic', '{"defense": 12}', 90, '/items/dragon_scale_gloves.png', 12, 'gloves'),
('Dragon Slayer Sword', 'Legendary blade', 'weapon', 'epic', '{"attack": 25, "speed": 2}', 150, '/Items Pack/weapons/epic/dragon_slayer_sword.png', 12, 'weapon'),

-- Level 16+ Items (Legendary)
('Crown of Kings', 'Royal headpiece', 'armor', 'legendary', '{"defense": 20, "speed": 3, "attack": 5}', 200, '/items/crown_of_kings.png', 16, 'helmet'),
('Armor of the Ancients', 'Ancient chest protection', 'armor', 'legendary', '{"defense": 30, "speed": 3}', 300, '/items/armor_of_ancients.png', 16, 'chest'),
('Leggings of Power', 'Mystical leg protection', 'armor', 'legendary', '{"defense": 25, "speed": 3}', 280, '/items/leggings_of_power.png', 16, 'legs'),
('Boots of Swiftness', 'Magical footwear', 'armor', 'legendary', '{"defense": 15, "speed": 6}', 250, '/items/boots_of_swiftness.png', 16, 'boots'),
('Gauntlets of Might', 'Powerful hand protection', 'armor', 'legendary', '{"defense": 15, "attack": 8}', 220, '/items/gauntlets_of_might.png', 16, 'gloves'),
('Excalibur', 'The legendary sword', 'weapon', 'legendary', '{"attack": 40, "speed": 5}', 500, '/Items Pack/weapons/legendary/excalibur.png', 16, 'weapon'),

-- Consumables (no level requirement)
('Health Potion', 'Restores 50 HP', 'consumable', 'common', '{"health_restore": 50}', 10, '/items/health_potion.png', 1, 'consumable'),
('Strength Elixir', 'Temporarily increases attack', 'consumable', 'uncommon', '{"attack_boost": 10}', 25, '/items/strength_elixir.png', 1, 'consumable'),
('Speed Elixir', 'Temporarily increases speed', 'consumable', 'uncommon', '{"speed_boost": 5}', 20, '/items/speed_elixir.png', 1, 'consumable'),
('Defense Elixir', 'Temporarily increases defense', 'consumable', 'uncommon', '{"defense_boost": 8}', 22, '/items/defense_elixir.png', 1, 'consumable')

ON CONFLICT (name) DO NOTHING;

-- Create function to get user's equipped items
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
