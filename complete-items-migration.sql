-- Complete Items Migration
-- This adds all available armor, accessories, and potions from Items Pack to the database

-- Common Armor (Level 1-3)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Cloth Set
('Cloth Hood', 'Basic head protection', 'armor', 'common', '{"defense": 1}', 3, '/Items Pack/armor/common/cloth_hood.png', 1, 'helmet'),
('Cloth Robe', 'Simple clothing', 'armor', 'common', '{"defense": 2}', 5, '/Items Pack/armor/common/cloth_robe.png', 1, 'chest'),
('Cloth Pants', 'Comfortable pants', 'armor', 'common', '{"defense": 1}', 3, '/Items Pack/armor/common/cloth_pants.png', 1, 'legs'),
('Cloth Shoes', 'Basic footwear', 'armor', 'common', '{"defense": 1, "speed": 1}', 4, '/Items Pack/armor/common/cloth_shoes.png', 1, 'boots'),
('Cloth Gloves', 'Simple hand protection', 'armor', 'common', '{"defense": 1}', 2, '/Items Pack/armor/common/cloth_gloves.png', 1, 'gloves'),

-- Leather Set
('Leather Cap', 'Sturdy headgear', 'armor', 'common', '{"defense": 3}', 7, '/Items Pack/armor/common/leather_cap.png', 2, 'helmet'),
('Leather Jacket', 'Protective chest piece', 'armor', 'common', '{"defense": 4}', 10, '/Items Pack/armor/common/leather_jacket.png', 2, 'chest'),
('Leather Pants', 'Durable leg protection', 'armor', 'common', '{"defense": 3}', 8, '/Items Pack/armor/common/leather_pants.png', 2, 'legs'),
('Leather Boots', 'Sturdy footwear', 'armor', 'common', '{"defense": 2, "speed": 2}', 9, '/Items Pack/armor/common/leather_boots.png', 2, 'boots'),
('Leather Gloves', 'Protective handwear', 'armor', 'common', '{"defense": 2}', 6, '/Items Pack/armor/common/leather_gloves.png', 2, 'gloves')

ON CONFLICT (name) DO NOTHING;

-- Uncommon Armor (Level 4-7)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Chain Mail Set
('Chain Coif', 'Metal head protection', 'armor', 'uncommon', '{"defense": 6}', 15, '/Items Pack/armor/uncommon/chainmail_coif.png', 4, 'helmet'),
('Chain Mail Jacket', 'Heavy chest armor', 'armor', 'uncommon', '{"defense": 8, "speed": -1}', 20, '/Items Pack/armor/uncommon/chainmail_jacket.png', 4, 'chest'),
('Chain Mail Pants', 'Metal leg protection', 'armor', 'uncommon', '{"defense": 6, "speed": -1}', 18, '/Items Pack/armor/uncommon/chainmail_pants.png', 4, 'legs'),
('Chain Mail Boots', 'Heavy footwear', 'armor', 'uncommon', '{"defense": 4, "speed": 1}', 16, '/Items Pack/armor/uncommon/chainmail_boots.png', 4, 'boots'),
('Chain Mail Gloves', 'Metal hand protection', 'armor', 'uncommon', '{"defense": 4}', 14, '/Items Pack/armor/uncommon/chainmail_gloves.png', 4, 'gloves'),

-- Studded Leather Set
('Studded Helmet', 'Reinforced headgear', 'armor', 'uncommon', '{"defense": 5}', 12, '/Items Pack/armor/uncommon/studded_helmet.png', 5, 'helmet'),
('Studded Jacket', 'Reinforced chest piece', 'armor', 'uncommon', '{"defense": 6, "speed": 1}', 18, '/Items Pack/armor/uncommon/studded_jacket_alt.png', 5, 'chest'),
('Studded Pants', 'Reinforced leg protection', 'armor', 'uncommon', '{"defense": 5, "speed": 1}', 15, '/Items Pack/armor/uncommon/studded_pants.png', 5, 'legs'),
('Studded Boots', 'Reinforced footwear', 'armor', 'uncommon', '{"defense": 3, "speed": 3}', 14, '/Items Pack/armor/uncommon/studded_boots.png', 5, 'boots'),
('Studded Gloves', 'Reinforced handwear', 'armor', 'uncommon', '{"defense": 3}', 11, '/Items Pack/armor/uncommon/studded_gloves.png', 5, 'gloves')

ON CONFLICT (name) DO NOTHING;

-- Rare Armor (Level 8-11)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Plate Mail Set
('Plate Helmet', 'Heavy head protection', 'armor', 'rare', '{"defense": 10}', 35, '/Items Pack/armor/rare/platemail_helmet.png', 8, 'helmet'),
('Plate Armor', 'Heavy chest protection', 'armor', 'rare', '{"defense": 15, "speed": -2}', 50, '/Items Pack/armor/rare/platemail.png', 8, 'chest'),
('Plate Leggings', 'Heavy leg protection', 'armor', 'rare', '{"defense": 12, "speed": -2}', 45, '/Items Pack/armor/rare/platemail_pants.png', 8, 'legs'),
('Plate Gauntlets', 'Heavy hand protection', 'armor', 'rare', '{"defense": 8}', 35, '/Items Pack/armor/rare/gauntlets.png', 8, 'gloves'),
('Plate Greaves', 'Heavy leg protection', 'armor', 'rare', '{"defense": 8, "speed": -1}', 40, '/Items Pack/armor/rare/greaves.png', 8, 'boots'),

-- Scale Armor Set
('Scale Helmet', 'Flexible head protection', 'armor', 'rare', '{"defense": 8, "speed": 1}', 30, '/Items Pack/armor/rare/Scale_helmet.png', 9, 'helmet'),
('Scale Armor', 'Flexible chest protection', 'armor', 'rare', '{"defense": 12, "speed": 1}', 45, '/Items Pack/armor/rare/Scale_armor.png', 9, 'chest'),
('Scale Leggings', 'Flexible leg protection', 'armor', 'rare', '{"defense": 10, "speed": 1}', 40, '/Items Pack/armor/rare/Scale_pants.png', 9, 'legs'),
('Scale Boots', 'Flexible footwear', 'armor', 'rare', '{"defense": 6, "speed": 2}', 35, '/Items Pack/armor/rare/Scale_boots.png', 9, 'boots'),
('Scale Gloves', 'Flexible hand protection', 'armor', 'rare', '{"defense": 6}', 30, '/Items Pack/armor/rare/Scale_gloves.png', 9, 'gloves')

ON CONFLICT (name) DO NOTHING;

-- Epic Armor (Level 12-15)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Dragon Scale Set
('Dragon Scale Helmet', 'Magical head protection', 'armor', 'epic', '{"defense": 15, "speed": 2}', 80, '/Items Pack/armor/epic/dragon_scale_helmet.png', 12, 'helmet'),
('Dragon Scale Armor', 'Magical chest protection', 'armor', 'epic', '{"defense": 20, "speed": 2}', 120, '/Items Pack/armor/epic/dragon_scale_armor.png', 12, 'chest'),
('Dragon Scale Leggings', 'Magical leg protection', 'armor', 'epic', '{"defense": 18, "speed": 2}', 110, '/Items Pack/armor/epic/dragon_scale_leggings.png', 12, 'legs'),
('Dragon Scale Boots', 'Magical footwear', 'armor', 'epic', '{"defense": 12, "speed": 4}', 100, '/Items Pack/armor/epic/dragon_scale_boots.png', 12, 'boots'),
('Dragon Scale Gloves', 'Magical hand protection', 'armor', 'epic', '{"defense": 12}', 90, '/Items Pack/armor/epic/dragon_scale_gloves.png', 12, 'gloves')

ON CONFLICT (name) DO NOTHING;

-- Legendary Armor (Level 16+)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Legendary Set
('Crown of Kings', 'Royal headpiece', 'armor', 'legendary', '{"defense": 20, "speed": 3, "attack": 5}', 200, '/Items Pack/armor/legendary/crown_of_kings.png', 16, 'helmet'),
('Armor of the Ancients', 'Ancient chest protection', 'armor', 'legendary', '{"defense": 30, "speed": 3}', 300, '/Items Pack/armor/legendary/armor_of_ancients.png', 16, 'chest'),
('Leggings of Power', 'Mystical leg protection', 'armor', 'legendary', '{"defense": 25, "speed": 3}', 280, '/Items Pack/armor/legendary/leggings_of_power.png', 16, 'legs'),
('Boots of Swiftness', 'Magical footwear', 'armor', 'legendary', '{"defense": 15, "speed": 6}', 250, '/Items Pack/armor/legendary/boots_of_swiftness.png', 16, 'boots'),
('Gauntlets of Might', 'Powerful hand protection', 'armor', 'legendary', '{"defense": 15, "attack": 8}', 220, '/Items Pack/armor/legendary/gauntlets_of_might.png', 16, 'gloves')

ON CONFLICT (name) DO NOTHING;

-- Accessories
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
('Necklace of the Eternal Wind', 'A mystical necklace that grants incredible speed', 'accessory', 'uncommon', '{"speed": 8}', 20, '/Items Pack/items/Necklace_of_the_Eternal_Wind.png', 1, 'accessory'),
('Power Ring', 'A ring that enhances combat abilities', 'accessory', 'rare', '{"attack": 8, "defense": 5}', 50, '/Items Pack/items/power_ring.png', 1, 'accessory'),
('Crown of Champions', 'The ultimate accessory for winners', 'accessory', 'legendary', '{"attack": 15, "defense": 15, "speed": 10}', 200, '/Items Pack/items/crown.png', 1, 'accessory')

ON CONFLICT (name) DO NOTHING;

-- Consumables (Potions)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
('Health Potion', 'Restores 50 HP', 'consumable', 'common', '{"health_restore": 50}', 10, '/Items Pack/potions/health_potion.png', 1, 'consumable'),
('Strength Elixir', 'Temporarily increases attack', 'consumable', 'uncommon', '{"attack_boost": 10}', 25, '/Items Pack/potions/strength_elixir.png', 1, 'consumable'),
('Speed Elixir', 'Temporarily increases speed', 'consumable', 'uncommon', '{"speed_boost": 5}', 20, '/Items Pack/potions/speed_elixir.png', 1, 'consumable'),
('Defense Elixir', 'Temporarily increases defense', 'consumable', 'uncommon', '{"defense_boost": 8}', 22, '/Items Pack/potions/defense_elixir.png', 1, 'consumable')

ON CONFLICT (name) DO NOTHING;
