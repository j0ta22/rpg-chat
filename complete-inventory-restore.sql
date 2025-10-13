-- COMPLETE INVENTORY RESTORE
-- This script restores all items with balanced prices after the economy update
-- Run this in Supabase SQL Editor to fix player inventories

-- Disable RLS temporarily
ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- Clear any existing items (in case the restore is run multiple times)
DELETE FROM items;

-- Insert all items with balanced prices
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES

-- ==============================================
-- COMMON ARMOR (Level 1-3) - 8-25 gold
-- ==============================================

-- Cloth Set
('Cloth Hood', 'Basic head protection', 'armor', 'common', '{"::jsonbdefense": 1}'::jsonb::jsonb, 8, '/Items Pack/armor/common/cloth_hood.png', 1, 'helmet'),
('Cloth Robe', 'Simple clothing', 'armor', 'common', '{"::jsonbdefense": 2}'::jsonb, 12, '/Items Pack/armor/common/cloth_robe.png', 1, 'chest'),
('Cloth Pants', 'Comfortable pants', 'armor', 'common', '{"::jsonbdefense": 1}'::jsonb, 8, '/Items Pack/armor/common/cloth_pants.png', 1, 'legs'),
('Cloth Shoes', 'Basic footwear', 'armor', 'common', '{"::jsonbdefense": 1, "speed": 1}'::jsonb, 10, '/Items Pack/armor/common/cloth_shoes.png', 1, 'boots'),
('Cloth Gloves', 'Simple hand protection', 'armor', 'common', '{"::jsonbdefense": 1}'::jsonb, 6, '/Items Pack/armor/common/cloth_gloves.png', 1, 'gloves'),

-- Leather Set
('Leather Cap', 'Sturdy headgear', 'armor', 'common', '{"::jsonbdefense": 3}', 15, '/Items Pack/armor/common/leather_cap.png', 2, 'helmet'),
('Leather Jacket', 'Protective chest piece', 'armor', 'common', '{"::jsonbdefense": 4}', 20, '/Items Pack/armor/common/leather_jacket.png', 2, 'chest'),
('Leather Pants', 'Durable leg protection', 'armor', 'common', '{"::jsonbdefense": 3}', 18, '/Items Pack/armor/common/leather_pants.png', 2, 'legs'),
('Leather Boots', 'Sturdy footwear', 'armor', 'common', '{"::jsonbdefense": 2, "speed": 2}', 19, '/Items Pack/armor/common/leather_boots.png', 2, 'boots'),
('Leather Gloves', 'Protective handwear', 'armor', 'common', '{"::jsonbdefense": 2}'::jsonb, 14, '/Items Pack/armor/common/leather_gloves.png', 2, 'gloves'),

-- ==============================================
-- UNCOMMON ARMOR (Level 4-7) - 30-50 gold
-- ==============================================

-- Studded Set
('Studded Helmet', 'Reinforced headgear', 'armor', 'uncommon', '{"::jsonbdefense": 5}', 30, '/Items Pack/armor/uncommon/studded_helmet.png', 4, 'helmet'),
('Studded Jacket', 'Reinforced chest piece', 'armor', 'uncommon', '{"::jsonbdefense": 6}', 35, '/Items Pack/armor/uncommon/studded_jacket_alt.png', 4, 'chest'),
('Studded Pants', 'Reinforced leg protection', 'armor', 'uncommon', '{"::jsonbdefense": 5}', 32, '/Items Pack/armor/uncommon/studded_pants.png', 4, 'legs'),
('Studded Boots', 'Reinforced footwear', 'armor', 'uncommon', '{"::jsonbdefense": 4, "speed": 1}', 33, '/Items Pack/armor/uncommon/studded_boots.png', 4, 'boots'),
('Studded Gloves', 'Reinforced handwear', 'armor', 'uncommon', '{"::jsonbdefense": 3}', 28, '/Items Pack/armor/uncommon/studded_gloves.png', 4, 'gloves'),

-- Chainmail Set
('Chain Coif', 'Metal head protection', 'armor', 'uncommon', '{"::jsonbdefense": 6}', 35, '/Items Pack/armor/uncommon/chainmail_coif.png', 5, 'helmet'),
('Chain Jacket', 'Metal chest protection', 'armor', 'uncommon', '{"::jsonbdefense": 7}', 40, '/Items Pack/armor/uncommon/chainmail_jacket.png', 5, 'chest'),
('Chain Pants', 'Metal leg protection', 'armor', 'uncommon', '{"::jsonbdefense": 6}', 38, '/Items Pack/armor/uncommon/chainmail_pants.png', 5, 'legs'),
('Chain Boots', 'Metal footwear', 'armor', 'uncommon', '{"::jsonbdefense": 5, "speed": 1}', 39, '/Items Pack/armor/uncommon/chainmail_boots.png', 5, 'boots'),
('Chain Gloves', 'Metal hand protection', 'armor', 'uncommon', '{"::jsonbdefense": 4}', 34, '/Items Pack/armor/uncommon/chainmail_gloves.png', 5, 'gloves'),

-- ==============================================
-- RARE ARMOR (Level 8-11) - 75-120 gold
-- ==============================================

-- Platemail Set
('Platemail Helmet', 'Heavy metal headgear', 'armor', 'rare', '{"::jsonbdefense": 8}', 75, '/Items Pack/armor/rare/platemail_helmet.png', 8, 'helmet'),
('Platemail Armor', 'Heavy metal chest piece', 'armor', 'rare', '{"::jsonbdefense": 10}', 90, '/Items Pack/armor/rare/platemail.png', 8, 'chest'),
('Platemail Pants', 'Heavy metal leg protection', 'armor', 'rare', '{"::jsonbdefense": 8}', 80, '/Items Pack/armor/rare/platemail_pants.png', 8, 'legs'),
('Platemail Greaves', 'Heavy metal footwear', 'armor', 'rare', '{"::jsonbdefense": 7, "speed": -1}', 82, '/Items Pack/armor/rare/greaves.png', 8, 'boots'),
('Platemail Gauntlets', 'Heavy metal hand protection', 'armor', 'rare', '{"::jsonbdefense": 6}', 70, '/Items Pack/armor/rare/gauntlets.png', 8, 'gloves'),

-- Scale Set
('Scale Helmet', 'Scaled head protection', 'armor', 'rare', '{"::jsonbdefense": 9}', 95, '/Items Pack/armor/rare/Scale_helmet.png', 9, 'helmet'),
('Scale Armor', 'Scaled chest piece', 'armor', 'rare', '{"::jsonbdefense": 11}', 110, '/Items Pack/armor/rare/Scale_armor.png', 9, 'chest'),
('Scale Pants', 'Scaled leg protection', 'armor', 'rare', '{"::jsonbdefense": 9}', 100, '/Items Pack/armor/rare/Scale_pants.png', 9, 'legs'),
('Scale Boots', 'Scaled footwear', 'armor', 'rare', '{"::jsonbdefense": 8, "speed": 1}', 102, '/Items Pack/armor/rare/Scale_boots.png', 9, 'boots'),
('Scale Gloves', 'Scaled hand protection', 'armor', 'rare', '{"::jsonbdefense": 7}', 90, '/Items Pack/armor/rare/Scale_gloves.png', 9, 'gloves'),

-- ==============================================
-- EPIC ARMOR (Level 12-15) - 150-250 gold
-- ==============================================

-- Dragon Scale Set
('Dragon Scale Helmet', 'Dragon scale headgear', 'armor', 'epic', '{"::jsonbdefense": 12, "attack": 2}', 150, '/Items Pack/armor/epic/dragon_scale_helmet.png', 12, 'helmet'),
('Dragon Scale Armor', 'Dragon scale chest piece', 'armor', 'epic', '{"::jsonbdefense": 15, "attack": 3}', 180, '/Items Pack/armor/epic/dragon_scale_armor.png', 12, 'chest'),
('Dragon Scale Leggings', 'Dragon scale leg protection', 'armor', 'epic', '{"::jsonbdefense": 12, "speed": 2}', 165, '/Items Pack/armor/epic/dragon_scale_leggings.png', 12, 'legs'),
('Dragon Scale Boots', 'Dragon scale footwear', 'armor', 'epic', '{"::jsonbdefense": 10, "speed": 3}', 160, '/Items Pack/armor/epic/dragon_scale_boots.png', 12, 'boots'),
('Dragon Scale Gloves', 'Dragon scale hand protection', 'armor', 'epic', '{"::jsonbdefense": 9, "attack": 2}', 145, '/Items Pack/armor/epic/dragon_scale_gloves.png', 12, 'gloves'),

-- ==============================================
-- LEGENDARY ARMOR (Level 16+) - 400-800 gold
-- ==============================================

-- Ancient Set
('Crown of Kings', 'Ancient royal headgear', 'armor', 'legendary', '{"::jsonbdefense": 15, "attack": 5, "speed": 3}', 400, '/Items Pack/armor/legendary/crown_of_kings.png', 16, 'helmet'),
('Armor of Ancients', 'Ancient royal chest piece', 'armor', 'legendary', '{"::jsonbdefense": 20, "attack": 5, "health": 50}', 500, '/Items Pack/armor/legendary/armor_of_ancients.png', 16, 'chest'),
('Leggings of Power', 'Ancient royal leg protection', 'armor', 'legendary', '{"::jsonbdefense": 15, "speed": 5, "health": 30}', 450, '/Items Pack/armor/legendary/leggings_of_power.png', 16, 'legs'),
('Boots of Swiftness', 'Ancient royal footwear', 'armor', 'legendary', '{"::jsonbdefense": 12, "speed": 8, "attack": 2}', 420, '/Items Pack/armor/legendary/boots_of_swiftness.png', 16, 'boots'),
('Gauntlets of Might', 'Ancient royal hand protection', 'armor', 'legendary', '{"::jsonbdefense": 12, "attack": 8, "health": 20}', 380, '/Items Pack/armor/legendary/gauntlets_of_might.png', 16, 'gloves'),

-- ==============================================
-- WEAPONS - Balanced pricing
-- ==============================================

-- Common Weapons (8-25 gold)
('Wooden Sword', 'Basic training weapon', 'weapon', 'common', '{"::jsonbattack": 3}', 8, '/Items Pack/weapons/common/wooden_sword.png', 1, 'weapon'),
('Short Sword', 'A quick and agile blade', 'weapon', 'common', '{"::jsonbattack": 4, "speed": 1}', 10, '/Items Pack/weapons/common/short_sword.png', 1, 'weapon'),
('Rusty Sword', 'A basic sword found in the tavern', 'weapon', 'common', '{"::jsonbattack": 5}', 12, '/Items Pack/weapons/common/rusty_sword.png', 2, 'weapon'),
('Iron Dagger', 'Sharp blade for quick strikes', 'weapon', 'common', '{"::jsonbattack": 5, "speed": 2}', 14, '/Items Pack/weapons/common/iron_dagger.png', 2, 'weapon'),
('Battle Axe', 'Heavy axe for powerful strikes', 'weapon', 'common', '{"::jsonbattack": 6, "speed": -1}', 18, '/Items Pack/weapons/common/battle_axe.png', 2, 'weapon'),
('War Axe', 'Axe designed for combat', 'weapon', 'common', '{"::jsonbattack": 7, "speed": -1}', 22, '/Items Pack/weapons/common/war_axe.png', 3, 'weapon'),
('Iron Mace', 'Heavy blunt weapon', 'weapon', 'common', '{"::jsonbattack": 6, "speed": -1}', 16, '/Items Pack/weapons/common/iron_mace.png', 2, 'weapon'),
('Hunting Spear', 'Long reach weapon', 'weapon', 'common', '{"::jsonbattack": 5, "speed": 1}', 14, '/Items Pack/weapons/common/hunting_spear.png', 2, 'weapon'),
('Iron Spear', 'Metal-tipped spear', 'weapon', 'common', '{"::jsonbattack": 6, "speed": 1}', 18, '/Items Pack/weapons/common/iron_spear.png', 3, 'weapon'),
('War Hammer', 'Heavy hammer for crushing blows', 'weapon', 'common', '{"::jsonbattack": 8, "speed": -2}', 25, '/Items Pack/weapons/common/war_hammer.png', 3, 'weapon'),
('Wooden Staff', 'Basic magical staff', 'weapon', 'common', '{"::jsonbattack": 4, "health": 10}', 8, '/Items Pack/weapons/common/wooden_staff.png', 1, 'weapon'),

-- Uncommon Weapons (30-50 gold)
('Steel Sword', 'Well-crafted steel blade', 'weapon', 'uncommon', '{"::jsonbattack": 8, "speed": 1}', 30, '/Items Pack/weapons/uncommon/steel_sword.png', 4, 'weapon'),
('Longsword', 'Longer blade for extended reach', 'weapon', 'uncommon', '{"::jsonbattack": 9, "speed": 0}', 35, '/Items Pack/weapons/uncommon/longsword.png', 5, 'weapon'),
('Bastard Sword', 'Versatile two-handed blade', 'weapon', 'uncommon', '{"::jsonbattack": 10, "speed": -1}', 40, '/Items Pack/weapons/uncommon/bastard_sword.png', 5, 'weapon'),
('Iron Blade', 'Refined iron weapon', 'weapon', 'uncommon', '{"::jsonbattack": 7, "speed": 2}', 28, '/Items Pack/weapons/uncommon/iron_blade.png', 4, 'weapon'),
('Berserker Axe', 'Fierce combat axe', 'weapon', 'uncommon', '{"::jsonbattack": 9, "speed": -1}', 32, '/Items Pack/weapons/uncommon/berserker_axe.png', 4, 'weapon'),
('Battle Axe Plus', 'Enhanced battle axe', 'weapon', 'uncommon', '{"::jsonbattack": 10, "speed": -1}', 35, '/Items Pack/weapons/uncommon/battle_axe_plus.png', 5, 'weapon'),
('Mace', 'Heavy blunt weapon', 'weapon', 'uncommon', '{"::jsonbattack": 8, "speed": -1}', 30, '/Items Pack/weapons/uncommon/mace.png', 4, 'weapon'),
('Maul', 'Massive hammer', 'weapon', 'uncommon', '{"::jsonbattack": 11, "speed": -2}', 45, '/Items Pack/weapons/uncommon/maul.png', 5, 'weapon'),
('Spiked Mace', 'Spiked blunt weapon', 'weapon', 'uncommon', '{"::jsonbattack": 9, "speed": -1}', 33, '/Items Pack/weapons/uncommon/spiked_mace.png', 4, 'weapon'),

-- Rare Weapons (75-120 gold)
('Broadsword', 'Wide heavy blade', 'weapon', 'rare', '{"::jsonbattack": 12, "speed": -1}', 75, '/Items Pack/weapons/rare/broadsword.png', 8, 'weapon'),
('Claymore', 'Large two-handed sword', 'weapon', 'rare', '{"::jsonbattack": 14, "speed": -2}', 90, '/Items Pack/weapons/rare/claymore.png', 8, 'weapon'),
('Rapier', 'Elegant thrusting sword', 'weapon', 'rare', '{"::jsonbattack": 10, "speed": 3}', 80, '/Items Pack/weapons/rare/rapier.png', 8, 'weapon'),
('Zweihander', 'Massive two-handed sword', 'weapon', 'rare', '{"::jsonbattack": 16, "speed": -3}', 110, '/Items Pack/weapons/rare/zweihander.png', 9, 'weapon'),
('Berserker War Axe', 'Fierce two-handed axe', 'weapon', 'rare', '{"::jsonbattack": 13, "speed": -2}', 85, '/Items Pack/weapons/rare/berserker_war_axe.png', 8, 'weapon'),
('Executioner Axe', 'Heavy execution axe', 'weapon', 'rare', '{"::jsonbattack": 15, "speed": -2}', 100, '/Items Pack/weapons/rare/executioner_axe.png', 9, 'weapon'),
('Flanged Mace', 'Heavy spiked mace', 'weapon', 'rare', '{"::jsonbattack": 12, "speed": -1}', 75, '/Items Pack/weapons/rare/flanged_mace.png', 8, 'weapon'),

-- Epic Weapons (150-250 gold)
('Dragon Slayer Sword', 'Legendary dragon-slaying blade', 'weapon', 'epic', '{"::jsonbattack": 18, "speed": 2, "health": 30}', 200, '/Items Pack/weapons/epic/dragon_slayer_sword.png', 12, 'weapon'),
('Brutal War Axe', 'Savage two-handed axe', 'weapon', 'epic', '{"::jsonbattack": 20, "speed": -1, "attack": 2}', 220, '/Items Pack/weapons/epic/brutal_war_axe.png', 12, 'weapon'),
('Thunder Hammer', 'Hammer that crackles with energy', 'weapon', 'epic', '{"::jsonbattack": 16, "speed": -1, "health": 20}', 180, '/Items Pack/weapons/epic/thunder_hammer.png', 12, 'weapon'),
('Kris Dagger', 'Mystical wavy dagger', 'weapon', 'epic', '{"::jsonbattack": 12, "speed": 4, "attack": 3}', 170, '/Items Pack/weapons/epic/kris_dagger.png', 12, 'weapon'),
('Lava War Axe', 'Axe forged in volcanic fire', 'weapon', 'epic', '{"::jsonbattack": 19, "speed": -1, "health": 25}', 210, '/Items Pack/weapons/epic/lava_war_axe.png', 12, 'weapon'),

-- Legendary Weapons (400-800 gold)
('Excalibur', 'The legendary sword of kings', 'weapon', 'legendary', '{"::jsonbattack": 25, "speed": 3, "health": 50, "attack": 5}', 600, '/Items Pack/weapons/legendary/excalibur.png', 16, 'weapon'),
('Dragon Slayer', 'Ultimate dragon-slaying weapon', 'weapon', 'legendary', '{"::jsonbattack": 28, "speed": 2, "health": 60, "attack": 6}', 700, '/Items Pack/weapons/legendary/dragon_slayer.png', 16, 'weapon'),
('Warlord Battle Axe', 'Axe of the greatest warlord', 'weapon', 'legendary', '{"::jsonbattack": 26, "speed": 1, "health": 40, "attack": 4}', 650, '/Items Pack/weapons/legendary/warlord_battle_axe.png', 16, 'weapon'),
('Molten War Mace', 'Mace forged in dragon fire', 'weapon', 'legendary', '{"::jsonbattack": 24, "speed": 0, "health": 45, "attack": 4}', 580, '/Items Pack/weapons/legendary/molten_war_mace.png', 16, 'weapon'),

-- ==============================================
-- ACCESSORIES - Balanced pricing
-- ==============================================

('Power Ring', 'Ring that enhances abilities', 'accessory', 'common', '{"::jsonbattack": 2, "defense": 1}', 20, '/Items Pack/items/power_ring.png', 3, 'accessory'),
('Necklace of the Eternal Wind', 'Mystical wind necklace', 'accessory', 'rare', '{"::jsonbspeed": 5, "health": 20}', 120, '/Items Pack/items/Necklace_of_the_Eternal_Wind.png', 8, 'accessory'),
('Crown of Power', 'Royal crown of immense power', 'accessory', 'legendary', '{"::jsonbattack": 8, "defense": 8, "speed": 4, "health": 100}', 800, '/Items Pack/items/crown.png', 16, 'accessory'),

-- ==============================================
-- CONSUMABLES - Affordable pricing
-- ==============================================

('Health Potion', 'Restores health', 'consumable', 'common', '{"::jsonbhealth_restore": 50}', 8, '/Items Pack/potions/health_potion.png', 1, 'consumable'),
('Strength Elixir', 'Temporarily increases attack', 'consumable', 'common', '{"::jsonbattack_boost": 5}', 12, '/Items Pack/potions/strength_elixir.png', 2, 'consumable'),
('Defense Elixir', 'Temporarily increases defense', 'consumable', 'common', '{"::jsonbdefense_boost": 5}', 12, '/Items Pack/potions/defense_elixir.png', 2, 'consumable'),
('Speed Elixir', 'Temporarily increases speed', 'consumable', 'common', '{"::jsonbspeed_boost": 5}', 12, '/Items Pack/potions/speed_elixir.png', 2, 'consumable');

-- Re-enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Final verification
SELECT 'INVENTORY RESTORE COMPLETE' as status;
SELECT COUNT(*) as items_restored FROM items;
SELECT COUNT(*) as inventory_items FROM player_inventory;
SELECT COUNT(*) as working_inventories 
FROM player_inventory pi 
JOIN items i ON pi.item_id = i.id;

-- Show pricing summary
SELECT 
  rarity,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price) as avg_price,
  COUNT(*) as item_count
FROM items 
GROUP BY rarity 
ORDER BY 
  CASE rarity 
    WHEN 'common' THEN 1
    WHEN 'uncommon' THEN 2
    WHEN 'rare' THEN 3
    WHEN 'epic' THEN 4
    WHEN 'legendary' THEN 5
  END;
