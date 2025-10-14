// Map System for RPG Chat
// Handles multiple maps and transitions

export interface MapConfig {
  id: string
  name: string
  width: number
  height: number
  backgroundImage?: string
  spawnPoint: { x: number; y: number }
  collisionObjects: CollisionObject[]
  npcs: NPC[]
  doors: Door[]
  shops: Shop[]
  enemies: Enemy[]
}

export interface CollisionObject {
  x: number
  y: number
  width: number
  height: number
  type: string
}

export interface NPC {
  id: string
  name: string
  x: number
  y: number
  avatar: string
  dialog: string
  interactionRadius: number
}

export interface Door {
  id: string
  x: number
  y: number
  width: number
  height: number
  targetMap: string
  targetSpawnPoint: { x: number; y: number }
  interactionRadius: number
  name: string
  description: string
}

export interface Shop {
  id: string
  x: number
  y: number
  interactionRadius: number
  name: string
}

export interface Enemy {
  id: string
  name: string
  x: number
  y: number
  avatar: string
  level: number
  stats: {
    health: number
    maxHealth: number
    attack: number
    defense: number
    speed: number
  }
  rewards: {
    gold: number
    xp: number
  }
  respawnTime: number // in milliseconds
  lastKilled?: number
  isAlive: boolean
}

// Tavern Map (Current Map)
export const TAVERN_MAP: MapConfig = {
  id: 'tavern',
  name: 'The Tavern',
  width: 1600,
  height: 1200,
  spawnPoint: { x: 100, y: 150 },
  collisionObjects: [
    // Outer walls
    { x: 0, y: 0, width: 1600, height: 32, type: "wall" }, // Top wall
    { x: 0, y: 1168, width: 1600, height: 32, type: "wall" }, // Bottom wall
    { x: 0, y: 0, width: 32, height: 1200, type: "wall" }, // Left wall
    { x: 1568, y: 0, width: 32, height: 1200, type: "wall" }, // Right wall

    // Bar counter (center-left)
    { x: 200, y: 300, width: 300, height: 64, type: "bar" },

    // Tables and chairs arranged in rows
    { x: 600, y: 200, width: 96, height: 64, type: "table" },
    { x: 800, y: 200, width: 96, height: 64, type: "table" },
    { x: 1000, y: 200, width: 96, height: 64, type: "table" },
    { x: 600, y: 400, width: 96, height: 64, type: "table" },
    { x: 800, y: 400, width: 96, height: 64, type: "table" },
    { x: 1000, y: 400, width: 96, height: 64, type: "table" },
    { x: 600, y: 600, width: 96, height: 64, type: "table" },
    { x: 800, y: 600, width: 96, height: 64, type: "table" },

    // Fireplace (top-right corner)
    { x: 1400, y: 100, width: 128, height: 96, type: "fireplace" },

    // Barrels and storage
    { x: 1200, y: 300, width: 48, height: 48, type: "barrel" },
    { x: 1200, y: 380, width: 48, height: 48, type: "barrel" },
    { x: 1200, y: 460, width: 48, height: 48, type: "barrel" },
    { x: 1200, y: 540, width: 48, height: 48, type: "barrel" },
  ],
  npcs: [
    {
      id: "npc_1",
      name: "Tavern keeper",
      x: 1364,
      y: 554,
      avatar: "character_18",
      dialog: "Hail, good traveller! I am Maeve, keeper of Ye Drunken Monkey. Enter ye, take thy seat by ye hearth, and let ye fine ale and tales flow freely. What bringeth thee to mine humble tavern?",
      interactionRadius: 80
    },
    {
      id: "npc_2",
      name: "Tavern Crier",
      x: 1364,
      y: 698,
      avatar: "character_27",
      dialog: "Greetings, traveler. I sense great power within you. The ancient secrets of this land await those who are worthy...",
      interactionRadius: 80
    },
    {
      id: "npc_3",
      name: "Ambassador of Apestore",
      x: 84,
      y: 258,
      avatar: "monkeyking",
      dialog: "Greetings, noble adventurer! I am the Ambassador of Apestore, representing the great trading company from the distant lands. We deal in the finest goods and exotic treasures. Perhaps you would be interested in our wares?",
      interactionRadius: 80
    },
    {
      id: "npc_4",
      name: "Blacksmith",
      x: 76,
      y: 1130,
      avatar: "blacksmith",
      dialog: "Welcome to my shop! I sell equipment up to level 7. Press E to browse my wares.",
      interactionRadius: 80
    }
  ],
  doors: [
    {
      id: 'exterior_door',
      x: 1344,
      y: 1168,
      width: 128,
      height: 32,
      targetMap: 'exterior',
      targetSpawnPoint: { x: 800, y: 100 },
      interactionRadius: 50,
      name: 'Exit to Dark Swamp',
      description: 'A weathered door that creaks ominously. Beyond lies a murky, foreboding swamp filled with twisted trees and dark secrets.'
    }
  ],
  shops: [
    {
      id: 'blacksmith',
      x: 76,
      y: 1130,
      interactionRadius: 80,
      name: 'Blacksmith'
    }
  ],
  enemies: [] // No enemies in tavern
}

// Exterior Map (Dark Swamp)
export const EXTERIOR_MAP: MapConfig = {
  id: 'exterior',
  name: 'The Dark Swamp',
  width: 2000,
  height: 1500,
  spawnPoint: { x: 800, y: 100 },
  collisionObjects: [
    // Outer walls
    { x: 0, y: 0, width: 2000, height: 32, type: "wall" }, // Top wall
    { x: 0, y: 1468, width: 2000, height: 32, type: "wall" }, // Bottom wall
    { x: 0, y: 0, width: 32, height: 1500, type: "wall" }, // Left wall
    { x: 1968, y: 0, width: 32, height: 1500, type: "wall" }, // Right wall

    // Trees and natural obstacles
    { x: 200, y: 200, width: 64, height: 64, type: "tree" },
    { x: 400, y: 300, width: 64, height: 64, type: "tree" },
    { x: 600, y: 150, width: 64, height: 64, type: "tree" },
    { x: 1200, y: 400, width: 64, height: 64, type: "tree" },
    { x: 1400, y: 250, width: 64, height: 64, type: "tree" },
    { x: 1600, y: 350, width: 64, height: 64, type: "tree" },

    // Rocks
    { x: 300, y: 500, width: 48, height: 48, type: "rock" },
    { x: 800, y: 600, width: 48, height: 48, type: "rock" },
    { x: 1100, y: 700, width: 48, height: 48, type: "rock" },
    { x: 1500, y: 800, width: 48, height: 48, type: "rock" },

    // Buildings
    { x: 100, y: 800, width: 128, height: 96, type: "house" },
    { x: 300, y: 900, width: 128, height: 96, type: "house" },
    { x: 1700, y: 1000, width: 128, height: 96, type: "house" },
  ],
  npcs: [
    {
      id: 'swamp_hermit',
      name: 'Swamp Hermit',
      x: 500,
      y: 400,
      avatar: 'character_5',
      dialog: "Beware, traveler... this swamp holds many secrets and dangers. The twisted trees whisper of ancient evils that lurk in the murky depths.",
      interactionRadius: 80
    },
    {
      id: 'dark_merchant',
      name: 'Shadow Merchant',
      x: 1200,
      y: 600,
      avatar: 'character_10',
      dialog: "I deal in rare and forbidden goods from the darkest corners of the realm. But beware... my prices are not always paid in gold.",
      interactionRadius: 80
    }
  ],
  doors: [
    {
      id: 'tavern_door',
      x: 800,
      y: 0,
      width: 128,
      height: 32,
      targetMap: 'tavern',
      targetSpawnPoint: { x: 1344, y: 1100 },
      interactionRadius: 50,
      name: 'Enter Tavern',
      description: 'The warm glow of the tavern beckons you back to safety from this dark, foreboding swamp.'
    }
  ],
  shops: [
    {
      id: 'exterior_merchant',
      x: 1200,
      y: 600,
      interactionRadius: 80,
      name: 'Shadow Merchant'
    }
  ],
  enemies: [
    // Low level swamp orcs (Level 1-3)
    {
      id: 'swamp_orc_1',
      name: 'Swamp Orc Scout',
      x: 300,
      y: 300,
      avatar: 'orc_1',
      level: 1,
      stats: {
        health: 50,
        maxHealth: 50,
        attack: 15,
        defense: 5,
        speed: 3
      },
      rewards: {
        gold: 8,
        xp: 25
      },
      respawnTime: 120000, // 2 minutes
      isAlive: true
    },
    {
      id: 'swamp_orc_2',
      name: 'Swamp Orc Warrior',
      x: 600,
      y: 500,
      avatar: 'orc_2',
      level: 2,
      stats: {
        health: 80,
        maxHealth: 80,
        attack: 20,
        defense: 8,
        speed: 2
      },
      rewards: {
        gold: 12,
        xp: 40
      },
      respawnTime: 120000, // 2 minutes
      isAlive: true
    },
    {
      id: 'swamp_orc_3',
      name: 'Swamp Orc Brute',
      x: 900,
      y: 400,
      avatar: 'orc_3',
      level: 3,
      stats: {
        health: 120,
        maxHealth: 120,
        attack: 25,
        defense: 12,
        speed: 1
      },
      rewards: {
        gold: 18,
        xp: 60
      },
      respawnTime: 120000, // 2 minutes
      isAlive: true
    },
    {
      id: 'swamp_orc_4',
      name: 'Swamp Orc Scout',
      x: 1200,
      y: 200,
      avatar: 'orc_1',
      level: 1,
      stats: {
        health: 50,
        maxHealth: 50,
        attack: 15,
        defense: 5,
        speed: 3
      },
      rewards: {
        gold: 8,
        xp: 25
      },
      respawnTime: 120000, // 2 minutes
      isAlive: true
    },
    {
      id: 'swamp_orc_5',
      name: 'Swamp Orc Warrior',
      x: 1500,
      y: 700,
      avatar: 'orc_2',
      level: 2,
      stats: {
        health: 80,
        maxHealth: 80,
        attack: 20,
        defense: 8,
        speed: 2
      },
      rewards: {
        gold: 12,
        xp: 40
      },
      respawnTime: 120000, // 2 minutes
      isAlive: true
    },
    {
      id: 'swamp_orc_6',
      name: 'Swamp Orc Brute',
      x: 400,
      y: 900,
      avatar: 'orc_3',
      level: 3,
      stats: {
        health: 120,
        maxHealth: 120,
        attack: 25,
        defense: 12,
        speed: 1
      },
      rewards: {
        gold: 18,
        xp: 60
      },
      respawnTime: 120000, // 2 minutes
      isAlive: true
    }
  ]
}

// Map registry
export const MAPS: Record<string, MapConfig> = {
  'tavern': TAVERN_MAP,
  'exterior': EXTERIOR_MAP
}

// Map transition system
export class MapManager {
  private currentMapId: string = 'tavern'
  private currentMap: MapConfig = TAVERN_MAP

  getCurrentMap(): MapConfig {
    return this.currentMap
  }

  getCurrentMapId(): string {
    return this.currentMapId
  }

  transitionToMap(mapId: string, spawnPoint?: { x: number; y: number }): MapConfig | null {
    const targetMap = MAPS[mapId]
    if (!targetMap) {
      console.error(`Map ${mapId} not found`)
      return null
    }

    this.currentMapId = mapId
    this.currentMap = targetMap

    // Override spawn point if provided
    if (spawnPoint) {
      this.currentMap.spawnPoint = spawnPoint
    }

    console.log(`Transitioned to map: ${mapId}`)
    return this.currentMap
  }

  getDoorById(doorId: string): Door | null {
    return this.currentMap.doors.find(door => door.id === doorId) || null
  }

  getNPCById(npcId: string): NPC | null {
    return this.currentMap.npcs.find(npc => npc.id === npcId) || null
  }

  getShopById(shopId: string): Shop | null {
    return this.currentMap.shops.find(shop => shop.id === shopId) || null
  }
}
