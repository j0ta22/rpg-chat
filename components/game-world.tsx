"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SocketMultiplayerClient, type CombatChallenge, type CombatState, type CombatAction } from "@/lib/socket-multiplayer"
import { NativeWebSocketClient, type Player, type GameState, type ChatMessage } from "@/lib/native-websocket"
import { savePlayerProgress, loadPlayerProgress, type PlayerSaveData, type PlayerStats } from "@/lib/player-persistence"
import { calculatePlayerStats } from "@/lib/combat-system"
import { calculateXPToNext } from "@/lib/xp-system"
import { supabase } from "@/lib/supabase"
import CombatInterface from "./combat-interface"
import CombatChallengeComponent from "./combat-challenge"
import RankingPanel from "./ranking-panel"
import AdvancedInventoryPanel from "./advanced-inventory-panel"
import ShopPanel from "./shop-panel"

interface Character {
  name: string
  avatar: string
  x: number
  y: number
  stats?: {
    level: number
    experience: number
    health: number
    maxHealth: number
    attack: number
    defense: number
    speed: number
  }
}

interface NPC {
  id: string
  name: string
  x: number
  y: number
  avatar: string
  message: string
  interactionRadius: number
}

interface InterpolatedPlayer extends Player {
  targetX: number
  targetY: number
  startX: number
  startY: number
  interpolationStartTime: number
  interpolationDuration: number
}

interface GameWorldProps {
  character: Character
  onCharacterUpdate: (character: Character) => void
  onBackToCreation: () => void
  onBackToSelection?: () => void
  onLogout?: () => void
  user?: {
    id: string
    username: string
    created_at: string
  } | null
}

interface CollisionObject {
  x: number
  y: number
  width: number
  height: number
  type: string
}

// Tipos simplificados para sprites
type AvatarKey = keyof typeof avatarSprites

// Función para migrar avatares antiguos a nuevos
const migrateAvatar = (oldAvatar: string): AvatarKey => {
  const avatarMigration: Record<string, AvatarKey> = {
    'knight': 'character_1',
    'warrior': 'character_1',
    'wizard': 'character_2',
    'mage': 'character_2',
    'archer': 'character_3',
    'rogue': 'character_4',
    'paladin': 'character_5',
    'black-warrior': 'character_1',
    'black-archer': 'character_2',
    'black-lancer': 'character_3',
    'black-monk': 'character_4',
    'blue-warrior': 'character_5',
    'blue-archer': 'character_6',
    'blue-lancer': 'character_7',
    'blue-monk': 'character_8',
    'red-warrior': 'character_9',
    'red-archer': 'character_10',
    'red-lancer': 'character_11',
    'red-monk': 'character_12',
    'yellow-warrior': 'character_13',
    'yellow-archer': 'character_14',
    'yellow-lancer': 'character_15',
    'yellow-monk': 'character_16',
  }
  
  // Si el avatar ya es válido, devolverlo
  if (oldAvatar in avatarSprites) {
    return oldAvatar as AvatarKey
  }
  
  // Si hay una migración disponible, usarla
  if (oldAvatar in avatarMigration) {
    return avatarMigration[oldAvatar]
  }
  
  // Fallback por defecto
  return 'character_1'
}

  // Configuración de sprites usando los nuevos avatares de sprite_split
  const avatarSprites = {
    'character_1': '/sprite_split/character_1/character_1_frame32x32.png',
    'character_2': '/sprite_split/character_2/character_2_frame32x32.png',
    'character_3': '/sprite_split/character_3/character_3_frame32x32.png',
    'character_4': '/sprite_split/character_4/character_4_frame32x32.png',
    'character_5': '/sprite_split/character_5/character_5_frame32x32.png',
    'character_6': '/sprite_split/character_6/character_6_frame32x32.png',
    'character_7': '/sprite_split/character_7/character_7_frame32x32.png',
    'character_8': '/sprite_split/character_8/character_8_frame32x32.png',
    'character_9': '/sprite_split/character_9/character_9_frame32x32.png',
    'character_10': '/sprite_split/character_10/character_10_frame32x32.png',
    'character_11': '/sprite_split/character_11/character_11_frame32x32.png',
    'character_12': '/sprite_split/character_12/character_12_frame32x32.png',
    'character_13': '/sprite_split/character_13/character_13_frame32x32.png',
    'character_14': '/sprite_split/character_14/character_14_frame32x32.png',
    'character_15': '/sprite_split/character_15/character_15_frame32x32.png',
    'character_16': '/sprite_split/character_16/character_16_frame32x32.png',
    'character_17': '/sprite_split/character_17/character_17_frame32x32.png',
    'character_18': '/sprite_split/character_18/character_18_frame32x32.png',
    'character_19': '/sprite_split/character_19/character_19_frame32x32.png',
    'character_20': '/sprite_split/character_20/character_20_frame32x32.png',
    'character_21': '/sprite_split/character_21/character_21_frame32x32.png',
    'character_22': '/sprite_split/character_22/character_22_frame32x32.png',
    'character_23': '/sprite_split/character_23/character_23_frame32x32.png',
    'character_24': '/sprite_split/character_24/character_24_frame32x32.png',
    'character_25': '/sprite_split/character_25/character_25_frame32x32.png',
    'character_26': '/sprite_split/character_26/character_26_frame32x32.png',
    'character_27': '/sprite_split/character_27/character_27_frame32x32.png',
    'character_28': '/sprite_split/character_28/character_28_frame32x32.png',
    'character_29': '/sprite_split/character_29/character_29_frame32x32.png',
    'character_30': '/sprite_split/character_30/character_30_frame32x32.png',
    'character_31': '/sprite_split/character_31/character_31_frame32x32.png',
    'character_32': '/sprite_split/character_32/character_32_frame32x32.png',
    'character_33': '/sprite_split/character_33/character_33_frame32x32.png',
    'blacksmith': '/blacksmith/BLACKSMITH.png',
    'monkeyking': '/sprite_split/character_2/character_2_frame32x32.png',
  }

  // Configuración para sprites multidireccionales de 32x32
  const SPRITE_CONFIGS: Record<string, {
    totalWidth: number
    totalHeight: number
    frameCount: number
    frameWidth: number
    frameHeight: number
    renderSize: number
    directions: {
      down: number
      up: number
      left: number
      right: number
    }
  }> = {
    // Configuración para sprites con 4 direcciones (asumiendo 4 frames por dirección)
    'default': {
      totalWidth: 128, // 4 frames * 32px
      totalHeight: 128, // 4 direcciones * 32px
      frameCount: 4,
      frameWidth: 32,
      frameHeight: 32,
      renderSize: 64,
      directions: {
        down: 0,   // Primera fila (frames 0-3)
        left: 1,   // Segunda fila (frames 4-7)
        right: 2,  // Tercera fila (frames 8-11)
        up: 3      // Cuarta fila (frames 12-15)
      }
    }
  }

  // Función para obtener la configuración correcta según el avatar
  const getSpriteConfig = (avatarKey: string) => {
    // El blacksmith tiene un spritesheet de 672x92 con 7 frames en línea
    if (avatarKey === 'blacksmith') {
      return {
        frameWidth: 96,  // 672 / 7 = 96
        frameHeight: 92,
        totalWidth: 672,
        totalHeight: 92,
        directions: { down: 0, up: 0, left: 0, right: 0 }, // Todos los frames en la misma fila
        frameCount: 7,
        renderSize: 108,  // Aumentado un 50% (72 * 1.5 = 108)
        animationSpeed: 200,  // Velocidad de animación más rápida (200ms vs 500ms por defecto)
        rotation: 0  // Sin rotación
      }
    }
    
    // El MonkeyKing usa character_2 con configuración estándar
    if (avatarKey === 'monkeyking') {
      return SPRITE_CONFIGS.default
    }
    // Todos los demás avatares usan la configuración por defecto
    return SPRITE_CONFIGS.default
  }

const avatarColors: Record<string, string> = {
  'character_1': "#3b82f6",
  'character_2': "#dc2626",
  'character_3': "#f59e0b",
  'character_4': "#1f2937",
  'character_5': "#10b981",
  'character_6': "#8b5cf6",
  'character_7': "#ef4444",
  'character_8': "#f97316",
  'character_9': "#06b6d4",
  'character_10': "#84cc16",
  'character_11': "#ec4899",
  'character_12': "#6366f1",
  'character_13': "#14b8a6",
  'character_14': "#f59e0b",
  'character_15': "#ef4444",
  'character_16': "#8b5cf6",
  'character_17': "#06b6d4",
  'character_18': "#84cc16",
  'character_19': "#ec4899",
  'character_20': "#6366f1",
  'character_21': "#14b8a6",
  'character_22': "#f59e0b",
  'character_23': "#ef4444",
  'character_24': "#8b5cf6",
  'character_25': "#06b6d4",
  'character_26': "#84cc16",
  'character_27': "#ec4899",
  'character_28': "#6366f1",
  'character_29': "#14b8a6",
  'character_30': "#f59e0b",
  'character_31': "#ef4444",
  'character_32': "#8b5cf6",
  'character_33': "#f59e0b",
  'blacksmith': "#8b4513",
  'monkeyking': "#ff6b35",
}

// Configuración de NPCs
  const npcs: NPC[] = [
    {
      id: "npc_1",
      name: "Tavern keeper",
      x: 1364,
      y: 554,
      avatar: "character_18",
      message: "Hail, good traveller! I am Maeve, keeper of Ye Drunken Monkey. Enter ye, take thy seat by ye hearth, and let ye fine ale and tales flow freely. What bringeth thee to mine humble tavern?",
      interactionRadius: 80
    },
    {
      id: "npc_2",
      name: "Tavern Crier",
      x: 1364,
      y: 698,
      avatar: "character_27",
      message: "Greetings, traveler. I sense great power within you. The ancient secrets of this land await those who are worthy...",
      interactionRadius: 80
    },
    {
      id: "npc_3",
      name: "Ambassador of Apestore",
      x: 84,
      y: 258,
      avatar: "monkeyking",
      message: "Greetings, noble adventurer! I am the Ambassador of Apestore, representing the great trading company from the distant lands. We deal in the finest goods and exotic treasures. Perhaps you would be interested in our wares?",
      interactionRadius: 80
    },
    {
      id: "npc_4",
      name: "Blacksmith",
      x: 76,
      y: 1130,
      avatar: "blacksmith",
      message: "Welcome to my shop! I sell equipment up to level 7. Press E to browse my wares.",
      interactionRadius: 80
    }
  ]

export default function GameWorld({ character, onCharacterUpdate, onBackToCreation, onBackToSelection, onLogout, user }: GameWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const animationRef = useRef<number>()
  const [multiplayerClient, setMultiplayerClient] = useState<SocketMultiplayerClient | null>(null)
  const [websocketClient, setWebsocketClient] = useState<NativeWebSocketClient | null>(null)
  const [otherPlayers, setOtherPlayers] = useState<Record<string, Player>>({})
  const [allPlayers, setAllPlayers] = useState<Record<string, Player>>({})
  const [interpolatedPlayers, setInterpolatedPlayers] = useState<Record<string, InterpolatedPlayer>>({})
  const [playerVisibility, setPlayerVisibility] = useState<Record<string, boolean>>({})
  const [playerId, setPlayerId] = useState<string>("")
  const [camera, setCamera] = useState({ x: 0, y: 0 })
  const [localCharacter, setLocalCharacter] = useState<Character>(character)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [playerChatMessages, setPlayerChatMessages] = useState<Record<string, { text: string; timestamp: number }>>({})
  const [currentMessage, setCurrentMessage] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [showChatInput, setShowChatInput] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [spriteImages, setSpriteImages] = useState<Record<string, HTMLImageElement>>({})
  const [animationFrames, setAnimationFrames] = useState<Record<string, number>>({})
  const [lastRenderTime, setLastRenderTime] = useState<number>(0)
  const animationTimers = useRef<Record<string, number>>({})
  const movementTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionUpdateRef = useRef<number>(0)
  const positionUpdateQueueRef = useRef<{x: number, y: number, direction: string} | null>(null)
  const connectionStatusRef = useRef<{ connected: boolean; lastCheck: number }>({ connected: false, lastCheck: 0 })
  const [nearbyNPC, setNearbyNPC] = useState<NPC | null>(null)
  const [showNPCDialog, setShowNPCDialog] = useState(false)
  const [nearbyDoor, setNearbyDoor] = useState<boolean>(false)
  const [showDoorDialog, setShowDoorDialog] = useState(false)
  const [playerDirection, setPlayerDirection] = useState<'down' | 'up' | 'left' | 'right'>('down')
  const [isMusicMuted, setIsMusicMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Estados del sistema de combate
  const [nearbyPlayer, setNearbyPlayer] = useState<Player | null>(null)
  const [combatChallenge, setCombatChallenge] = useState<CombatChallenge | null>(null)
  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [showCombatInterface, setShowCombatInterface] = useState(false)
  const [nearbyShop, setNearbyShop] = useState<boolean>(false)
  
  // Panel states
  const [showInventoryPanel, setShowInventoryPanel] = useState(false)
  const [showShopPanel, setShowShopPanel] = useState(false)
  const [userGold, setUserGold] = useState(100)
  const [userLevel, setUserLevel] = useState(1)

  // Load user data on mount
  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user?.id])

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('gold, total_wins, total_losses')
        .eq('id', user?.id)
        .single()

      if (error) {
        console.error('Error loading user data:', error)
        return
      }

      if (data) {
        setUserGold(data.gold || 100)
        // Calculate level based on combat experience
        const totalCombats = (data.total_wins || 0) + (data.total_losses || 0)
        const level = Math.floor(totalCombats / 5) + 1
        console.log('👤 User level calculation:', {
          totalWins: data.total_wins,
          totalLosses: data.total_losses,
          totalCombats,
          calculatedLevel: level
        })
        setUserLevel(level)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const showSystemMessage = (message: string) => {
    setSystemMessage({ text: message, timestamp: Date.now() })
    setTimeout(() => {
      setSystemMessage(null)
    }, 5000)
  }

  const showRewardMessage = (message: string) => {
    setRewardMessage({ text: message, timestamp: Date.now() })
    setTimeout(() => {
      setRewardMessage(null)
    }, 8000)
  }

  const [systemMessage, setSystemMessage] = useState<{ text: string; timestamp: number } | null>(null)
  const [rewardMessage, setRewardMessage] = useState<{ text: string; timestamp: number } | null>(null)
  const [tavernLogo, setTavernLogo] = useState<HTMLImageElement | null>(null)
  const [playerStats, setPlayerStats] = useState<{
    level: number
    experience: number
    experienceToNext: number
    health: number
    maxHealth: number
    attack: number
    defense: number
    speed: number
  } | null>(character.stats ? {
    ...character.stats,
    experienceToNext: calculateXPToNext(character.stats.level, character.stats.experience)
  } : null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)
  const [levelUpNotification, setLevelUpNotification] = useState<{
    levelsGained: number
    newLevel: number
    rewards: {
      healthIncrease: number
      attackIncrease: number
      defenseIncrease: number
      speedIncrease: number
    }
  } | null>(null)

  // Canvas responsive - más pequeño en móviles
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 })
  
  useEffect(() => {
    const updateCanvasSize = () => {
      const isMobile = window.innerWidth < 768
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
      
      if (isMobile) {
        setCanvasSize({ width: 350, height: 350 })
      } else if (isTablet) {
        setCanvasSize({ width: 500, height: 500 })
      } else {
        setCanvasSize({ width: 600, height: 600 })
      }
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])
  
  const CANVAS_WIDTH = canvasSize.width
  const CANVAS_HEIGHT = canvasSize.height
  const MAP_WIDTH = 1600
  const MAP_HEIGHT = 1200
  const PLAYER_SIZE = 32
  const MOVE_SPEED = 4

  const collisionObjects: CollisionObject[] = [
    // Outer walls
    { x: 0, y: 0, width: MAP_WIDTH, height: 32, type: "wall" }, // Top wall
    { x: 0, y: MAP_HEIGHT - 32, width: MAP_WIDTH, height: 32, type: "wall" }, // Bottom wall
    { x: 0, y: 0, width: 32, height: MAP_HEIGHT, type: "wall" }, // Left wall
    { x: MAP_WIDTH - 32, y: 0, width: 32, height: MAP_HEIGHT, type: "wall" }, // Right wall

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
    { x: MAP_WIDTH - 200, y: 100, width: 128, height: 96, type: "fireplace" },


    // Barrels and storage
    { x: 1200, y: 300, width: 48, height: 48, type: "barrel" },
    { x: 1200, y: 380, width: 48, height: 48, type: "barrel" },
    { x: 1280, y: 300, width: 48, height: 48, type: "barrel" },
    { x: 1280, y: 380, width: 48, height: 48, type: "barrel" },

    // Additional furniture for better tavern feel
    { x: 50, y: 100, width: 64, height: 32, type: "bench" },
    { x: 50, y: 200, width: 64, height: 32, type: "bench" },
    { x: 1300, y: 500, width: 48, height: 96, type: "bookshelf" },
    { x: 1300, y: 650, width: 48, height: 96, type: "bookshelf" },
  ]

  const checkCollision = useCallback((newX: number, newY: number): boolean => {
    const playerRect = {
      x: newX - PLAYER_SIZE / 2,
      y: newY - PLAYER_SIZE / 2,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    }

    return collisionObjects.some((obj) => {
      return (
        playerRect.x < obj.x + obj.width &&
        playerRect.x + playerRect.width > obj.x &&
        playerRect.y < obj.y + obj.height &&
        playerRect.y + playerRect.height > obj.y
      )
    })
  }, [collisionObjects])

  // Función para detectar NPCs cercanos
  const checkNearbyNPCs = useCallback((playerX: number, playerY: number) => {
    const nearby = npcs.find(npc => {
      const distance = Math.sqrt(
        Math.pow(playerX - npc.x, 2) + Math.pow(playerY - npc.y, 2)
      )
      return distance <= npc.interactionRadius
    })
    
    setNearbyNPC(nearby || null)
  }, [])

  // Función para detectar jugadores cercanos para combate
  const checkNearbyPlayers = useCallback((playerX: number, playerY: number) => {
    if (!playerId || Object.keys(otherPlayers).length === 0) {
      setNearbyPlayer(null)
      return
    }

    const nearby = Object.values(otherPlayers).find(player => {
      const distance = Math.sqrt(
        Math.pow(playerX - player.x, 2) + Math.pow(playerY - player.y, 2)
      )
      return distance <= 50 // Challenge range
    })
    
    setNearbyPlayer(nearby || null)
  }, [playerId, otherPlayers])

  // Verificar proximidad a la puerta
  const checkNearbyDoor = useCallback((playerX: number, playerY: number) => {
    const doorX = 1344
    const doorY = MAP_HEIGHT - 32
    const doorWidth = 128
    const doorHeight = 32
    const interactionRange = 50

    const isNearDoor = (
      playerX >= doorX - interactionRange &&
      playerX <= doorX + doorWidth + interactionRange &&
      playerY >= doorY - interactionRange &&
      playerY <= doorY + doorHeight + interactionRange
    )

    // Debug logs temporales con cálculo detallado
    const leftBound = doorX - interactionRange
    const rightBound = doorX + doorWidth + interactionRange
    const topBound = doorY - interactionRange
    const bottomBound = doorY + doorHeight + interactionRange
    
    console.log('🚪 Door proximity check:', { 
      playerX, 
      playerY, 
      doorX, 
      doorY, 
      doorWidth, 
      doorHeight,
      interactionRange,
      leftBound,
      rightBound,
      topBound,
      bottomBound,
      isNearDoor,
      currentNearbyDoor: nearbyDoor,
      xCheck: `${playerX} >= ${leftBound} && ${playerX} <= ${rightBound}`,
      yCheck: `${playerY} >= ${topBound} && ${playerY} <= ${bottomBound}`
    })

    if (isNearDoor !== nearbyDoor) {
      console.log('🚪 Door proximity CHANGED:', { 
        from: nearbyDoor,
        to: isNearDoor
      })
    }

    setNearbyDoor(isNearDoor)
  }, [nearbyDoor])

  // Verificar proximidad al shop
  const checkNearbyShop = useCallback((playerX: number, playerY: number) => {
    const shopX = 76  // Nueva posición del blacksmith
    const shopY = 1130  // Nueva posición del blacksmith
    const interactionRange = 80

    const isNearShop = (
      playerX >= shopX - interactionRange &&
      playerX <= shopX + interactionRange &&
      playerY >= shopY - interactionRange &&
      playerY <= shopY + interactionRange
    )

    setNearbyShop(isNearShop)
  }, [])

  // Verificar proximidad inicial a la puerta y shop
  useEffect(() => {
    if (localCharacter.x && localCharacter.y) {
      checkNearbyDoor(localCharacter.x, localCharacter.y)
      checkNearbyShop(localCharacter.x, localCharacter.y)
    }
  }, [localCharacter.x, localCharacter.y, checkNearbyDoor, checkNearbyShop])

  // Monitorear cambios en nearbyDoor
  useEffect(() => {
    console.log('🚪 nearbyDoor state changed:', nearbyDoor)
  }, [nearbyDoor])

  // Función para interactuar con NPC
  const interactWithNPC = useCallback(() => {
    if (nearbyNPC) {
      setShowNPCDialog(true)
    }
  }, [nearbyNPC])

  // Función para interactuar con la puerta
  const interactWithDoor = useCallback(() => {
    if (nearbyDoor) {
      setShowDoorDialog(true)
    }
  }, [nearbyDoor])

  // Función para desafiar a un jugador
  const challengePlayer = useCallback(() => {
    if (nearbyPlayer && websocketClient) {
      websocketClient.challengePlayer(nearbyPlayer.id)
    }
  }, [nearbyPlayer, websocketClient])

  // Función para manejar desafíos de combate
  const handleCombatChallenge = useCallback((challenge: CombatChallenge) => {
    setCombatChallenge(challenge)
  }, [])

  // Función para guardar progreso del jugador en Supabase
  const savePlayerProgressToSupabase = useCallback(async () => {
    console.log('🔄 savePlayerProgressToSupabase called')
    console.log('📊 playerStats:', playerStats)
    console.log('👤 localCharacter:', localCharacter)
    
    if (!localCharacter.name) {
      console.log('❌ Missing character name for save')
      return
    }
    
    // Usar stats por defecto si playerStats es null
    const statsToSave = playerStats || {
      level: 1,
      experience: 0,
      health: 100,
      maxHealth: 100,
      attack: 10,
      defense: 5,
      speed: 5
    }
    
    console.log('💾 Using stats for save:', statsToSave)
    
    setIsSaving(true)
    try {
      const playerData: PlayerSaveData = {
        name: localCharacter.name,
        avatar: localCharacter.avatar,
        stats: statsToSave
      }
      
      console.log('💾 Attempting to save player data:', playerData)
      const success = await savePlayerProgress(playerData)
      if (success) {
        console.log('✅ Progress saved to Supabase successfully')
      } else {
        console.error('❌ Failed to save progress to Supabase')
      }
    } catch (error) {
      console.error('❌ Error saving progress to Supabase:', error)
    } finally {
      setIsSaving(false)
    }
  }, [playerStats, localCharacter])

  // Función para manejar actualizaciones del estado de combate
  const handleCombatStateUpdate = useCallback((newCombatState: CombatState) => {
    console.log('⚔️ Combat state update received:', newCombatState.status)
    setCombatState(newCombatState)
    setShowCombatInterface(true)
    
    // Si el combate terminó, limpiar después de un delay más corto
    if (newCombatState.status === 'finished') {
      console.log('🏁 Combat finished, scheduling auto-close in 2 seconds')
      // Cerrar inmediatamente la ventana de desafío si está abierta
      setCombatChallenge(null)
      
      // Cerrar automáticamente después de 2 segundos
      setTimeout(() => {
        console.log('🚪 Auto-closing combat interface')
        setCombatState(null)
        setShowCombatInterface(false)
      }, 2000)
    }
  }, [])

  // Función para cerrar manualmente la interfaz de combate
  const handleCloseCombatInterface = useCallback(() => {
    setCombatState(null)
    setShowCombatInterface(false)
  }, [])

  const handleXPUpdate = useCallback((xpUpdate: any) => {
    console.log(`📊 XP Update: +${xpUpdate.xpGained} XP, Level ${xpUpdate.newStats.level}`)
    
    // Update player stats
    setPlayerStats(xpUpdate.newStats)
    
    // Also update the player in allPlayers so the level shows correctly
    if (playerId) {
      console.log(`🔧 Updating player ${playerId} stats in allPlayers:`, xpUpdate.newStats)
      setAllPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          stats: xpUpdate.newStats
        }
      }))
    } else {
      console.log('❌ No playerId available for stats update')
    }
    
    // Show level up notification if applicable
    if (xpUpdate.leveledUp && xpUpdate.levelUpReward) {
      setLevelUpNotification({
        levelsGained: xpUpdate.levelsGained,
        newLevel: xpUpdate.newStats.level,
        rewards: xpUpdate.levelUpReward
      })
      
      // Auto-hide level up notification after 5 seconds
      setTimeout(() => {
        setLevelUpNotification(null)
      }, 5000)
    }
    
    // Guardar progreso automáticamente cuando cambian las stats
    setTimeout(() => {
      console.log('💾 Auto-saving after XP update')
      savePlayerProgressToSupabase()
    }, 100) // Pequeño delay para asegurar que el estado se actualice
  }, [playerId, savePlayerProgressToSupabase])

  // Función para cargar progreso del jugador desde Supabase
  const loadPlayerProgressFromSupabase = useCallback(async () => {
    console.log('🔄 loadPlayerProgressFromSupabase called for:', localCharacter.name)
    console.log('🔄 Current user ID:', user?.id)
    
    if (!localCharacter.name) {
      console.log('❌ No character name available for loading')
      setIsLoadingProgress(false)
      return false
    }
    
    try {
      console.log('🔍 Calling loadPlayerProgress with name:', localCharacter.name)
      const savedData = await loadPlayerProgress(localCharacter.name)
      console.log('🔍 loadPlayerProgress result:', savedData)
      
      if (savedData) {
        console.log('💾 Loading saved progress from Supabase:', savedData)
        console.log('📊 Saved stats:', savedData.stats)
        
        // Actualizar el personaje local con los datos guardados
        setLocalCharacter(prev => ({
          ...prev,
          name: savedData.name,
          avatar: savedData.avatar
        }))
        
        // Actualizar stats del jugador con bonuses de equipamiento
        const baseStats = {
          ...savedData.stats,
          experienceToNext: calculateXPToNext(savedData.stats.level, savedData.stats.experience)
        }
        
        console.log('📊 Base stats calculated:', baseStats)
        
        // Calcular stats finales incluyendo bonuses de equipamiento
        const finalStats = await calculatePlayerStats(user?.id || '', baseStats)
        
        console.log('📊 Final stats calculated:', finalStats)
        console.log('📊 Setting playerStats to:', finalStats)
        setPlayerStats(finalStats)
        
        console.log('✅ Progress loaded successfully from Supabase')
        setIsLoadingProgress(false)
        return true
      } else {
        console.log('ℹ️ No saved progress found in Supabase')
        setIsLoadingProgress(false)
        return false
      }
    } catch (error) {
      console.error('❌ Error loading progress from Supabase:', error)
      setIsLoadingProgress(false)
      return false
    }
  }, [localCharacter.name, user?.id])

  // Función para responder a un desafío
  const respondToChallenge = useCallback((accepted: boolean) => {
    if (combatChallenge && websocketClient) {
      websocketClient.respondToChallenge(combatChallenge.id, accepted)
      setCombatChallenge(null)
    }
  }, [combatChallenge, websocketClient])

  // Función para enviar una acción de combate
  const sendCombatAction = useCallback((action: CombatAction) => {
    if (combatState && websocketClient) {
      websocketClient.sendCombatAction(combatState.id, action)
    }
  }, [combatState, websocketClient])

  // Function to find a safe spawn point (sin useCallback para evitar dependencias circulares)
  const findSafeSpawnPoint = (preferredX: number, preferredY: number) => {
    // Try the preferred position first
    if (!checkCollision(preferredX, preferredY)) {
      return { x: preferredX, y: preferredY }
    }
    
    // Define safe spawn points in the tavern
    const safeSpawnPoints = [
      { x: 100, y: 150 },  // Left side, near entrance
      { x: 120, y: 180 },  // Alternative left side
      { x: 550, y: 150 },  // Center area
      { x: 550, y: 350 },  // Center-bottom
      { x: 1100, y: 150 }, // Right side
      { x: 1100, y: 550 }, // Right-bottom
    ]
    
    // Try each safe spawn point
    for (const point of safeSpawnPoints) {
      if (!checkCollision(point.x, point.y)) {
        return point
      }
    }
    
    // Fallback: find any position without collision
    for (let y = PLAYER_SIZE; y < MAP_HEIGHT - PLAYER_SIZE; y += 50) {
      for (let x = PLAYER_SIZE; x < MAP_WIDTH - PLAYER_SIZE; x += 50) {
        if (!checkCollision(x, y)) {
          return { x, y }
        }
      }
    }
    
    // Last resort: use preferred position anyway
    return { x: preferredX, y: preferredY }
  }

  useEffect(() => {
    const preferredX = Math.max(PLAYER_SIZE, Math.min(MAP_WIDTH - PLAYER_SIZE, character.x || 100))
    const preferredY = Math.max(PLAYER_SIZE, Math.min(MAP_HEIGHT - PLAYER_SIZE, character.y || 150))

    // Find a safe spawn point
    const safeSpawn = findSafeSpawnPoint(preferredX, preferredY)
    const initialCharacter = { ...character, x: safeSpawn.x, y: safeSpawn.y }
    
    setLocalCharacter(initialCharacter)
    onCharacterUpdate(initialCharacter)
  }, [character.name, character.avatar]) // Solo depender de propiedades que no cambien

  // Configurar audio de fondo
  useEffect(() => {
    const audio = new Audio('/tavern.wav')
    audio.loop = true
    audio.volume = 0.05 // Volumen moderado
    audioRef.current = audio

    // Intentar reproducir automáticamente (puede fallar por políticas del navegador)
    const playAudio = async () => {
      try {
        await audio.play()
      } catch (error) {
        console.log('Could not auto-play audio:', error)
      }
    }

    playAudio()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Manejar mute/unmute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMusicMuted
    }
  }, [isMusicMuted])

  useEffect(() => {
    // Prevent multiple connections
    if (websocketClient) {
      return
    }
    
    const client = new NativeWebSocketClient(
      (state: GameState) => {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.1) { // 10% of the time
        console.log('📥 Estado del juego recibido:', state)
        }
        
        // Actualizar todos los jugadores directamente
        setAllPlayers(state.players)
        
        // Separar otros jugadores (sin el actual)
        const currentPlayerId = client.getPlayerId()
        const others = { ...state.players }
        delete others[currentPlayerId]
        setOtherPlayers(others)
        
        // Marcar todos los jugadores como visibles
        const visibility: Record<string, boolean> = {}
        Object.keys(state.players).forEach(id => {
          visibility[id] = true
        })
        setPlayerVisibility(visibility)
      },
      (player: Player) => {
        // Player joined
        console.log(`🎮 Player ${player.name} joined the game`)
        
      },
      (playerId: string) => {
        // Player left
        console.log(`👋 Player ${playerId} left the game`)
        
        // Actualizar estado local
        setAllPlayers(prev => {
          const updated = { ...prev }
          delete updated[playerId]
          return updated
        })
        
        setOtherPlayers(prev => {
          const updated = { ...prev }
          delete updated[playerId]
          return updated
        })
        
        setPlayerVisibility(prev => {
          const updated = { ...prev }
          delete updated[playerId]
          return updated
        })
      },
      (message: ChatMessage) => {
        // Chat message received
        console.log(`💬 ${message.playerName}: ${message.text}`)
        
        // Si es un mensaje del sistema, mostrarlo de manera especial
        if (message.playerId === 'system' || message.playerName === 'System') {
          setSystemMessage({ text: message.text, timestamp: Date.now() })
          // Limpiar el mensaje del sistema después de 8 segundos
          setTimeout(() => {
            setSystemMessage(null)
          }, 8000)
        } else {
          setChatMessages(prev => [...prev, message].slice(-10)) // Mantener solo los últimos 10 mensajes
          
          // También guardar el mensaje para mostrar como globo de diálogo
          setPlayerChatMessages(prev => ({
          ...prev,
            [message.playerId]: {
              text: message.text,
              timestamp: message.timestamp
            }
          }))
          
          // Limpiar el mensaje después de 10 segundos
          setTimeout(() => {
            setPlayerChatMessages(prev => {
              const updated = { ...prev }
              delete updated[message.playerId]
              return updated
            })
          }, 10000)
        }
      },
      handleXPUpdate,
      // handle gold updates (server tells how much gold to add)
      async (goldUpdate: { delta: number }) => {
        try {
          const delta = goldUpdate?.delta || 0
          if (delta === 0) return
          setUserGold(prev => (prev || 0) + delta)
          // Persist to Supabase
          if (user?.id) {
            await supabase
              .from('users')
              .update({ gold: (userGold || 0) + delta })
              .eq('id', user.id)
          }
          showRewardMessage(`You earned ${delta} gold!`)
        } catch (e) {
          console.error('Error applying gold update:', e)
        }
      },
      (playerId: string) => {
        // Player ID received from server
        console.log('🎯 Player ID received:', playerId)
        setPlayerId(playerId)
      },
      (data: { playerId: string; x: number; y: number; direction: string }) => {
        // Player moved - start interpolation for smooth movement
        // Only log occasionally to avoid spam
        if (Math.random() < 0.001) { // 0.1% of the time
          console.log('🎮 Player moved:', data.playerId, 'to', data.x, data.y)
        }
        
        setAllPlayers(prev => {
          if (prev[data.playerId]) {
            const currentPlayer = prev[data.playerId]
            const now = Date.now()
            
            // Start interpolation
            setInterpolatedPlayers(prevInterp => ({
              ...prevInterp,
              [data.playerId]: {
                ...currentPlayer,
                targetX: data.x,
                targetY: data.y,
                startX: currentPlayer.x,
                startY: currentPlayer.y,
                interpolationStartTime: now,
                interpolationDuration: 100, // 100ms interpolation duration for faster response
                direction: data.direction
              }
            }))
            
            // Update the target position in allPlayers for future interpolations
            return {
              ...prev,
              [data.playerId]: {
                ...prev[data.playerId],
                x: data.x,
                y: data.y,
                direction: data.direction
              }
            }
          }
          return prev
        })
      },
      (challenge: any) => {
        // Combat challenge received
        console.log('⚔️ Combat challenge received from:', challenge.challenger.name)
        setCombatChallenge(challenge)
      },
      (combatState: any) => {
        // Combat state update received
        console.log('⚔️ Combat state update received:', combatState.status)
        handleCombatStateUpdate(combatState)
      },
      (data: any) => {
        // Combat challenge declined
        console.log('⚔️ Combat challenge declined by:', data.challengedName)
        setCombatChallenge(null)
      },
      (itemDrop: any) => {
        // Item drop received
        console.log('🎁 Item drop received:', itemDrop)
        showRewardMessage(itemDrop.message)
        // Optionally refresh inventory or show item notification
      }
    )

    client.connect().then(async () => {
      setWebsocketClient(client)
      
      // Cargar progreso guardado antes de unirse al juego
      // Pequeño delay para asegurar que cualquier guardado previo haya terminado
      await new Promise(resolve => setTimeout(resolve, 1000))
      const progressLoaded = await loadPlayerProgressFromSupabase()
      
      // Si no hay progreso guardado, crear stats iniciales y guardarlos
      if (!progressLoaded) {
        console.log('🆕 New player detected, creating initial stats')
        const initialStats = {
          level: 1,
          experience: 0,
          experienceToNext: 100,
          health: 100,
          maxHealth: 100,
          attack: 10,
          defense: 5,
          speed: 5
        }
        setPlayerStats(initialStats)
        
        // Guardar stats iniciales después de un breve delay
        setTimeout(() => {
          console.log('💾 Saving initial stats for new player')
          console.log('💾 Character data:', {
            name: character.name,
            avatar: character.avatar,
            stats: playerStats
          })
          savePlayerProgressToSupabase()
        }, 1000)
      }
      
      // Unirse al juego después de un breve delay para asegurar que la conexión esté estable
      setTimeout(() => {
        client.joinGame({
          name: character.name,
          avatar: character.avatar,
          x: localCharacter.x || 100,
          y: localCharacter.y || 150,
          color: avatarColors[character.avatar] || "#3b82f6",
          userId: user?.id // Include user ID for server database operations
        })
      }, 500)
    }).catch((error) => {
      console.error('❌ Error conectando al servidor:', error)
    })

    return () => {
      // Guardar progreso antes de desconectar
      if (playerStats) {
        console.log('💾 Saving progress before disconnect')
        savePlayerProgressToSupabase()
      }
      
      client.disconnect()
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current)
      }
    }
  }, []) // Empty dependency array to run only once

  // Update interpolated player positions every frame
  useEffect(() => {
    const updateInterpolatedPositions = () => {
      const now = Date.now()
      
      setInterpolatedPlayers(prev => {
        const updated = { ...prev }
        
        Object.keys(updated).forEach(playerId => {
          const player = updated[playerId]
          const elapsed = now - player.interpolationStartTime
          const progress = Math.min(elapsed / player.interpolationDuration, 1)
          
          if (progress >= 1) {
            // Interpolation complete, remove from interpolated players
            delete updated[playerId]
          } else {
            // Interpolate position using easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
            const currentX = player.startX + (player.targetX - player.startX) * easeProgress
            const currentY = player.startY + (player.targetY - player.startY) * easeProgress
            
            updated[playerId] = {
              ...player,
              x: currentX,
              y: currentY
            }
          }
        })
        
        return updated
      })
    }
    
    const interval = setInterval(updateInterpolatedPositions, 16) // ~60 FPS
    return () => clearInterval(interval)
  }, [])

  // Monitor connection status and sync positions periodically
  useEffect(() => {
    if (websocketClient) {
      const checkConnection = () => {
        const isConnected = websocketClient.isConnectedToServer()
        const now = Date.now()
        
        if (connectionStatusRef.current.connected !== isConnected) {
          connectionStatusRef.current = { connected: isConnected, lastCheck: now }
          console.log(`🔌 Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`)
          
          // Si se perdió la conexión, no intentar reconectar automáticamente
          if (!isConnected) {
            console.log('🔌 Connection lost - player will remain in game locally')
          }
        }
      }
      
      // Sync position every 1 second (more frequent for better synchronization)
      const syncPosition = () => {
        if (websocketClient && websocketClient.isConnectedToServer()) {
          try {
            websocketClient.updatePlayerPosition(localCharacter.x, localCharacter.y, playerDirection)
            // Only log occasionally to avoid spam
            if (Math.random() < 0.1) { // 10% of the time
              console.log(`🔄 Syncing position: (${localCharacter.x}, ${localCharacter.y})`)
            }
          } catch (error) {
            console.warn('⚠️ Error sincronizando posición:', error)
          }
        }
      }
      
      // Guardar progreso periódicamente cada 30 segundos
      const saveProgress = () => {
        if (websocketClient && websocketClient.isConnectedToServer() && playerStats) {
          console.log('💾 Periodic save triggered')
          savePlayerProgressToSupabase()
        }
      }
      
      const connectionInterval = setInterval(checkConnection, 5000) // Check every 5 seconds
      const positionInterval = setInterval(syncPosition, 1000) // Sync position every 1 second
      const saveInterval = setInterval(saveProgress, 30000) // Save progress every 30 seconds
      
      return () => {
        clearInterval(connectionInterval)
        clearInterval(positionInterval)
        clearInterval(saveInterval)
      }
    }
  }, [websocketClient, localCharacter.x, localCharacter.y, playerDirection]) // Include playerDirection in dependencies

  // Sincronizar otherPlayers cuando cambie allPlayers (robusto)
  useEffect(() => {
    if (playerId && Object.keys(allPlayers).length > 0) {
      const others = { ...allPlayers }
      delete others[playerId]
      setOtherPlayers(others)
      console.log(`🔄 Syncing otherPlayers: ${Object.keys(others).length} players`)
    }
  }, [allPlayers, playerId])


  // Sistema simplificado de carga de sprites
  useEffect(() => {
    const images: Record<string, HTMLImageElement> = {}
    
    Object.entries(avatarSprites).forEach(([key, src]) => {
      const img = new Image()
      img.src = src
      images[key] = img
    })
    
    setSpriteImages(images)
  }, [])

  // Cargar logo de la taberna
  useEffect(() => {
    const loadTavernLogo = async () => {
      const img = new Image()
      img.src = '/cartel.svg'
      img.onload = () => {
        setTavernLogo(img)
        console.log('🏪 Tavern logo loaded successfully')
      }
      img.onerror = () => {
        console.log('❌ Failed to load tavern logo')
      }
    }
    
    loadTavernLogo()
  }, [])

  // Animación global con configuraciones específicas
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = []
    
    Object.keys(avatarSprites).forEach(key => {
      const config = getSpriteConfig(key)
      
      // Usar configuración estándar para todos los avatares incluyendo MonkeyKing
      
      const animationSpeed = (config as any).animationSpeed || 500 // Usar velocidad específica o 500ms por defecto
      
    const interval = setInterval(() => {
      setAnimationFrames(prev => {
        const newFrames = { ...prev }
        let hasChanges = false
        
          const spriteImage = spriteImages[key]
          if (spriteImage && spriteImage.complete && spriteImage.naturalWidth > 0) {
            const realFrameCount = Math.floor(spriteImage.naturalWidth / config.frameWidth)
            const newFrame = ((prev[key] || 0) + 1) % realFrameCount
            if (newFrame !== prev[key]) {
              newFrames[key] = newFrame
              hasChanges = true
            }
          } else {
            // Fallback a configuración por defecto
            const newFrame = ((prev[key] || 0) + 1) % config.frameCount
            if (newFrame !== prev[key]) {
              newFrames[key] = newFrame
              hasChanges = true
            }
          }
        
        return hasChanges ? newFrames : prev
      })
      }, animationSpeed)
      
      intervals.push(interval)
    })
    
    return () => {
      intervals.forEach(interval => clearInterval(interval))
    }
  }, [spriteImages])


  const generateTerrain = useCallback((ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) => {
    ctx.imageSmoothingEnabled = false

    // Enhanced stone floor base with better texture
    const baseGradient = ctx.createLinearGradient(0, 0, 0, MAP_HEIGHT)
    baseGradient.addColorStop(0, "#8b7d6b")
    baseGradient.addColorStop(0.3, "#7a6d5a")
    baseGradient.addColorStop(0.7, "#6b5e4b")
    baseGradient.addColorStop(1, "#5c4f3c")
    ctx.fillStyle = baseGradient
    ctx.fillRect(-cameraX, -cameraY, MAP_WIDTH, MAP_HEIGHT)

    // Enhanced stone tile pattern with more variation
    for (let x = 0; x < MAP_WIDTH; x += 32) {
      for (let y = 0; y < MAP_HEIGHT; y += 32) {
        const tileVariation = (x + y) % 256
        const noise = Math.sin(x * 0.01 + y * 0.01) * 0.1
        
        if (tileVariation === 0) {
          // Highlighted stone tiles
          ctx.fillStyle = `#${Math.floor(154 + noise * 20).toString(16)}${Math.floor(140 + noise * 15).toString(16)}${Math.floor(122 + noise * 10).toString(16)}`
          ctx.fillRect(x - cameraX, y - cameraY, 32, 32)
          // Mortar lines
          ctx.fillStyle = "#6b5e4b"
          ctx.fillRect(x - cameraX + 1, y - cameraY + 1, 30, 1)
          ctx.fillRect(x - cameraX + 1, y - cameraY + 16, 30, 1)
          ctx.fillRect(x - cameraX + 1, y - cameraY + 30, 30, 1)
          ctx.fillRect(x - cameraX + 1, y - cameraY + 1, 1, 30)
          ctx.fillRect(x - cameraX + 16, y - cameraY + 1, 1, 30)
          ctx.fillRect(x - cameraX + 30, y - cameraY + 1, 1, 30)
        } else if (tileVariation === 64) {
          // Darker stone variation
          ctx.fillStyle = `#${Math.floor(122 + noise * 15).toString(16)}${Math.floor(109 + noise * 12).toString(16)}${Math.floor(90 + noise * 8).toString(16)}`
          ctx.fillRect(x - cameraX, y - cameraY, 32, 32)
        } else if (tileVariation === 128) {
          // Weathered stone tiles
          ctx.fillStyle = `#${Math.floor(139 + noise * 18).toString(16)}${Math.floor(125 + noise * 14).toString(16)}${Math.floor(107 + noise * 9).toString(16)}`
          ctx.fillRect(x - cameraX, y - cameraY, 32, 32)
          // Add wear marks
          ctx.fillStyle = "#5c4f3c"
          ctx.fillRect(x - cameraX + 8, y - cameraY + 8, 16, 2)
          ctx.fillRect(x - cameraX + 12, y - cameraY + 20, 8, 1)
        }
      }
    }

    // Enhanced wooden floor area with better wood grain
    const woodGradient = ctx.createLinearGradient(550, 150, 550, 700)
    woodGradient.addColorStop(0, "#8b4513")
    woodGradient.addColorStop(0.5, "#a0522d")
    woodGradient.addColorStop(1, "#654321")
    ctx.fillStyle = woodGradient
    ctx.fillRect(550 - cameraX, 150 - cameraY, 600, 550)

    // Wooden planks with enhanced grain pattern
    for (let y = 150; y < 700; y += 32) {
      // Main plank color with variation
      const plankVariation = Math.sin(y * 0.02) * 0.1
      ctx.fillStyle = `#${Math.floor(160 + plankVariation * 30).toString(16)}${Math.floor(82 + plankVariation * 20).toString(16)}${Math.floor(45 + plankVariation * 15).toString(16)}`
      ctx.fillRect(550 - cameraX, y - cameraY, 600, 28)
      
      // Wood grain lines
      ctx.fillStyle = "#654321"
      ctx.fillRect(550 - cameraX, y - cameraY, 600, 2)
      ctx.fillRect(550 - cameraX, y - cameraY + 14, 600, 1)
      ctx.fillRect(550 - cameraX, y - cameraY + 28, 600, 2)
      
      // Enhanced wood grain with multiple lines
      ctx.fillStyle = "#5a3a1a"
      for (let grainY = y + 4; grainY < y + 28; grainY += 8) {
        ctx.fillRect(550 - cameraX, grainY - cameraY, 600, 1)
      }
      
      // Vertical plank separations
      for (let x = 550; x < 1150; x += 96) {
        ctx.fillStyle = "#4a2c17"
        ctx.fillRect(x - cameraX, y - cameraY, 2, 28)
        // Wood knots
        if ((x + y) % 192 === 0) {
          ctx.fillStyle = "#3d1f0a"
          ctx.beginPath()
          ctx.arc(x - cameraX + 48, y - cameraY + 14, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    collisionObjects.forEach((obj) => {
      const objX = obj.x - cameraX
      const objY = obj.y - cameraY

      if (objX + obj.width > -50 && objX < CANVAS_WIDTH + 50 && objY + obj.height > -50 && objY < CANVAS_HEIGHT + 50) {
        switch (obj.type) {
          case "wall":
            ctx.fillStyle = "#654321"
            ctx.fillRect(objX, objY, obj.width, obj.height)
            for (let i = 0; i < obj.width; i += 32) {
              for (let j = 0; j < obj.height; j += 16) {
                ctx.fillStyle = "#5a3a1a"
                ctx.strokeRect(objX + i, objY + j, 32, 16)
              }
            }
            break

          case "bar":
            const barGradient = ctx.createLinearGradient(objX, objY, objX, objY + 16)
            barGradient.addColorStop(0, "#deb887")
            barGradient.addColorStop(1, "#a0522d")
            ctx.fillStyle = barGradient
            ctx.fillRect(objX, objY, obj.width, obj.height)
            for (let i = 0; i < obj.width; i += 48) {
      ctx.fillStyle = "#654321"
              ctx.fillRect(objX + i, objY + 16, 2, obj.height - 16)
              ctx.fillRect(objX + i + 24, objY + 16, 2, obj.height - 16)
            }
            break

          case "table":
            const tableGradient = ctx.createRadialGradient(
              objX + obj.width / 2,
              objY + obj.height / 2,
              0,
              objX + obj.width / 2,
              objY + obj.height / 2,
              obj.width / 2,
            )
            tableGradient.addColorStop(0, "#deb887")
            tableGradient.addColorStop(1, "#cd853f")
            ctx.fillStyle = tableGradient
            ctx.fillRect(objX, objY, obj.width, obj.height)
            ctx.fillStyle = "#8b7355"
            ctx.strokeRect(objX, objY, obj.width, obj.height)
      ctx.fillStyle = "#654321"
            ctx.fillRect(objX + 8, objY + 8, 8, 8)
            ctx.fillRect(objX + obj.width - 16, objY + 8, 8, 8)
            ctx.fillRect(objX + 8, objY + obj.height - 16, 8, 8)
            ctx.fillRect(objX + obj.width - 16, objY + obj.height - 16, 8, 8)
            break

          case "fireplace":
      ctx.fillStyle = "#696969"
            ctx.fillRect(objX, objY, obj.width, obj.height)
            for (let i = 0; i < obj.width; i += 16) {
              for (let j = 0; j < obj.height; j += 16) {
                ctx.fillStyle = "#778899"
                ctx.fillRect(objX + i + 2, objY + j + 2, 12, 12)
              }
            }
            const fireHeight = 32 + Math.sin(Date.now() * 0.01) * 8
            ctx.fillStyle = "#ff4500"
            ctx.fillRect(objX + 16, objY + obj.height - fireHeight, obj.width - 32, fireHeight - 16)
            ctx.fillStyle = "#ffd700"
            ctx.fillRect(objX + 24, objY + obj.height - fireHeight + 8, obj.width - 48, fireHeight - 24)
            break


          case "barrel":
            const barrelGradient = ctx.createRadialGradient(
              objX + obj.width / 2,
              objY + obj.height / 2,
              0,
              objX + obj.width / 2,
              objY + obj.height / 2,
              obj.width / 2,
            )
            barrelGradient.addColorStop(0, "#cd853f")
            barrelGradient.addColorStop(1, "#8b4513")
            ctx.fillStyle = barrelGradient
            ctx.fillRect(objX, objY, obj.width, obj.height)
            ctx.fillStyle = "#2f4f4f"
            ctx.fillRect(objX, objY + 8, obj.width, 4)
            ctx.fillRect(objX, objY + obj.height - 12, obj.width, 4)
            ctx.fillRect(objX, objY + obj.height / 2 - 2, obj.width, 4)
            break

          case "bench":
            ctx.fillStyle = "#8b4513"
            ctx.fillRect(objX, objY, obj.width, obj.height)
            ctx.fillStyle = "#654321"
            ctx.fillRect(objX, objY, obj.width, 8)
            break

          case "bookshelf":
            ctx.fillStyle = "#654321"
            ctx.fillRect(objX, objY, obj.width, obj.height)
            const bookColors = ["#8b0000", "#006400", "#4b0082", "#ff8c00"]
            for (let i = 0; i < obj.height; i += 16) {
              for (let j = 0; j < obj.width; j += 8) {
                ctx.fillStyle = bookColors[(i + j) % bookColors.length]
                ctx.fillRect(objX + j, objY + i, 6, 14)
              }
            }
            break
        }
      }
    })

    const candlePositions = [
      { x: 648, y: 220 },
      { x: 848, y: 220 },
      { x: 1048, y: 220 },
      { x: 648, y: 420 },
      { x: 848, y: 420 },
      { x: 1048, y: 420 },
      { x: 648, y: 620 },
      { x: 848, y: 620 },
    ]

    candlePositions.forEach((candle) => {
      const candleX = candle.x - cameraX
      const candleY = candle.y - cameraY
      if (candleX > -20 && candleX < CANVAS_WIDTH + 20 && candleY > -20 && candleY < CANVAS_HEIGHT + 20) {
        ctx.fillStyle = "#daa520"
        ctx.fillRect(candleX, candleY, 8, 16)
        ctx.fillStyle = "#b8860b"
        ctx.fillRect(candleX + 1, candleY + 12, 6, 2)
        const flameFlicker = Math.sin(Date.now() * 0.02 + candle.x) * 2
        ctx.fillStyle = "#ff6347"
        ctx.fillRect(candleX + 2, candleY - 8 + flameFlicker, 4, 8)
        ctx.fillStyle = "#ffd700"
        ctx.fillRect(candleX + 3, candleY - 6 + flameFlicker, 2, 4)
      }
    })

    // Dibujar puerta cerrada en la parte inferior (para futura expansión)
    const doorX = 1344 - cameraX
    const doorY = MAP_HEIGHT - 32 - cameraY // En la misma línea del zócalo inferior
    const doorWidth = 128 // Más larga horizontalmente
    
    // Solo dibujar si está visible en pantalla
    if (doorX + doorWidth > -50 && doorX < CANVAS_WIDTH + 50 && doorY > -50 && doorY < CANVAS_HEIGHT + 50) {
      // Marco de la puerta (madera oscura) - mismo ancho que el zócalo
      const doorFrameGradient = ctx.createLinearGradient(doorX, doorY, doorX, doorY + 32)
      doorFrameGradient.addColorStop(0, "#4a2c17")
      doorFrameGradient.addColorStop(0.5, "#3d1f0a")
      doorFrameGradient.addColorStop(1, "#2d1508")
      ctx.fillStyle = doorFrameGradient
      ctx.fillRect(doorX, doorY, doorWidth, 32)
      
      // Puerta principal (madera más clara)
      const doorGradient = ctx.createLinearGradient(doorX + 2, doorY + 2, doorX + 2, doorY + 30)
      doorGradient.addColorStop(0, "#8b4513")
      doorGradient.addColorStop(0.3, "#654321")
      doorGradient.addColorStop(0.7, "#5a3a1a")
      doorGradient.addColorStop(1, "#4a2c17")
      ctx.fillStyle = doorGradient
      ctx.fillRect(doorX + 2, doorY + 2, doorWidth - 4, 28)
      
      // Paneles de la puerta (para ancho de 128px)
      ctx.fillStyle = "#3d1f0a"
      // Panel superior
      ctx.fillRect(doorX + 8, doorY + 4, doorWidth - 16, 8)
      // Panel medio
      ctx.fillRect(doorX + 8, doorY + 14, doorWidth - 16, 8)
      // Panel inferior
      ctx.fillStyle = "#2d1508"
      ctx.fillRect(doorX + 8, doorY + 24, doorWidth - 16, 4)
      
      // Refuerzos horizontales
      ctx.fillStyle = "#2d1508"
      ctx.fillRect(doorX + 4, doorY + 10, doorWidth - 8, 2)
      ctx.fillRect(doorX + 4, doorY + 20, doorWidth - 8, 2)
      
      // Refuerzos verticales (más espaciados)
      ctx.fillRect(doorX + 32, doorY + 4, 2, 24)
      ctx.fillRect(doorX + 64, doorY + 4, 2, 24)
      ctx.fillRect(doorX + 96, doorY + 4, 2, 24)
      
      // Cerradura (círculo dorado)
      ctx.fillStyle = "#daa520"
      ctx.beginPath()
      ctx.arc(doorX + doorWidth / 2, doorY + 16, 6, 0, Math.PI * 2)
      ctx.fill()
      
      // Agujero de la cerradura
      ctx.fillStyle = "#1a1a1a"
      ctx.beginPath()
      ctx.arc(doorX + doorWidth / 2, doorY + 16, 3, 0, Math.PI * 2)
      ctx.fill()
      
      // Bisagras (una en cada extremo)
      ctx.fillStyle = "#8b7355"
      ctx.beginPath()
      ctx.arc(doorX + 12, doorY + 8, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(doorX + 12, doorY + 24, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(doorX + doorWidth - 12, doorY + 8, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(doorX + doorWidth - 12, doorY + 24, 3, 0, Math.PI * 2)
      ctx.fill()
      
      // Sombra de la puerta
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.fillRect(doorX + 1, doorY + 1, doorWidth, 32)
      
      // Texto indicativo sobre la puerta (usando lógica de NPCs)
      // Verificar proximidad directamente en el renderizado para evitar problemas de sincronización
      const doorXPos = 1344
      const doorYPos = MAP_HEIGHT - 32
      const doorWidthPos = 128
      const doorHeightPos = 32
      const interactionRangePos = 50
      
      const leftBound = doorXPos - interactionRangePos
      const rightBound = doorXPos + doorWidthPos + interactionRangePos
      const topBound = doorYPos - interactionRangePos
      const bottomBound = doorYPos + doorHeightPos + interactionRangePos
      
      const isNearDoorNow = (
        localCharacter.x >= leftBound &&
        localCharacter.x <= rightBound &&
        localCharacter.y >= topBound &&
        localCharacter.y <= bottomBound
      )
      
      console.log('🎨 Door render check:', { 
        nearbyDoor, 
        isNearDoorNow,
        localCharacterX: localCharacter.x,
        localCharacterY: localCharacter.y,
        doorXPos, 
        doorYPos, 
        leftBound,
        rightBound,
        topBound,
        bottomBound,
        xCheck: `${localCharacter.x} >= ${leftBound} && ${localCharacter.x} <= ${rightBound}`,
        yCheck: `${localCharacter.y} >= ${topBound} && ${localCharacter.y} <= ${bottomBound}`,
        xResult: localCharacter.x >= leftBound && localCharacter.x <= rightBound,
        yResult: localCharacter.y >= topBound && localCharacter.y <= bottomBound,
        cameraX, 
        cameraY,
        screenX: doorXPos - cameraX,
        screenY: doorYPos - cameraY
      })
      
      if (isNearDoorNow) {
        console.log('🎨 Drawing door text - isNearDoorNow is true')
        // Dibujar texto de interacción (igual que NPCs)
        ctx.fillStyle = "#ffffff"
        ctx.font = "14px monospace"
        const textX = doorXPos + doorWidthPos / 2 - 50
        const textY = doorYPos - 20
        console.log('🎨 Drawing text at:', { textX, textY, screenX: textX - cameraX, screenY: textY - cameraY })
        ctx.fillText("Press E to open", textX, textY)
      } else {
        console.log('🎨 Not drawing door text - isNearDoorNow is false')
      }
    }

    // Dibujar texto de interacción con el shop
    if (nearbyShop) {
      const shopX = 196
      const shopY = 982
      
      const screenX = shopX - cameraX
      const screenY = shopY - cameraY
      
      // Fondo negro con borde blanco
      ctx.fillStyle = 'black'
      ctx.fillRect(screenX - 2, screenY - 20, 200, 20)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1
      ctx.strokeRect(screenX - 2, screenY - 20, 200, 20)
      
      // Texto blanco
      ctx.fillStyle = 'white'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Press E to shop', screenX + 100, screenY - 5)
      ctx.textAlign = 'left'
    }

    // Dibujar logo de la taberna
    if (tavernLogo) {
      const logoX = 785 - cameraX // Posición X del logo
      const logoY = 0 - cameraY // Posición Y del logo
      const logoWidth = 120
      const logoHeight = 80
      
      // Solo dibujar si está visible en pantalla
      if (logoX + logoWidth > -50 && logoX < CANVAS_WIDTH + 50 && logoY + logoHeight > -50 && logoY < CANVAS_HEIGHT + 50) {
        ctx.drawImage(tavernLogo, logoX, logoY, logoWidth, logoHeight)
        
        // Agregar un pequeño efecto de sombra
        ctx.fillStyle = "rgba(0, 0, 0, 0.0)"
        ctx.fillRect(logoX + 2, logoY + 2, logoWidth, logoHeight)
      }
    }
  }, [tavernLogo])

  const drawPlayer = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      name: string,
      isCurrentPlayer = false,
      cameraX: number,
      cameraY: number,
      chatMessage?: { text: string; timestamp: number },
      avatar?: string,
      direction: 'down' | 'up' | 'left' | 'right' = 'down',
      player?: any, // Objeto completo del jugador para acceder a las stats
    ) => {
      ctx.imageSmoothingEnabled = false

      const screenX = x - cameraX
      const screenY = y - cameraY

      if (screenX > -100 && screenX < CANVAS_WIDTH + 100 && screenY > -100 && screenY < CANVAS_HEIGHT + 100) {
        // Dibujar globo de chat si existe un mensaje
        if (chatMessage && chatMessage.text) {
          const messageAge = Date.now() - chatMessage.timestamp
          const maxAge = 10000 // 10 segundos
          
          if (messageAge < maxAge) {
            // Calcular opacidad basada en la edad del mensaje
            const opacity = Math.max(0, 1 - (messageAge / maxAge))
            
            // Configurar el texto del mensaje
            ctx.font = "12px monospace"
            ctx.textAlign = "center"
            const maxWidth = 150
            // Asegurar que el texto sea un string
            const messageText = typeof chatMessage.text === 'string' ? chatMessage.text : String(chatMessage.text);
            const words = messageText.split(' ')
            const lines: string[] = []
            let currentLine = ''
            
            // Dividir el texto en líneas
            words.forEach(word => {
              const testLine = currentLine + (currentLine ? ' ' : '') + word
              const metrics = ctx.measureText(testLine)
              if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine)
                currentLine = word
              } else {
                currentLine = testLine
              }
            })
            if (currentLine) {
              lines.push(currentLine)
            }
            
            // Dimensiones del globo con pixel-perfect positioning
            const padding = 8
            const lineHeight = 14
            const bubbleWidth = Math.min(maxWidth + padding * 2, Math.max(...lines.map(line => ctx.measureText(line).width)) + padding * 2)
            const bubbleHeight = lines.length * lineHeight + padding * 2
            const bubbleX = Math.floor(screenX - bubbleWidth / 2)
            const bubbleY = Math.floor(screenY - 60 - bubbleHeight)
            
            // Dibujar sombra del globo
            ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * opacity})`
            ctx.fillRect(bubbleX + 2, bubbleY + 2, bubbleWidth, bubbleHeight)
            
            // Dibujar fondo del globo
            ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * opacity})`
            ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight)
            
            // Dibujar borde del globo
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.8 * opacity})`
            ctx.lineWidth = 1
            ctx.strokeRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight)
            
            // Dibujar cola del globo (triángulo) con pixel-perfect positioning
            ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * opacity})`
            ctx.beginPath()
            ctx.moveTo(Math.floor(screenX - 8), bubbleY + bubbleHeight)
            ctx.lineTo(Math.floor(screenX), Math.floor(screenY - 50))
            ctx.lineTo(Math.floor(screenX + 8), bubbleY + bubbleHeight)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            
            // Dibujar texto del mensaje con pixel-perfect positioning
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
            ctx.font = "12px monospace"
            ctx.textAlign = "center"
            lines.forEach((line, index) => {
              const textY = Math.floor(bubbleY + padding + (index + 1) * lineHeight - 2)
              ctx.fillText(line, Math.floor(screenX), textY)
            })
          }
        }

        // Sistema completamente nuevo de renderizado de sprites
        const avatarKey = avatar ? migrateAvatar(avatar) : 'character_1'
        const spriteImage = spriteImages[avatarKey]
        const currentFrame = animationFrames[avatarKey] || 0
        const spriteConfig = getSpriteConfig(avatarKey)
        
        if (spriteImage && spriteImage.complete && spriteImage.naturalWidth > 0) {
          
          // Calcular posición del frame en el spritesheet usando configuración específica
          // Validar que el frame no exceda los frames disponibles
          const maxFrames = Math.floor(spriteImage.naturalWidth / spriteConfig.frameWidth)
          const safeFrame = Math.min(currentFrame, maxFrames - 1)
          const frameX = safeFrame * spriteConfig.frameWidth
          const frameY = spriteConfig.directions[direction] * spriteConfig.frameHeight
          
          // Dibujar SOLO el sprite (sin fallback) con pixel-perfect rendering
          const drawX = Math.floor(screenX - spriteConfig.renderSize / 2)
          const drawY = Math.floor(screenY - spriteConfig.renderSize / 2)
          
          ctx.drawImage(
            spriteImage,
            frameX, frameY, 
            spriteConfig.frameWidth, spriteConfig.frameHeight,
            drawX, 
            drawY,
            spriteConfig.renderSize, 
            spriteConfig.renderSize
          )
          
        } else {
          // Fallback SOLO cuando no hay sprite disponible con pixel-perfect rendering
          const fallbackSize = spriteConfig.renderSize
          const fallbackX = Math.floor(screenX - fallbackSize / 2)
          const fallbackY = Math.floor(screenY - fallbackSize / 2)
          
          ctx.fillStyle = color
          ctx.fillRect(fallbackX, fallbackY, fallbackSize, fallbackSize)
          
          // Ojos simples para el fallback
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(Math.floor(screenX - 8), Math.floor(screenY - 8), 4, 4)
          ctx.fillRect(Math.floor(screenX + 4), Math.floor(screenY - 8), 4, 4)
        }

        // Nombre del jugador y nivel (solo esto, sin elementos antiguos) con pixel-perfect rendering
        const nameX = Math.floor(screenX - 30)
        const nameY = Math.floor(screenY - spriteConfig.renderSize / 2 - 20)
        const nameTextX = Math.floor(screenX)
        const nameTextY = Math.floor(screenY - spriteConfig.renderSize / 2 - 8)
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(nameX, nameY, 60, 16)
        ctx.fillStyle = "#ffffff"
        ctx.font = "12px monospace"
        ctx.textAlign = "center"
        
        // Mostrar nivel si el jugador tiene stats
        const displayName = player?.stats ? `${name} (Lv.${player.stats.level})` : name
        ctx.fillText(displayName, nameTextX, nameTextY)
        ctx.textAlign = "left"
      }
    },
    [spriteImages, animationFrames],
  )

  const updateGame = useCallback(() => {
    // Don't process if no keys are pressed
    if (keys.size === 0) {
      return false // Indica que no hay cambios
    }
    
    let newX = localCharacter.x
    let newY = localCharacter.y
    let moved = false

    // Process movement with simplified logic and direction tracking
    if (keys.has("ArrowLeft") || keys.has("KeyA")) {
      const testX = newX - MOVE_SPEED
      if (testX >= PLAYER_SIZE / 2 && !checkCollision(testX, newY)) {
        newX = testX
        setPlayerDirection('left')
        moved = true
      }
    }
    
    if (keys.has("ArrowRight") || keys.has("KeyD")) {
      const testX = newX + MOVE_SPEED
      if (testX <= MAP_WIDTH - PLAYER_SIZE / 2 && !checkCollision(testX, newY)) {
        newX = testX
        setPlayerDirection('right')
        moved = true
      }
    }
    
    if (keys.has("ArrowUp") || keys.has("KeyW")) {
      const testY = newY - MOVE_SPEED
      if (testY >= PLAYER_SIZE / 2 && !checkCollision(newX, testY)) {
        newY = testY
        setPlayerDirection('up')
        moved = true
      }
    }
    
    if (keys.has("ArrowDown") || keys.has("KeyS")) {
      const testY = newY + MOVE_SPEED
      if (testY <= MAP_HEIGHT - PLAYER_SIZE / 2 && !checkCollision(newX, testY)) {
        newY = testY
        setPlayerDirection('down')
        moved = true
      }
    }

    if (moved) {
      // Marcar que el jugador se está moviendo
      setIsMoving(true)
      
      // Limpiar timeout anterior
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current)
      }
      
      // Configurar timeout para resetear isMoving después de 500ms de inactividad
      movementTimeoutRef.current = setTimeout(() => {
        setIsMoving(false)
        // DISABLED: All position updates cause disconnections
        // Position synchronization will be handled by heartbeat only
      }, 500)
      
      // Actualizar posición local inmediatamente para respuesta fluida
      const updatedCharacter = { ...localCharacter, x: newX, y: newY }
      setLocalCharacter(updatedCharacter)
      onCharacterUpdate(updatedCharacter)
      
      // También actualizar allPlayers para que el jugador local se vea en su propia pantalla
      if (playerId) {
        setAllPlayers(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            x: newX,
            y: newY,
            direction: playerDirection,
            lastSeen: Date.now()
          }
        }))
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) { // 1% of the time
          console.log(`🔄 Updated allPlayers for local player: (${newX}, ${newY})`)
        }
      }
      
      // Enviar actualización de posición inmediatamente para reducir delay
      if (websocketClient && websocketClient.isConnectedToServer()) {
        websocketClient.updatePlayerPosition(newX, newY, playerDirection)
        // Only log occasionally to avoid spam
        if (Math.random() < 0.05) { // 5% of the time
          console.log(`🎮 Position update sent: (${newX}, ${newY})`)
        }
      }
      
      // Update camera to follow player
      const targetCameraX = newX - CANVAS_WIDTH / 2
      const targetCameraY = newY - CANVAS_HEIGHT / 2
      const clampedCameraX = Math.max(0, Math.min(MAP_WIDTH - CANVAS_WIDTH, targetCameraX))
      const clampedCameraY = Math.max(0, Math.min(MAP_HEIGHT - CANVAS_HEIGHT, targetCameraY))
      setCamera({ x: clampedCameraX, y: clampedCameraY })
      
      // Check for nearby NPCs, players, and door
      checkNearbyNPCs(newX, newY)
      checkNearbyPlayers(newX, newY)
        checkNearbyDoor(newX, newY)
        checkNearbyShop(newX, newY)
      
      return true // Indica que hubo cambios
    }
    
    return false // No hubo cambios
  }, [localCharacter, keys, onCharacterUpdate, websocketClient, checkCollision, checkNearbyNPCs, checkNearbyPlayers, checkNearbyDoor, checkNearbyShop])


  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    generateTerrain(ctx, camera.x, camera.y)

    // DEBUG: Log de estado completo (solo ocasionalmente)
    if (Math.random() < 0.001) { // 0.1% de las veces para reducir spam
      console.log('🔍 DEBUG RENDER:')
      console.log('  - playerId:', playerId)
      console.log('  - allPlayers keys:', Object.keys(allPlayers))
      console.log('  - localCharacter:', { x: localCharacter.x, y: localCharacter.y, name: localCharacter.name })
      console.log('  - camera:', { x: camera.x, y: camera.y })
    }
    
    // Dibujar jugador local desde localCharacter (para asegurar posición correcta)
    // Intentar encontrar el jugador local por nombre si playerId no está disponible
    let localPlayer = null
    if (playerId && allPlayers[playerId]) {
      localPlayer = allPlayers[playerId]
    } else {
      // FALLBACK: Buscar por nombre
      localPlayer = Object.values(allPlayers).find(p => p.name === localCharacter.name)
      if (localPlayer) {
        console.log(`🔍 Found local player by name: ${localPlayer.name} (ID: ${localPlayer.id})`)
        setPlayerId(localPlayer.id) // Actualizar playerId
      }
    }
    
    if (localPlayer) {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) { // 1% of the time
        console.log(`🎨 Drawing LOCAL player ${localCharacter.name} at (${localCharacter.x}, ${localCharacter.y}) - allPlayers: (${localPlayer.x}, ${localPlayer.y})`)
      }
      
      drawPlayer(
        ctx, 
        localCharacter.x, // Usar localCharacter para posición
        localCharacter.y, // Usar localCharacter para posición
        localPlayer.color || '#3b82f6', 
        localCharacter.name, 
        true, // Es el jugador local
        camera.x, 
        camera.y,
        playerChatMessages[playerId], // Mensaje de chat del jugador local
        localCharacter.avatar,
        playerDirection,
        localPlayer // Pasar el objeto completo del jugador para acceder a las stats
      )
    } else {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) { // 1% of the time
        console.log('❌ No se puede dibujar jugador local, usando fallback:')
        console.log('  - playerId:', playerId)
        console.log('  - allPlayers keys:', Object.keys(allPlayers))
        console.log('  - localCharacter name:', localCharacter.name)
      }
      
      // FALLBACK: Dibujar jugador local sin depender de allPlayers
    drawPlayer(
      ctx, 
      localCharacter.x, 
      localCharacter.y, 
        '#3b82f6', // Color por defecto
      localCharacter.name, 
        true, // Es el jugador local
      camera.x, 
      camera.y,
        undefined, // No hay mensaje para el jugador local
      localCharacter.avatar,
        playerDirection,
        undefined // Sin stats por ahora
    )
    }

    // Dibujar otros jugadores (usando posiciones interpoladas si están disponibles)
    Object.values(allPlayers).forEach((player) => {
      // Solo dibujar si no es el jugador local y está marcado como visible
      if (player.id !== playerId && playerVisibility[player.id] !== false) {
        // Usar posición interpolada si está disponible, sino usar la posición normal
        const interpolatedPlayer = interpolatedPlayers[player.id]
        const renderPlayer = interpolatedPlayer || player
        
        // Solo loggear ocasionalmente para evitar spam
        if (Math.random() < 0.0001) { // 0.01% of the time
          console.log(`🎨 Drawing player ${player.name} at (${renderPlayer.x}, ${renderPlayer.y}) ${interpolatedPlayer ? '(interpolated)' : '(normal)'}`)
        }
        drawPlayer(
          ctx, 
          renderPlayer.x, 
          renderPlayer.y, 
          player.color || '#3b82f6', 
          player.name, 
          false, // No es el jugador local
          camera.x, 
          camera.y,
          playerChatMessages[player.id], // Mensaje de chat del jugador
          player.avatar,
          (renderPlayer.direction as 'down' | 'up' | 'left' | 'right') || 'down',
          player // Pasar el objeto completo del jugador para acceder a las stats
        )

        // Dibujar indicador de desafío si está cerca
        if (nearbyPlayer && nearbyPlayer.id === player.id) {
          const screenX = renderPlayer.x - camera.x
          const screenY = renderPlayer.y - camera.y
          ctx.fillStyle = "#ff6b6b"
          ctx.font = "14px monospace"
          ctx.fillText("Press E to challenge", screenX - 60, screenY - 20)
        }
      }
    })

    // Dibujar NPCs
    npcs.forEach((npc) => {
      const screenX = npc.x - camera.x
      const screenY = npc.y - camera.y
      
      // Solo dibujar si el NPC está en pantalla
      if (screenX > -100 && screenX < CANVAS_WIDTH + 100 && 
          screenY > -100 && screenY < CANVAS_HEIGHT + 100) {
        
        
        // Dibujar NPC usando la misma función que los jugadores
        drawPlayer(
          ctx,
          npc.x,
          npc.y,
          "#8b5cf6", // Color púrpura para NPCs
          npc.name,
          false,
          camera.x,
          camera.y,
          undefined,
          npc.avatar,
          'down', // NPCs siempre miran hacia abajo
          undefined // NPCs no tienen stats
        )
        
        // Dibujar indicador de interacción si está cerca
        if (nearbyNPC && nearbyNPC.id === npc.id) {
          // Dibujar texto de interacción
          ctx.fillStyle = "#ffffff"
          ctx.font = "14px monospace"
          ctx.fillText("Press E to interact", screenX - 50, screenY - 20)
        }
      }
    })

  }, [localCharacter, camera, allPlayers, interpolatedPlayers, playerId, playerVisibility, nearbyPlayer, playerChatMessages])

  const gameLoop = useCallback(() => {
    const hasChanges = updateGame()
    const hasAnimations = Object.keys(animationFrames).length > 0
    const hasPlayers = Object.keys(allPlayers).length > 0
    const now = Date.now()
    
    // Limitar renderizado a 60 FPS máximo
    const shouldRender = (hasChanges || hasAnimations || hasPlayers) && (now - lastRenderTime > 16)
    
    if (shouldRender) {
      render()
      setLastRenderTime(now)
    }
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, render, animationFrames, allPlayers, lastRenderTime])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el chat está abierto, no procesar teclas de movimiento
      if (showChatInput) {
        if (e.code === "Escape") {
          setShowChatInput(false)
          setCurrentMessage("")
        } else if (e.code === "Enter") {
          if (currentMessage.trim() && websocketClient) {
            websocketClient.sendChatMessage(currentMessage.trim())
            setCurrentMessage("")
            setShowChatInput(false)
          }
        }
        return
      }
      
      // Abrir chat con Enter o T
      if (e.code === "Enter" || e.code === "KeyT") {
        e.preventDefault()
        setShowChatInput(true)
        return
      }
      
      // Interactuar con NPC, puerta, shop o desafiar jugador con E
      if (e.code === "KeyE") {
        e.preventDefault()
        if (nearbyPlayer) {
          challengePlayer()
        } else if (nearbyShop) {
          setShowShopPanel(true)
        } else if (nearbyNPC) {
        interactWithNPC()
        } else if (nearbyDoor) {
          interactWithDoor()
        }
        return
      }
      
      // Teclas de movimiento
      setKeys((prev) => new Set(prev).add(e.code))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // No procesar teclas de movimiento si el chat está abierto
      if (showChatInput) return
      
      setKeys((prev) => {
        const newKeys = new Set(prev)
        newKeys.delete(e.code)
        return newKeys
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [showChatInput, currentMessage, websocketClient, interactWithNPC, nearbyPlayer, challengePlayer, nearbyNPC, nearbyDoor, interactWithDoor])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center space-y-4 lg:space-y-0 p-4 min-h-screen">
      {/* Panel de rankings - Izquierda en desktop, arriba en mobile */}
      <div className="w-full lg:w-80 order-1 lg:order-1 lg:mr-8">
        <RankingPanel />
      </div>
      
      {/* Panel del juego principal - Centrado */}
      <Card className="character-card w-full lg:w-auto order-2 lg:order-2" style={{width: '100%', maxWidth: '620px', height: 'fit-content'}}>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <CardTitle className="text-2xl font-bold pixel-text">Drunken Monkey Tavern</CardTitle>
            <div className="flex-1 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMusicMuted(!isMusicMuted)}
                className="p-2 h-8 w-8"
                title={isMusicMuted ? "Unmute music" : "Mute music"}
              >
                {isMusicMuted ? "🔇" : "🔊"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            className="game-canvas pixel-art w-full h-auto max-w-full" 
            style={{maxWidth: '100%', height: 'auto'}}
          />

            {/* Input de chat superpuesto */}
            {showChatInput && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-80 p-3 rounded-lg">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message... (Enter to send, Esc to cancel)"
                    className="bg-white text-black font-mono text-sm"
                    maxLength={100}
                    autoFocus
                  />
                  <div className="text-xs text-white mt-1 opacity-70">
                    {currentMessage.length}/100 characters
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm pixel-text text-center">
              <p className="font-bold mb-1">{"Controls:"}</p>
              <p>{"Use WASD or Arrow Keys to move"}</p>
              <p>{"Press Enter or T to chat"}</p>
            <p>{"Press E to interact with NPCs or challenge players"}</p>
            <p className="text-xs mt-1 text-muted-foreground">{"Messages appear above players for 10s seconds"}</p>
            </div>
        </CardContent>
      </Card>

      {/* Panel lateral con información del jugador y botones */}
      <Card className="w-full lg:w-80 h-fit border-4 border-primary order-3 lg:order-3 lg:ml-8" style={{borderRadius: '0'}}>
        <CardContent className="space-y-4" style={{borderRadius: '0'}}>
          {/* Información del jugador */}
          <div className="p-4" style={{
            background: '#d4af37',
            border: '4px solid #8b4513',
            borderRadius: '0',
            boxShadow: 'inset 2px 2px 0px #654321, inset -2px -2px 0px #654321'
          }}>
            <h3 className="text-lg font-bold pixel-text text-center mb-3 text-accent border-b-2 border-accent pb-2">PLAYER INFO</h3>
            <div className="text-sm pixel-text space-y-3">
              <div className="bg-secondary/30 border border-muted p-2 text-destructive font-bold" style={{borderRadius: '0'}}>
                Hero: {localCharacter.name}
            </div>
              <div className="bg-primary/30 border border-muted p-2 text-destructive font-bold" style={{borderRadius: '0'}}>
                Position: {Math.round(localCharacter.x)}, {Math.round(localCharacter.y)}
              </div>
              <div className="bg-accent/30 border border-accent p-2 text-accent-foreground font-bold" style={{borderRadius: '0'}}>
                Players Online: {Object.keys(allPlayers).length}
              </div>
              <div className="bg-muted/30 border border-muted p-2 text-destructive font-bold" style={{borderRadius: '0'}}>
                Location: Drunken Monkey Tavern
              </div>
            </div>
          </div>

          {/* Stats del jugador */}
          {playerStats && (
            <div className="p-4" style={{
              background: '#d4af37',
              border: '4px solid #8b4513',
              borderRadius: '0',
              boxShadow: 'inset 2px 2px 0px #654321, inset -2px -2px 0px #654321'
            }}>
              <h3 className="text-lg font-bold pixel-text text-center mb-3 text-accent border-b-2 border-accent pb-2">STATS</h3>
              <div className="grid grid-cols-2 gap-3 text-sm pixel-text">
                <div className="bg-destructive/30 border border-muted p-2 text-destructive font-bold" style={{borderRadius: '0'}}>
                  HP: {playerStats.health}/{playerStats.maxHealth}
                </div>
                <div className="bg-primary/30 border border-muted p-2 text-destructive font-bold" style={{borderRadius: '0'}}>
                  Level: {playerStats.level}
                </div>
                <div className="bg-accent/30 border border-accent p-2 text-accent-foreground font-bold col-span-2" style={{borderRadius: '0'}}>
                  <div className="flex justify-between items-center mb-1">
                    <span>XP: {playerStats.experience}</span>
                    <span className="text-xs">Next: {playerStats.experienceToNext}</span>
                  </div>
                  <div className="w-full bg-muted/50 border border-muted h-3" style={{borderRadius: '0'}}>
                    <div 
                      className="bg-accent h-full transition-all duration-300" 
                      style={{
                        width: `${Math.min((playerStats.experience / playerStats.experienceToNext) * 100, 100)}%`,
                        borderRadius: '0'
                      }}
                    />
                  </div>
                </div>
                <div className="bg-muted/30 border border-muted p-2 text-destructive font-bold" style={{borderRadius: '0'}}>
                  Attack: {playerStats.attack}
                </div>
                <div className="bg-muted/30 border border-muted p-2 text-destructive font-bold" style={{borderRadius: '0'}}>
                  Defense: {playerStats.defense}
                </div>
                <div className="bg-muted/30 border border-muted p-2 text-destructive font-bold" style={{borderRadius: '0'}}>
                  Speed: {playerStats.speed}
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <Button 
              onClick={savePlayerProgressToSupabase} 
              className="w-full pixel-button bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Progress"}
            </Button>
            
            
            <Button 
              onClick={() => setShowInventoryPanel(true)} 
              className="w-full pixel-button bg-green-600 hover:bg-green-700"
            >
              Inventory
            </Button>
            
            <Button onClick={onBackToCreation} className="w-full pixel-button">
              Create New Hero
            </Button>
            
            {onBackToSelection && (
              <Button onClick={onBackToSelection} className="w-full pixel-button bg-green-600 hover:bg-green-700">
                Change Character
              </Button>
            )}
            
            {onLogout && (
              <Button 
                onClick={onLogout} 
                className="w-full pixel-button bg-red-600 hover:bg-red-700"
                title={`Logout ${user?.username || 'user'}`}
              >
                Logout
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de NPC */}
      {showNPCDialog && nearbyNPC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">{nearbyNPC.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 relative">
                  <img
                    src={avatarSprites[nearbyNPC.avatar as keyof typeof avatarSprites]}
                    alt={nearbyNPC.name}
                    className="w-full h-full object-contain pixel-art"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {nearbyNPC.message}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowNPCDialog(false)}
                  className="pixel-button"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Desafío de combate */}
      {combatChallenge && (
        <CombatChallengeComponent
          challenge={combatChallenge}
          onAccept={() => respondToChallenge(true)}
          onDecline={() => respondToChallenge(false)}
          onExpire={() => setCombatChallenge(null)}
        />
      )}

      {/* Interfaz de combate */}
      {showCombatInterface && combatState && (
        <CombatInterface
          combatState={combatState}
          currentPlayerId={playerId}
          onAction={sendCombatAction}
          onClose={() => setShowCombatInterface(false)}
        />
      )}

      {/* Mensaje del sistema */}
      {systemMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl mx-4">
          <div className="bg-yellow-600 border-4 border-yellow-400 rounded-lg p-4 shadow-lg">
            <div className="text-center">
              <div className="text-yellow-100 font-bold text-lg pixel-text mb-2">
                🏆 SYSTEM ANNOUNCEMENT
              </div>
              <div className="text-white text-sm pixel-text">
                {systemMessage.text}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de recompensas */}
      {rewardMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl mx-4">
          <div className="bg-gradient-to-r from-green-600 to-green-500 border-4 border-green-400 rounded-lg p-4 shadow-lg">
            <div className="text-center">
              <div className="text-green-100 font-bold text-lg pixel-text mb-2">
                🎁 COMBAT REWARDS!
              </div>
              <div className="text-white text-sm pixel-text">
                {rewardMessage.text}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Level Up Notification */}
      {levelUpNotification && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg shadow-2xl border-4 border-yellow-300 animate-bounce">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 pixel-text">🎉 LEVEL UP! 🎉</div>
              <div className="text-xl mb-4 pixel-text">Level {levelUpNotification.newLevel}</div>
              <div className="text-sm space-y-1 pixel-text">
                <div className="text-green-300">+{levelUpNotification.rewards.healthIncrease} HP</div>
                <div className="text-orange-300">+{levelUpNotification.rewards.attackIncrease} ATK</div>
                <div className="text-blue-300">+{levelUpNotification.rewards.defenseIncrease} DEF</div>
                <div className="text-purple-300">+{levelUpNotification.rewards.speedIncrease} SPD</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combat Challenge */}
      {combatChallenge && (
        <CombatChallengeComponent
          challenge={combatChallenge}
          onAccept={() => respondToChallenge(true)}
          onDecline={() => respondToChallenge(false)}
          onExpire={() => setCombatChallenge(null)}
        />
      )}

      {/* Combat Interface */}
      {showCombatInterface && combatState && (
        <CombatInterface
          combatState={combatState}
          currentPlayerId={playerId}
          onAction={(action) => {
            if (websocketClient) {
              websocketClient.sendCombatAction(combatState.id, action)
            }
          }}
          onClose={handleCloseCombatInterface}
        />
      )}

      {/* Door Dialog */}
      {showDoorDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-amber-800 to-amber-900 border-4 border-amber-600 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-3xl mb-4"></div>
              <div className="text-2xl font-bold text-amber-100 pixel-text mb-4">
                FUTURE EXPANSION
              </div>
              <div className="text-amber-200 pixel-text mb-6">
                This door leads to a new area that will be available in a future update. 
                Stay tuned for exciting new adventures!
              </div>
              <Button
                onClick={() => setShowDoorDialog(false)}
                className="pixel-button bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Advanced Inventory Panel */}
      <AdvancedInventoryPanel 
        isVisible={showInventoryPanel}
        onClose={() => setShowInventoryPanel(false)}
        userId={user?.id || ''}
        userGold={userGold}
        userLevel={userLevel}
        onGoldUpdate={setUserGold}
        onStatsUpdate={setPlayerStats}
      />

      {/* Shop Panel */}
      <ShopPanel 
        isVisible={showShopPanel}
        onClose={() => setShowShopPanel(false)}
        userId={user?.id || ''}
        userGold={userGold}
        userLevel={userLevel}
        onGoldUpdate={setUserGold}
      />

    </div>
  )
}

