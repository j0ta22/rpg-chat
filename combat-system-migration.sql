-- Migration for Combat System, Ranking, and Inventory
-- This implements PvP combat, player rankings, and item system

-- Create combats table to track PvP battles
CREATE TABLE IF NOT EXISTS combats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  combat_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  player1_stats JSONB, -- Stats at time of combat
  player2_stats JSONB, -- Stats at time of combat
  combat_duration INTEGER, -- Duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_combats_players ON combats(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_combats_winner ON combats(winner_id);
CREATE INDEX IF NOT EXISTS idx_combats_date ON combats(combat_date);

-- Create items table for the item catalog
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('weapon', 'armor', 'accessory', 'consumable')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  stat_bonuses JSONB NOT NULL DEFAULT '{}', -- {speed: 5, attack: 10, defense: 3}
  price INTEGER DEFAULT 0, -- Gold cost
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for item lookups
CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);

-- Create player_inventory table
CREATE TABLE IF NOT EXISTS player_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT FALSE,
  acquired_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, item_id)
);

-- Create index for inventory lookups
CREATE INDEX IF NOT EXISTS idx_player_inventory_player ON player_inventory(player_id);
CREATE INDEX IF NOT EXISTS idx_player_inventory_equipped ON player_inventory(player_id, equipped);

-- Create weekly_champions table
CREATE TABLE IF NOT EXISTS weekly_champions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  champion_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  total_combats INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for weekly champions
CREATE INDEX IF NOT EXISTS idx_weekly_champions_week ON weekly_champions(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_weekly_champions_champion ON weekly_champions(champion_id);

-- Insert some default items
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url) VALUES
-- Weapons
('Rusty Sword', 'A basic sword found in the tavern', 'weapon', 'common', '{"attack": 5}', 10, '/Items Pack/weapons/common/rusty_sword.png'),
('Iron Blade', 'A sturdy iron weapon', 'weapon', 'uncommon', '{"attack": 12, "speed": -1}', 25, '/Items Pack/weapons/uncommon/iron_blade.png'),
('Dragon Slayer', 'A legendary weapon of great power', 'weapon', 'legendary', '{"attack": 25, "speed": 5}', 100, '/Items Pack/weapons/legendary/dragon_slayer.png'),

-- Armor
('Leather Armor', 'Basic protection for adventurers', 'armor', 'common', '{"defense": 8}', 15, '/items/leather_armor.png'),
('Chain Mail', 'Heavy but effective protection', 'armor', 'uncommon', '{"defense": 15, "speed": -2}', 35, '/items/chain_mail.png'),
('Dragon Scale Armor', 'Legendary armor with magical properties', 'armor', 'legendary', '{"defense": 30, "speed": 3}', 150, '/items/dragon_scale.png'),

-- Accessories
('Necklace of the Eternal Wind', 'A mystical necklace that grants incredible speed', 'accessory', 'uncommon', '{"speed": 8}', 20, '/items/necklace_eternal_wind.png'),
('Power Ring', 'A ring that enhances combat abilities', 'accessory', 'rare', '{"attack": 8, "defense": 5}', 50, '/items/power_ring.png'),
('Crown of Champions', 'The ultimate accessory for winners', 'accessory', 'legendary', '{"attack": 15, "defense": 15, "speed": 10}', 200, '/items/crown.png'),

-- Consumables
('Health Potion', 'Restores health in combat', 'consumable', 'common', '{"health_restore": 50}', 5, '/items/health_potion.png'),
('Speed Elixir', 'Temporarily increases speed', 'consumable', 'uncommon', '{"speed_boost": 10}', 15, '/items/speed_elixir.png')
ON CONFLICT (name) DO NOTHING;

-- Add gold column to users table for economy
ALTER TABLE users ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 100;

-- Add combat stats to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00;
