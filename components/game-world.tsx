"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SocketMultiplayerClient, type Player, type GameState, type ChatMessage } from "@/lib/socket-multiplayer"

interface Character {
  name: string
  avatar: string
  x: number
  y: number
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

interface GameWorldProps {
  character: Character
  onCharacterUpdate: (character: Character) => void
  onBackToCreation: () => void
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
    // Todos los nuevos avatares usan la misma configuración
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
}

// Configuración de NPCs
  const npcs: NPC[] = [
    {
      id: "npc_1",
      name: "Village Elder",
      x: 1364,
      y: 554,
      avatar: "character_18",
      message: "Welcome, brave adventurer! I have been waiting for someone like you. The village needs your help!",
      interactionRadius: 80
    },
    {
      id: "npc_2",
      name: "Mysterious Stranger",
      x: 1364,
      y: 698,
      avatar: "character_27",
      message: "Greetings, traveler. I sense great power within you. The ancient secrets of this land await those who are worthy...",
      interactionRadius: 80
    }
  ]

export default function GameWorld({ character, onCharacterUpdate, onBackToCreation }: GameWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const animationRef = useRef<number>()
  const [multiplayerClient, setMultiplayerClient] = useState<SocketMultiplayerClient | null>(null)
  const [otherPlayers, setOtherPlayers] = useState<Record<string, Player>>({})
  const [allPlayers, setAllPlayers] = useState<Record<string, Player>>({})
  const [playerVisibility, setPlayerVisibility] = useState<Record<string, boolean>>({})
  const [playerId, setPlayerId] = useState<string>("")
  const [camera, setCamera] = useState({ x: 0, y: 0 })
  const [localCharacter, setLocalCharacter] = useState<Character>(character)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
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
  const connectionStatusRef = useRef<{ connected: boolean; lastCheck: number }>({ connected: false, lastCheck: 0 })
  const [nearbyNPC, setNearbyNPC] = useState<NPC | null>(null)
  const [showNPCDialog, setShowNPCDialog] = useState(false)
  const [playerDirection, setPlayerDirection] = useState<'down' | 'up' | 'left' | 'right'>('down')

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
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

    // Kitchen area (bottom-left)
    { x: 100, y: MAP_HEIGHT - 200, width: 200, height: 128, type: "kitchen" },

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

  // Función para interactuar con NPC
  const interactWithNPC = useCallback(() => {
    if (nearbyNPC) {
      setShowNPCDialog(true)
    }
  }, [nearbyNPC])

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

  useEffect(() => {
    const client = new SocketMultiplayerClient(
      (state: GameState) => {
        console.log('📥 Estado del juego recibido:', state)
        
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
        console.log(`🎮 Jugador ${player.name} se unió al juego`)
        
      },
      (playerId: string) => {
        // Player left
        console.log(`👋 Jugador ${playerId} se fue del juego`)
        
      },
      (playerId: string, x: number, y: number) => {
        // Player moved - actualizar posición inmediatamente
        console.log(`🔄 Jugador ${playerId} se movió a (${x}, ${y})`)
        
        // Solo actualizar allPlayers - otherPlayers se actualizará automáticamente via useEffect
        setAllPlayers(prev => ({
          ...prev,
          [playerId]: { 
            ...prev[playerId], 
            x, 
            y,
            lastSeen: Date.now()
          }
        }))
        
        // Asegurar que el jugador permanezca visible
        setPlayerVisibility(prev => ({
          ...prev,
          [playerId]: true
        }))
      },
      (message: ChatMessage) => {
        // Chat message received
        console.log(`💬 ${message.playerName}: ${message.text}`)
        setChatMessages(prev => [...prev, message].slice(-10)) // Mantener solo los últimos 10 mensajes
      }
    )

    client.connect().then(() => {
      setPlayerId(client.getPlayerId())
      setMultiplayerClient(client)
      
      // Unirse al juego después de un breve delay para asegurar que la conexión esté estable
      setTimeout(() => {
        client.joinGame({
          name: character.name,
          avatar: character.avatar,
          x: character.x || 100,
          y: character.y || 150,
          color: avatarColors[character.avatar] || "#3b82f6",
        })
      }, 500)
    }).catch((error) => {
      console.error('❌ Error conectando al servidor:', error)
    })

    return () => {
      client.disconnect()
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current)
      }
    }
  }, [character.name, character.avatar, isMoving])

  // Monitor connection status and sync positions periodically
  useEffect(() => {
    if (multiplayerClient) {
      const checkConnection = () => {
        const isConnected = multiplayerClient.isConnectedToServer()
        const now = Date.now()
        
        if (connectionStatusRef.current.connected !== isConnected) {
          connectionStatusRef.current = { connected: isConnected, lastCheck: now }
          console.log(`🔌 Estado de conexión: ${isConnected ? 'Conectado' : 'Desconectado'}`)
          
          // Si se perdió la conexión, no intentar reconectar automáticamente
          if (!isConnected) {
            console.log('🔌 Conexión perdida - el jugador permanecerá en el juego localmente')
          }
        }
      }
      
      // Backup sync position every 10 seconds (only if not moving)
      const syncPosition = () => {
        if (multiplayerClient && multiplayerClient.isConnectedToServer() && !isMoving) {
          try {
            multiplayerClient.updatePlayerPosition(localCharacter.x, localCharacter.y)
          } catch (error) {
            console.warn('⚠️ Error sincronizando posición:', error)
          }
        }
      }
      
      const connectionInterval = setInterval(checkConnection, 5000) // Check every 5 seconds
      const positionInterval = setInterval(syncPosition, 10000) // Backup sync every 10 seconds (only when not moving)
      
      return () => {
        clearInterval(connectionInterval)
        clearInterval(positionInterval)
      }
    }
  }, [multiplayerClient, localCharacter.x, localCharacter.y]) // Solo cuando cambia el character inicial o el estado de movimiento

  // Sincronizar otherPlayers cuando cambie allPlayers (robusto)
  useEffect(() => {
    if (playerId && Object.keys(allPlayers).length > 0) {
      const others = { ...allPlayers }
      delete others[playerId]
      setOtherPlayers(others)
      console.log(`🔄 Sincronizando otherPlayers: ${Object.keys(others).length} jugadores`)
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

  // Animación global con configuraciones específicas
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrames(prev => {
        const newFrames = { ...prev }
        let hasChanges = false
        
        Object.keys(avatarSprites).forEach(key => {
          const config = getSpriteConfig(key)
          // Calcular frames reales basados en la imagen cargada
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
        })
        
        // Solo retornar nuevo estado si hay cambios
        return hasChanges ? newFrames : prev
      })
    }, 500) // Animación más lenta para reducir parpadeos
    
    return () => clearInterval(interval)
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

          case "kitchen":
            ctx.fillStyle = "#a0522d"
            ctx.fillRect(objX, objY, obj.width, obj.height)
            ctx.fillStyle = "#f5f5dc"
            ctx.fillRect(objX, objY, obj.width, 16)
            ctx.fillStyle = "#e6e6fa"
            for (let i = 0; i < obj.width; i += 24) {
              ctx.fillRect(objX + i, objY, 2, 16)
            }
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
  }, [])

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
    ) => {
      ctx.imageSmoothingEnabled = false

      const screenX = x - cameraX
      const screenY = y - cameraY

      if (screenX > -100 && screenX < CANVAS_WIDTH + 100 && screenY > -100 && screenY < CANVAS_HEIGHT + 100) {
        // Dibujar globo de chat si existe un mensaje
        if (chatMessage && chatMessage.text) {
          const messageAge = Date.now() - chatMessage.timestamp
          const maxAge = 5000 // 5 segundos
          
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

        // Nombre del jugador (solo esto, sin elementos antiguos) con pixel-perfect rendering
        const nameX = Math.floor(screenX - 30)
        const nameY = Math.floor(screenY - spriteConfig.renderSize / 2 - 20)
        const nameTextX = Math.floor(screenX)
        const nameTextY = Math.floor(screenY - spriteConfig.renderSize / 2 - 8)
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(nameX, nameY, 60, 16)
        ctx.fillStyle = "#ffffff"
        ctx.font = "12px monospace"
        ctx.textAlign = "center"
        ctx.fillText(name, nameTextX, nameTextY)
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
      
      // Configurar timeout para resetear isMoving después de 150ms de inactividad
      movementTimeoutRef.current = setTimeout(() => {
        setIsMoving(false)
        // Send final position when movement stops
        if (multiplayerClient && multiplayerClient.isConnectedToServer()) {
          try {
            multiplayerClient.updatePlayerPosition(localCharacter.x, localCharacter.y)
          } catch (error) {
            console.warn('⚠️ Error enviando posición final:', error)
          }
        }
      }, 150)
      
      // Actualizar posición local inmediatamente para respuesta fluida
      const updatedCharacter = { ...localCharacter, x: newX, y: newY }
      setLocalCharacter(updatedCharacter)
      onCharacterUpdate(updatedCharacter)
      
      // Send position updates with smart throttling to prevent disconnect loops
      const now = Date.now()
      if (multiplayerClient && multiplayerClient.isConnectedToServer() && now - lastPositionUpdateRef.current > 100) {
        try {
          // Only send if we're actually moving and connected
          if (isMoving) {
            multiplayerClient.updatePlayerPosition(newX, newY)
            lastPositionUpdateRef.current = now
          }
        } catch (error) {
          console.warn('⚠️ Error enviando posición al servidor:', error)
        }
      }
      
      // Update camera to follow player
      const targetCameraX = newX - CANVAS_WIDTH / 2
      const targetCameraY = newY - CANVAS_HEIGHT / 2
      const clampedCameraX = Math.max(0, Math.min(MAP_WIDTH - CANVAS_WIDTH, targetCameraX))
      const clampedCameraY = Math.max(0, Math.min(MAP_HEIGHT - CANVAS_HEIGHT, targetCameraY))
      setCamera({ x: clampedCameraX, y: clampedCameraY })
      
      // Check for nearby NPCs
      checkNearbyNPCs(newX, newY)
      
      return true // Indica que hubo cambios
    }
    
    return false // No hubo cambios
  }, [localCharacter, keys, onCharacterUpdate, multiplayerClient, checkCollision, checkNearbyNPCs])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    generateTerrain(ctx, camera.x, camera.y)

    // Dibujar jugador local desde localCharacter
    const localPlayer = allPlayers[playerId]
    const playerColor = localPlayer?.color || "#3b82f6" // Color por defecto
    
    
    drawPlayer(
      ctx, 
      localCharacter.x, 
      localCharacter.y, 
      playerColor, 
      localCharacter.name, 
      true, // Es el jugador actual
      camera.x, 
      camera.y,
      localPlayer?.currentMessage, // Usar el mensaje del jugador local
      localCharacter.avatar,
      playerDirection
    )

    // Dibujar otros jugadores desde allPlayers (excluyendo el jugador actual)
    Object.values(allPlayers).forEach((player) => {
      // Solo dibujar si no es el jugador actual y está marcado como visible
      if (player.id !== playerId && playerVisibility[player.id] !== false) {
        // Solo loggear ocasionalmente para evitar spam
        if (Math.random() < 0.001) { // 0.1% de las veces
          console.log(`🎨 Dibujando jugador ${player.name} en (${player.x}, ${player.y})`)
        }
        drawPlayer(
          ctx, 
          player.x, 
          player.y, 
          player.color, 
          player.name, 
          false, // No es el jugador actual
          camera.x, 
          camera.y,
          player.currentMessage,
          player.avatar,
          'down' // Dirección por defecto para otros jugadores
        )
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
          'down' // NPCs siempre miran hacia abajo
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

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 280, 100)
    ctx.fillStyle = "#ffffff"
    ctx.font = "16px monospace"
    ctx.fillText(`Hero: ${localCharacter.name}`, 20, 30)
    ctx.fillText(`Position: ${Math.floor(localCharacter.x)}, ${Math.floor(localCharacter.y)}`, 20, 50)
    ctx.fillText(`Players Online: ${Object.keys(allPlayers).length}`, 20, 70)
    ctx.fillText(`Location: Medieval Tavern`, 20, 90)
  }, [localCharacter, camera, allPlayers, playerId, playerVisibility])

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
  }, [updateGame, render, animationFrames, otherPlayers, lastRenderTime])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el chat está abierto, no procesar teclas de movimiento
      if (showChatInput) {
        if (e.code === "Escape") {
          setShowChatInput(false)
          setCurrentMessage("")
        } else if (e.code === "Enter") {
          if (currentMessage.trim() && multiplayerClient) {
            multiplayerClient.sendChatMessage(currentMessage.trim())
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
      
      // Interactuar con NPC con E
      if (e.code === "KeyE") {
        e.preventDefault()
        interactWithNPC()
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
  }, [showChatInput, currentMessage, multiplayerClient, interactWithNPC])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center space-y-6 lg:space-y-0 lg:space-x-6 p-4">
      <Card className="character-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold pixel-text">{`${localCharacter.name}'s Tavern Adventure`}</CardTitle>
          <p className="text-sm pixel-text text-muted-foreground">
            {Object.keys(otherPlayers).length > 0
              ? `Playing with ${Object.keys(otherPlayers).length} other ${Object.keys(otherPlayers).length === 1 ? "hero" : "heroes"}`
              : `Waiting for other heroes to join... (allPlayers: ${Object.keys(allPlayers).length}, playerId: ${playerId})`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="game-canvas pixel-art" />
            

            {/* Input de chat superpuesto */}
            {showChatInput && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-80 p-3 rounded-lg">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Escribe tu mensaje... (Enter para enviar, Esc para cancelar)"
                    className="bg-white text-black font-mono text-sm"
                    maxLength={100}
                    autoFocus
                  />
                  <div className="text-xs text-white mt-1 opacity-70">
                    {currentMessage.length}/100 caracteres
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm pixel-text text-center sm:text-left">
              <p className="font-bold mb-1">{"Controls:"}</p>
              <p>{"Use WASD or Arrow Keys to move"}</p>
              <p>{"Press Enter or T to chat"}</p>
              <p>{"Press E to interact with NPCs"}</p>
              <p className="text-xs mt-1 text-muted-foreground">{"Messages appear above players for 5 seconds"}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={onBackToCreation} className="pixel-button">
                {"Create New Hero"}
              </Button>
            </div>
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

    </div>
  )
}
