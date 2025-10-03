const fs = require('fs')

// Items correctos basados en los assets que realmente existen
const correctItems = [
  // ==============================================
  // COMMON ARMOR (Level 1-3)
  // ==============================================
  
  // Cloth Set
  { name: 'Cloth Hood', description: 'Basic head protection', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 1 }, price: 3, icon_url: '/Items Pack/armor/common/cloth_hood.png', level_required: 1, equipment_slot: 'helmet' },
  { name: 'Cloth Robe', description: 'Simple clothing', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 2 }, price: 5, icon_url: '/Items Pack/armor/common/cloth_robe.png', level_required: 1, equipment_slot: 'chest' },
  { name: 'Cloth Pants', description: 'Comfortable pants', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 1 }, price: 3, icon_url: '/Items Pack/armor/common/cloth_pants.png', level_required: 1, equipment_slot: 'legs' },
  { name: 'Cloth Shoes', description: 'Basic footwear', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 1, speed: 1 }, price: 4, icon_url: '/Items Pack/armor/common/cloth_shoes.png', level_required: 1, equipment_slot: 'boots' },
  { name: 'Cloth Gloves', description: 'Simple hand protection', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 1 }, price: 2, icon_url: '/Items Pack/armor/common/cloth_gloves.png', level_required: 1, equipment_slot: 'gloves' },
  
  // Leather Set
  { name: 'Leather Cap', description: 'Sturdy headgear', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 3 }, price: 7, icon_url: '/Items Pack/armor/common/leather_cap.png', level_required: 2, equipment_slot: 'helmet' },
  { name: 'Leather Jacket', description: 'Protective chest piece', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 4 }, price: 10, icon_url: '/Items Pack/armor/common/leather_jacket.png', level_required: 2, equipment_slot: 'chest' },
  { name: 'Leather Pants', description: 'Durable leg protection', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 3 }, price: 8, icon_url: '/Items Pack/armor/common/leather_pants.png', level_required: 2, equipment_slot: 'legs' },
  { name: 'Leather Boots', description: 'Sturdy footwear', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 2, speed: 2 }, price: 9, icon_url: '/Items Pack/armor/common/leather_boots.png', level_required: 2, equipment_slot: 'boots' },
  { name: 'Leather Gloves', description: 'Protective handwear', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 2 }, price: 6, icon_url: '/Items Pack/armor/common/leather_gloves.png', level_required: 2, equipment_slot: 'gloves' },

  // ==============================================
  // UNCOMMON ARMOR (Level 4-7)
  // ==============================================
  
  // Studded Set
  { name: 'Studded Helmet', description: 'Reinforced headgear', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 5 }, price: 12, icon_url: '/Items Pack/armor/uncommon/studded_helmet.png', level_required: 4, equipment_slot: 'helmet' },
  { name: 'Studded Jacket', description: 'Reinforced chest piece', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 6 }, price: 15, icon_url: '/Items Pack/armor/uncommon/studded_jacket_alt.png', level_required: 4, equipment_slot: 'chest' },
  { name: 'Studded Pants', description: 'Reinforced leg protection', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 5 }, price: 13, icon_url: '/Items Pack/armor/uncommon/studded_pants.png', level_required: 4, equipment_slot: 'legs' },
  { name: 'Studded Boots', description: 'Reinforced footwear', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 4, speed: 1 }, price: 14, icon_url: '/Items Pack/armor/uncommon/studded_boots.png', level_required: 4, equipment_slot: 'boots' },
  { name: 'Studded Gloves', description: 'Reinforced handwear', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 3 }, price: 11, icon_url: '/Items Pack/armor/uncommon/studded_gloves.png', level_required: 4, equipment_slot: 'gloves' },

  // Chainmail Set
  { name: 'Chain Coif', description: 'Metal head protection', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 6 }, price: 15, icon_url: '/Items Pack/armor/uncommon/chainmail_coif.png', level_required: 5, equipment_slot: 'helmet' },
  { name: 'Chain Jacket', description: 'Metal chest protection', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 7 }, price: 18, icon_url: '/Items Pack/armor/uncommon/chainmail_jacket.png', level_required: 5, equipment_slot: 'chest' },
  { name: 'Chain Pants', description: 'Metal leg protection', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 6 }, price: 16, icon_url: '/Items Pack/armor/uncommon/chainmail_pants.png', level_required: 5, equipment_slot: 'legs' },
  { name: 'Chain Boots', description: 'Metal footwear', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 5, speed: 1 }, price: 17, icon_url: '/Items Pack/armor/uncommon/chainmail_boots.png', level_required: 5, equipment_slot: 'boots' },
  { name: 'Chain Gloves', description: 'Metal hand protection', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 4 }, price: 14, icon_url: '/Items Pack/armor/uncommon/chainmail_gloves.png', level_required: 5, equipment_slot: 'gloves' },

  // ==============================================
  // RARE ARMOR (Level 8-11)
  // ==============================================
  
  // Platemail Set
  { name: 'Platemail Helmet', description: 'Heavy metal headgear', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 8 }, price: 25, icon_url: '/Items Pack/armor/rare/platemail_helmet.png', level_required: 8, equipment_slot: 'helmet' },
  { name: 'Platemail Armor', description: 'Heavy metal chest piece', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 10 }, price: 30, icon_url: '/Items Pack/armor/rare/platemail.png', level_required: 8, equipment_slot: 'chest' },
  { name: 'Platemail Pants', description: 'Heavy metal leg protection', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 8 }, price: 27, icon_url: '/Items Pack/armor/rare/platemail_pants.png', level_required: 8, equipment_slot: 'legs' },
  { name: 'Platemail Greaves', description: 'Heavy metal footwear', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 7, speed: -1 }, price: 28, icon_url: '/Items Pack/armor/rare/greaves.png', level_required: 8, equipment_slot: 'boots' },
  { name: 'Platemail Gauntlets', description: 'Heavy metal hand protection', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 6 }, price: 24, icon_url: '/Items Pack/armor/rare/gauntlets.png', level_required: 8, equipment_slot: 'gloves' },

  // Scale Set
  { name: 'Scale Helmet', description: 'Scaled head protection', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 9 }, price: 32, icon_url: '/Items Pack/armor/rare/Scale_helmet.png', level_required: 9, equipment_slot: 'helmet' },
  { name: 'Scale Armor', description: 'Scaled chest piece', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 11 }, price: 35, icon_url: '/Items Pack/armor/rare/Scale_armor.png', level_required: 9, equipment_slot: 'chest' },
  { name: 'Scale Pants', description: 'Scaled leg protection', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 9 }, price: 33, icon_url: '/Items Pack/armor/rare/Scale_pants.png', level_required: 9, equipment_slot: 'legs' },
  { name: 'Scale Boots', description: 'Scaled footwear', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 8, speed: 1 }, price: 34, icon_url: '/Items Pack/armor/rare/Scale_boots.png', level_required: 9, equipment_slot: 'boots' },
  { name: 'Scale Gloves', description: 'Scaled hand protection', item_type: 'armor', rarity: 'rare', stat_bonuses: { defense: 7 }, price: 31, icon_url: '/Items Pack/armor/rare/Scale_gloves.png', level_required: 9, equipment_slot: 'gloves' },

  // ==============================================
  // EPIC ARMOR (Level 12-15)
  // ==============================================
  
  // Dragon Scale Set
  { name: 'Dragon Scale Helmet', description: 'Dragon scale headgear', item_type: 'armor', rarity: 'epic', stat_bonuses: { defense: 12, attack: 2 }, price: 50, icon_url: '/Items Pack/armor/epic/dragon_scale_helmet.png', level_required: 12, equipment_slot: 'helmet' },
  { name: 'Dragon Scale Armor', description: 'Dragon scale chest piece', item_type: 'armor', rarity: 'epic', stat_bonuses: { defense: 15, attack: 3 }, price: 60, icon_url: '/Items Pack/armor/epic/dragon_scale_armor.png', level_required: 12, equipment_slot: 'chest' },
  { name: 'Dragon Scale Leggings', description: 'Dragon scale leg protection', item_type: 'armor', rarity: 'epic', stat_bonuses: { defense: 12, speed: 2 }, price: 55, icon_url: '/Items Pack/armor/epic/dragon_scale_leggings.png', level_required: 12, equipment_slot: 'legs' },
  { name: 'Dragon Scale Boots', description: 'Dragon scale footwear', item_type: 'armor', rarity: 'epic', stat_bonuses: { defense: 10, speed: 3 }, price: 52, icon_url: '/Items Pack/armor/epic/dragon_scale_boots.png', level_required: 12, equipment_slot: 'boots' },
  { name: 'Dragon Scale Gloves', description: 'Dragon scale hand protection', item_type: 'armor', rarity: 'epic', stat_bonuses: { defense: 9, attack: 2 }, price: 48, icon_url: '/Items Pack/armor/epic/dragon_scale_gloves.png', level_required: 12, equipment_slot: 'gloves' },

  // ==============================================
  // LEGENDARY ARMOR (Level 16+)
  // ==============================================
  
  // Ancient Set
  { name: 'Crown of Kings', description: 'Ancient royal headgear', item_type: 'armor', rarity: 'legendary', stat_bonuses: { defense: 15, attack: 5, speed: 3 }, price: 100, icon_url: '/Items Pack/armor/legendary/crown_of_kings.png', level_required: 16, equipment_slot: 'helmet' },
  { name: 'Armor of Ancients', description: 'Ancient royal chest piece', item_type: 'armor', rarity: 'legendary', stat_bonuses: { defense: 20, attack: 5, health: 50 }, price: 120, icon_url: '/Items Pack/armor/legendary/armor_of_ancients.png', level_required: 16, equipment_slot: 'chest' },
  { name: 'Leggings of Power', description: 'Ancient royal leg protection', item_type: 'armor', rarity: 'legendary', stat_bonuses: { defense: 15, speed: 5, health: 30 }, price: 110, icon_url: '/Items Pack/armor/legendary/leggings_of_power.png', level_required: 16, equipment_slot: 'legs' },
  { name: 'Boots of Swiftness', description: 'Ancient royal footwear', item_type: 'armor', rarity: 'legendary', stat_bonuses: { defense: 12, speed: 8, attack: 2 }, price: 105, icon_url: '/Items Pack/armor/legendary/boots_of_swiftness.png', level_required: 16, equipment_slot: 'boots' },
  { name: 'Gauntlets of Might', description: 'Ancient royal hand protection', item_type: 'armor', rarity: 'legendary', stat_bonuses: { defense: 12, attack: 8, health: 20 }, price: 95, icon_url: '/Items Pack/armor/legendary/gauntlets_of_might.png', level_required: 16, equipment_slot: 'gloves' },

  // ==============================================
  // WEAPONS
  // ==============================================
  
  // Common Weapons
  { name: 'Wooden Sword', description: 'Basic training weapon', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 3 }, price: 8, icon_url: '/Items Pack/weapons/common/wooden_sword.png', level_required: 1, equipment_slot: 'weapon' },
  { name: 'Short Sword', description: 'A quick and agile blade', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 4, speed: 1 }, price: 10, icon_url: '/Items Pack/weapons/common/short_sword.png', level_required: 1, equipment_slot: 'weapon' },
  { name: 'Rusty Sword', description: 'A basic sword found in the tavern', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 5 }, price: 10, icon_url: '/Items Pack/weapons/common/rusty_sword.png', level_required: 2, equipment_slot: 'weapon' },
  { name: 'Iron Dagger', description: 'Sharp blade for quick strikes', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 5, speed: 2 }, price: 12, icon_url: '/Items Pack/weapons/common/iron_dagger.png', level_required: 2, equipment_slot: 'weapon' },
  { name: 'Battle Axe', description: 'Heavy axe for powerful strikes', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 6, speed: -1 }, price: 15, icon_url: '/Items Pack/weapons/common/battle_axe.png', level_required: 2, equipment_slot: 'weapon' },
  { name: 'War Axe', description: 'Axe designed for combat', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 7, speed: -1 }, price: 18, icon_url: '/Items Pack/weapons/common/war_axe.png', level_required: 3, equipment_slot: 'weapon' },
  { name: 'Iron Mace', description: 'Heavy blunt weapon', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 6, speed: -1 }, price: 14, icon_url: '/Items Pack/weapons/common/iron_mace.png', level_required: 2, equipment_slot: 'weapon' },
  { name: 'Hunting Spear', description: 'Long reach weapon', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 5, speed: 1 }, price: 12, icon_url: '/Items Pack/weapons/common/hunting_spear.png', level_required: 2, equipment_slot: 'weapon' },
  { name: 'Iron Spear', description: 'Metal-tipped spear', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 6, speed: 1 }, price: 15, icon_url: '/Items Pack/weapons/common/iron_spear.png', level_required: 3, equipment_slot: 'weapon' },
  { name: 'War Hammer', description: 'Heavy hammer for crushing blows', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 8, speed: -2 }, price: 20, icon_url: '/Items Pack/weapons/common/war_hammer.png', level_required: 3, equipment_slot: 'weapon' },
  { name: 'Wooden Staff', description: 'Basic magical staff', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 4, health: 10 }, price: 8, icon_url: '/Items Pack/weapons/common/wooden_staff.png', level_required: 1, equipment_slot: 'weapon' },

  // Uncommon Weapons
  { name: 'Steel Sword', description: 'Well-crafted steel blade', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 8, speed: 1 }, price: 25, icon_url: '/Items Pack/weapons/uncommon/steel_sword.png', level_required: 4, equipment_slot: 'weapon' },
  { name: 'Longsword', description: 'Longer blade for extended reach', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 9, speed: 0 }, price: 28, icon_url: '/Items Pack/weapons/uncommon/longsword.png', level_required: 5, equipment_slot: 'weapon' },
  { name: 'Bastard Sword', description: 'Versatile two-handed blade', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 10, speed: -1 }, price: 30, icon_url: '/Items Pack/weapons/uncommon/bastard_sword.png', level_required: 5, equipment_slot: 'weapon' },
  { name: 'Iron Blade', description: 'Refined iron weapon', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 7, speed: 2 }, price: 22, icon_url: '/Items Pack/weapons/uncommon/iron_blade.png', level_required: 4, equipment_slot: 'weapon' },
  { name: 'Berserker Axe', description: 'Fierce combat axe', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 9, speed: -1 }, price: 26, icon_url: '/Items Pack/weapons/uncommon/berserker_axe.png', level_required: 4, equipment_slot: 'weapon' },
  { name: 'Battle Axe Plus', description: 'Enhanced battle axe', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 10, speed: -1 }, price: 28, icon_url: '/Items Pack/weapons/uncommon/battle_axe_plus.png', level_required: 5, equipment_slot: 'weapon' },
  { name: 'Mace', description: 'Heavy blunt weapon', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 8, speed: -1 }, price: 24, icon_url: '/Items Pack/weapons/uncommon/mace.png', level_required: 4, equipment_slot: 'weapon' },
  { name: 'Maul', description: 'Massive hammer', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 11, speed: -2 }, price: 32, icon_url: '/Items Pack/weapons/uncommon/maul.png', level_required: 5, equipment_slot: 'weapon' },
  { name: 'Spiked Mace', description: 'Spiked blunt weapon', item_type: 'weapon', rarity: 'uncommon', stat_bonuses: { attack: 9, speed: -1 }, price: 26, icon_url: '/Items Pack/weapons/uncommon/spiked_mace.png', level_required: 4, equipment_slot: 'weapon' },

  // Rare Weapons
  { name: 'Broadsword', description: 'Wide heavy blade', item_type: 'weapon', rarity: 'rare', stat_bonuses: { attack: 12, speed: -1 }, price: 40, icon_url: '/Items Pack/weapons/rare/broadsword.png', level_required: 8, equipment_slot: 'weapon' },
  { name: 'Claymore', description: 'Large two-handed sword', item_type: 'weapon', rarity: 'rare', stat_bonuses: { attack: 14, speed: -2 }, price: 45, icon_url: '/Items Pack/weapons/rare/claymore.png', level_required: 8, equipment_slot: 'weapon' },
  { name: 'Rapier', description: 'Elegant thrusting sword', item_type: 'weapon', rarity: 'rare', stat_bonuses: { attack: 10, speed: 3 }, price: 38, icon_url: '/Items Pack/weapons/rare/rapier.png', level_required: 8, equipment_slot: 'weapon' },
  { name: 'Zweihander', description: 'Massive two-handed sword', item_type: 'weapon', rarity: 'rare', stat_bonuses: { attack: 16, speed: -3 }, price: 50, icon_url: '/Items Pack/weapons/rare/zweihander.png', level_required: 9, equipment_slot: 'weapon' },
  { name: 'Berserker War Axe', description: 'Fierce two-handed axe', item_type: 'weapon', rarity: 'rare', stat_bonuses: { attack: 13, speed: -2 }, price: 42, icon_url: '/Items Pack/weapons/rare/berserker_war_axe.png', level_required: 8, equipment_slot: 'weapon' },
  { name: 'Executioner Axe', description: 'Heavy execution axe', item_type: 'weapon', rarity: 'rare', stat_bonuses: { attack: 15, speed: -2 }, price: 48, icon_url: '/Items Pack/weapons/rare/executioner_axe.png', level_required: 9, equipment_slot: 'weapon' },
  { name: 'Flanged Mace', description: 'Heavy spiked mace', item_type: 'weapon', rarity: 'rare', stat_bonuses: { attack: 12, speed: -1 }, price: 40, icon_url: '/Items Pack/weapons/rare/flanged_mace.png', level_required: 8, equipment_slot: 'weapon' },

  // Epic Weapons
  { name: 'Dragon Slayer Sword', description: 'Legendary dragon-slaying blade', item_type: 'weapon', rarity: 'epic', stat_bonuses: { attack: 18, speed: 2, health: 30 }, price: 80, icon_url: '/Items Pack/weapons/epic/dragon_slayer_sword.png', level_required: 12, equipment_slot: 'weapon' },
  { name: 'Brutal War Axe', description: 'Savage two-handed axe', item_type: 'weapon', rarity: 'epic', stat_bonuses: { attack: 20, speed: -1, attack: 2 }, price: 85, icon_url: '/Items Pack/weapons/epic/brutal_war_axe.png', level_required: 12, equipment_slot: 'weapon' },
  { name: 'Thunder Hammer', description: 'Hammer that crackles with energy', item_type: 'weapon', rarity: 'epic', stat_bonuses: { attack: 16, speed: -1, health: 20 }, price: 75, icon_url: '/Items Pack/weapons/epic/thunder_hammer.png', level_required: 12, equipment_slot: 'weapon' },
  { name: 'Kris Dagger', description: 'Mystical wavy dagger', item_type: 'weapon', rarity: 'epic', stat_bonuses: { attack: 12, speed: 4, attack: 3 }, price: 70, icon_url: '/Items Pack/weapons/epic/kris_dagger.png', level_required: 12, equipment_slot: 'weapon' },
  { name: 'Lava War Axe', description: 'Axe forged in volcanic fire', item_type: 'weapon', rarity: 'epic', stat_bonuses: { attack: 19, speed: -1, health: 25 }, price: 82, icon_url: '/Items Pack/weapons/epic/lava_war_axe.png', level_required: 12, equipment_slot: 'weapon' },

  // Legendary Weapons
  { name: 'Excalibur', description: 'The legendary sword of kings', item_type: 'weapon', rarity: 'legendary', stat_bonuses: { attack: 25, speed: 3, health: 50, attack: 5 }, price: 150, icon_url: '/Items Pack/weapons/legendary/excalibur.png', level_required: 16, equipment_slot: 'weapon' },
  { name: 'Dragon Slayer', description: 'Ultimate dragon-slaying weapon', item_type: 'weapon', rarity: 'legendary', stat_bonuses: { attack: 28, speed: 2, health: 60, attack: 6 }, price: 160, icon_url: '/Items Pack/weapons/legendary/dragon_slayer.png', level_required: 16, equipment_slot: 'weapon' },
  { name: 'Warlord Battle Axe', description: 'Axe of the greatest warlord', item_type: 'weapon', rarity: 'legendary', stat_bonuses: { attack: 26, speed: 1, health: 40, attack: 4 }, price: 155, icon_url: '/Items Pack/weapons/legendary/warlord_battle_axe.png', level_required: 16, equipment_slot: 'weapon' },
  { name: 'Molten War Mace', description: 'Mace forged in dragon fire', item_type: 'weapon', rarity: 'legendary', stat_bonuses: { attack: 24, speed: 0, health: 45, attack: 4 }, price: 145, icon_url: '/Items Pack/weapons/legendary/molten_war_mace.png', level_required: 16, equipment_slot: 'weapon' },

  // ==============================================
  // ACCESSORIES
  // ==============================================
  
  { name: 'Power Ring', description: 'Ring that enhances abilities', item_type: 'accessory', rarity: 'common', stat_bonuses: { attack: 2, defense: 1 }, price: 15, icon_url: '/Items Pack/items/power_ring.png', level_required: 3, equipment_slot: 'accessory' },
  { name: 'Necklace of the Eternal Wind', description: 'Mystical wind necklace', item_type: 'accessory', rarity: 'rare', stat_bonuses: { speed: 5, health: 20 }, price: 50, icon_url: '/Items Pack/items/Necklace_of_the_Eternal_Wind.png', level_required: 8, equipment_slot: 'accessory' },
  { name: 'Crown of Power', description: 'Royal crown of immense power', item_type: 'accessory', rarity: 'legendary', stat_bonuses: { attack: 8, defense: 8, speed: 4, health: 100 }, price: 200, icon_url: '/Items Pack/items/crown.png', level_required: 16, equipment_slot: 'accessory' },

  // ==============================================
  // CONSUMABLES
  // ==============================================
  
  { name: 'Health Potion', description: 'Restores health', item_type: 'consumable', rarity: 'common', stat_bonuses: { health_restore: 50 }, price: 5, icon_url: '/Items Pack/potions/health_potion.png', level_required: 1, equipment_slot: 'consumable' },
  { name: 'Strength Elixir', description: 'Temporarily increases attack', item_type: 'consumable', rarity: 'common', stat_bonuses: { attack_boost: 5 }, price: 8, icon_url: '/Items Pack/potions/strength_elixir.png', level_required: 2, equipment_slot: 'consumable' },
  { name: 'Defense Elixir', description: 'Temporarily increases defense', item_type: 'consumable', rarity: 'common', stat_bonuses: { defense_boost: 5 }, price: 8, icon_url: '/Items Pack/potions/defense_elixir.png', level_required: 2, equipment_slot: 'consumable' },
  { name: 'Speed Elixir', description: 'Temporarily increases speed', item_type: 'consumable', rarity: 'common', stat_bonuses: { speed_boost: 5 }, price: 8, icon_url: '/Items Pack/potions/speed_elixir.png', level_required: 2, equipment_slot: 'consumable' }
]

function generateSQL() {
  let sql = `-- Clear existing items
DELETE FROM items;

-- Insert correct items based on actual assets
INSERT INTO items (name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot) VALUES
`

  correctItems.forEach((item, index) => {
    const isLast = index === correctItems.length - 1
    const statBonuses = JSON.stringify(item.stat_bonuses)
    
    sql += `('${item.name}', '${item.description}', '${item.item_type}', '${item.rarity}', '${statBonuses}', ${item.price}, '${item.icon_url}', ${item.level_required}, '${item.equipment_slot}')${isLast ? ';' : ','}\n`
  })

  return sql
}

const sql = generateSQL()
fs.writeFileSync('final-items-update.sql', sql)

console.log('✅ SQL file generated: final-items-update.sql')
console.log(`📊 Total items: ${correctItems.length}`)

// Show summary by rarity
const rarityCount = correctItems.reduce((acc, item) => {
  acc[item.rarity] = (acc[item.rarity] || 0) + 1
  return acc
}, {})

console.log('\n📊 Items by rarity:')
Object.entries(rarityCount).forEach(([rarity, count]) => {
  console.log(`  ${rarity}: ${count} items`)
})
