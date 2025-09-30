-- Complete Weapons Migration
-- This adds all available weapons from Items Pack to the database

-- Common Weapons (Level 1-3)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Swords
('Wooden Sword', 'Basic training weapon', 'weapon', 'common', '{"attack": 3}', 8, '/Items Pack/weapons/common/wooden_sword.png', 1, 'weapon'),
('Short Sword', 'A quick and agile blade', 'weapon', 'common', '{"attack": 4, "speed": 1}', 10, '/Items Pack/weapons/common/short_sword.png', 1, 'weapon'),
('Iron Dagger', 'Sharp blade for quick strikes', 'weapon', 'common', '{"attack": 5, "speed": 2}', 12, '/Items Pack/weapons/common/iron_dagger.png', 2, 'weapon'),
('Rusty Sword', 'A basic sword found in the tavern', 'weapon', 'common', '{"attack": 5}', 10, '/Items Pack/weapons/common/rusty_sword.png', 2, 'weapon'),

-- Axes
('Battle Axe', 'Heavy axe for powerful strikes', 'weapon', 'common', '{"attack": 6, "speed": -1}', 15, '/Items Pack/weapons/common/battle_axe.png', 2, 'weapon'),
('War Axe', 'Axe designed for combat', 'weapon', 'common', '{"attack": 7, "speed": -1}', 18, '/Items Pack/weapons/common/war_axe.png', 3, 'weapon'),

-- Maces
('Iron Mace', 'Heavy blunt weapon', 'weapon', 'common', '{"attack": 6, "speed": -1}', 14, '/Items Pack/weapons/common/iron_mace.png', 2, 'weapon'),

-- Spears
('Hunting Spear', 'Long reach weapon', 'weapon', 'common', '{"attack": 5, "speed": 1}', 12, '/Items Pack/weapons/common/hunting_spear.png', 2, 'weapon'),
('Iron Spear', 'Metal-tipped spear', 'weapon', 'common', '{"attack": 6, "speed": 1}', 15, '/Items Pack/weapons/common/iron_spear.png', 3, 'weapon'),

-- Hammers
('War Hammer', 'Heavy hammer for crushing blows', 'weapon', 'common', '{"attack": 8, "speed": -2}', 20, '/Items Pack/weapons/common/war_hammer.png', 3, 'weapon'),

-- Staves
('Wooden Staff', 'Basic magical focus', 'weapon', 'common', '{"attack": 3, "speed": 2}', 8, '/Items Pack/weapons/common/wooden_staff.png', 1, 'weapon')

ON CONFLICT (name) DO NOTHING;

-- Uncommon Weapons (Level 4-7)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Swords
('Steel Sword', 'Well-crafted blade', 'weapon', 'uncommon', '{"attack": 8}', 25, '/Items Pack/weapons/uncommon/steel_sword.png', 4, 'weapon'),
('Longsword', 'Versatile combat blade', 'weapon', 'uncommon', '{"attack": 9, "speed": 1}', 28, '/Items Pack/weapons/uncommon/longsword.png', 5, 'weapon'),
('Bastard Sword', 'One-handed longsword', 'weapon', 'uncommon', '{"attack": 10, "speed": 1}', 30, '/Items Pack/weapons/uncommon/bastard_sword.png', 6, 'weapon'),
('Iron Blade', 'A sturdy iron weapon', 'weapon', 'uncommon', '{"attack": 12, "speed": -1}', 35, '/Items Pack/weapons/uncommon/iron_blade.png', 7, 'weapon'),

-- Axes
('Battle Axe+', 'Enhanced battle axe', 'weapon', 'uncommon', '{"attack": 10, "speed": -1}', 30, '/Items Pack/weapons/uncommon/battle_axe_plus.png', 4, 'weapon'),
('Cleaving Axe', 'Axe designed for cleaving', 'weapon', 'uncommon', '{"attack": 11, "speed": -1}', 32, '/Items Pack/weapons/uncommon/cleaving_axe.png', 5, 'weapon'),
('Double Axe', 'Two-bladed axe', 'weapon', 'uncommon', '{"attack": 12, "speed": -2}', 35, '/Items Pack/weapons/uncommon/double_axe.png', 6, 'weapon'),
('Berserker Axe', 'Frenzied combat axe', 'weapon', 'uncommon', '{"attack": 13, "speed": -1}', 38, '/Items Pack/weapons/uncommon/berserker_axe.png', 7, 'weapon'),

-- Maces
('Mace', 'Heavy blunt weapon', 'weapon', 'uncommon', '{"attack": 10, "speed": -1}', 30, '/Items Pack/weapons/uncommon/mace.png', 5, 'weapon'),
('Spiked Mace', 'Mace with metal spikes', 'weapon', 'uncommon', '{"attack": 11, "speed": -1}', 32, '/Items Pack/weapons/uncommon/spiked_mace.png', 6, 'weapon'),

-- Hammers
('Maul', 'Heavy two-handed hammer', 'weapon', 'uncommon', '{"attack": 12, "speed": -2}', 35, '/Items Pack/weapons/uncommon/maul.png', 6, 'weapon')

ON CONFLICT (name) DO NOTHING;

-- Rare Weapons (Level 8-11)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Swords
('Broadsword', 'Powerful blade', 'weapon', 'rare', '{"attack": 15}', 60, '/Items Pack/weapons/rare/broadsword.png', 8, 'weapon'),
('Claymore', 'Large two-handed sword', 'weapon', 'rare', '{"attack": 18, "speed": -1}', 70, '/Items Pack/weapons/rare/claymore.png', 9, 'weapon'),
('Zweihander', 'Massive two-handed blade', 'weapon', 'rare', '{"attack": 20, "speed": -2}', 80, '/Items Pack/weapons/rare/zweihander.png', 10, 'weapon'),
('Rapier', 'Fast piercing weapon', 'weapon', 'rare', '{"attack": 12, "speed": 3}', 55, '/Items Pack/weapons/rare/rapier.png', 9, 'weapon'),

-- Axes
('Executioner Axe', 'Axe of execution', 'weapon', 'rare', '{"attack": 16, "speed": -1}', 65, '/Items Pack/weapons/rare/executioner_axe.png', 8, 'weapon'),
('Berserker War Axe', 'Frenzied war axe', 'weapon', 'rare', '{"attack": 17, "speed": -1}', 68, '/Items Pack/weapons/rare/berserker_war_axe.png', 9, 'weapon'),

-- Maces
('Flanged Mace', 'Mace with flanges', 'weapon', 'rare', '{"attack": 14, "speed": -1}', 58, '/Items Pack/weapons/rare/flanged_mace.png', 8, 'weapon')

ON CONFLICT (name) DO NOTHING;

-- Epic Weapons (Level 12-15)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Swords
('Dragon Slayer Sword', 'Legendary blade', 'weapon', 'epic', '{"attack": 25, "speed": 2}', 150, '/Items Pack/weapons/epic/dragon_slayer_sword.png', 12, 'weapon'),

-- Axes
('Brutal War Axe', 'Brutal combat axe', 'weapon', 'epic', '{"attack": 22, "speed": -1}', 140, '/Items Pack/weapons/epic/brutal_war_axe.png', 12, 'weapon'),
('Lava War Axe', 'Axe forged in lava', 'weapon', 'epic', '{"attack": 24, "speed": -1}', 145, '/Items Pack/weapons/epic/lava_war_axe.png', 13, 'weapon'),

-- Hammers
('Thunder Hammer', 'Hammer that strikes like thunder', 'weapon', 'epic', '{"attack": 26, "speed": -2}', 155, '/Items Pack/weapons/epic/thunder_hammer.png', 13, 'weapon'),

-- Daggers
('Kris Dagger', 'Curved ceremonial dagger', 'weapon', 'epic', '{"attack": 18, "speed": 4}', 130, '/Items Pack/weapons/epic/kris_dagger.png', 12, 'weapon')

ON CONFLICT (name) DO NOTHING;

-- Legendary Weapons (Level 16+)
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
-- Swords
('Excalibur', 'The legendary sword', 'weapon', 'legendary', '{"attack": 40, "speed": 5}', 500, '/Items Pack/weapons/legendary/excalibur.png', 16, 'weapon'),
('Dragon Slayer', 'A legendary weapon of great power', 'weapon', 'legendary', '{"attack": 35, "speed": 3}', 450, '/Items Pack/weapons/legendary/dragon_slayer.png', 16, 'weapon'),

-- Axes
('Warlord Battle Axe', 'Axe of the warlord', 'weapon', 'legendary', '{"attack": 38, "speed": 2}', 480, '/Items Pack/weapons/legendary/warlord_battle_axe.png', 17, 'weapon'),

-- Maces
('Molten War Mace', 'Mace forged in molten metal', 'weapon', 'legendary', '{"attack": 42, "speed": -1}', 520, '/Items Pack/weapons/legendary/molten_war_mace.png', 17, 'weapon')

ON CONFLICT (name) DO NOTHING;
