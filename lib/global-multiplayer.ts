export interface ChatMessage {
  id: string
  text: string
  timestamp: number
  playerId: string
}

export interface Player {
  id: string
  name: string
  avatar: string
  x: number
  y: number
  color: string
  lastSeen: number
  currentMessage?: ChatMessage
}

export interface GameState {
  players: Record<string, Player>
}

// Usar un servicio de sincronización en tiempo real
// Para demo, usaremos una URL pública que simule un servidor
const GLOBAL_STATE_URL = 'https://api.jsonbin.io/v3/b/65f8a1231f5677401f3a1234'
const API_KEY = '$2a$10$your-api-key-here' // Reemplazar con una API key real

export class GlobalMultiplayerClient {
  private playerId: string
  private onStateUpdate: (state: GameState) => void
  private onPlayerJoin: (player: Player) => void
  private onPlayerLeave: (playerId: string) => void
  private syncInterval: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly SYNC_INTERVAL = 1000 // 1 segundo
  private readonly HEARTBEAT_INTERVAL = 5000 // 5 segundos
  private readonly PLAYER_TIMEOUT = 30000 // 30 segundos
  private currentState: GameState = { players: {} }

  constructor(
    onStateUpdate: (state: GameState) => void,
    onPlayerJoin: (player: Player) => void,
    onPlayerLeave: (playerId: string) => void,
  ) {
    this.playerId = this.generatePlayerId()
    this.onStateUpdate = onStateUpdate
    this.onPlayerJoin = onPlayerJoin
    this.onPlayerLeave = onPlayerLeave
  }

  private generatePlayerId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  async connect(): Promise<void> {
    try {
      // Intentar cargar el estado global existente
      await this.loadGlobalState()
      
      // Iniciar sincronización
      this.startSync()
      this.startHeartbeat()
      
      console.log('[GLOBAL MULTIPLAYER] Connected to global state')
    } catch (error) {
      console.error('[GLOBAL MULTIPLAYER] Connection failed:', error)
      // Fallback a localStorage si falla la conexión global
      this.fallbackToLocalStorage()
    }
  }

  private async loadGlobalState(): Promise<void> {
    try {
      const response = await fetch(GLOBAL_STATE_URL, {
        headers: {
          'X-Master-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.record && data.record.players) {
          this.currentState = data.record
          this.onStateUpdate(this.currentState)
        }
      }
    } catch (error) {
      console.log('[GLOBAL MULTIPLAYER] Using fallback localStorage')
      this.fallbackToLocalStorage()
    }
  }

  private fallbackToLocalStorage(): void {
    // Fallback al sistema local si no hay conexión global
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      this.currentState = JSON.parse(stateStr)
      this.onStateUpdate(this.currentState)
    }
  }

  private async saveGlobalState(): Promise<void> {
    try {
      await fetch(GLOBAL_STATE_URL, {
        method: 'PUT',
        headers: {
          'X-Master-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.currentState)
      })
    } catch (error) {
      console.error('[GLOBAL MULTIPLAYER] Failed to save state:', error)
      // Fallback a localStorage
      localStorage.setItem("rpg-multiplayer-state", JSON.stringify(this.currentState))
    }
  }

  private startSync(): void {
    this.syncInterval = setInterval(async () => {
      await this.loadGlobalState()
    }, this.SYNC_INTERVAL)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.currentState.players[this.playerId]) {
        this.currentState.players[this.playerId].lastSeen = Date.now()
        this.saveGlobalState()
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  joinGame(player: Omit<Player, "id" | "lastSeen">): void {
    const newPlayer: Player = {
      ...player,
      id: this.playerId,
      lastSeen: Date.now()
    }

    this.currentState.players[this.playerId] = newPlayer
    this.saveGlobalState()
    this.onPlayerJoin(newPlayer)
    
    console.log(`[GLOBAL MULTIPLAYER] Player ${newPlayer.name} joined. Total players: ${Object.keys(this.currentState.players).length}`)
  }

  updatePlayerPosition(x: number, y: number): void {
    if (this.currentState.players[this.playerId]) {
      this.currentState.players[this.playerId].x = x
      this.currentState.players[this.playerId].y = y
      this.currentState.players[this.playerId].lastSeen = Date.now()
      this.saveGlobalState()
    }
  }

  sendChatMessage(message: string): void {
    const chatMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 15),
      text: message,
      timestamp: Date.now(),
      playerId: this.playerId
    }

    if (this.currentState.players[this.playerId]) {
      this.currentState.players[this.playerId].currentMessage = chatMessage
      this.saveGlobalState()
    }
  }

  disconnect(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    // Remover jugador del estado global
    if (this.currentState.players[this.playerId]) {
      delete this.currentState.players[this.playerId]
      this.saveGlobalState()
    }
  }

  getPlayerId(): string {
    return this.playerId
  }

  // Función para limpiar manualmente todos los jugadores
  static async clearAllPlayers(): Promise<void> {
    try {
      await fetch(GLOBAL_STATE_URL, {
        method: 'PUT',
        headers: {
          'X-Master-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ players: {} })
      })
      console.log('[GLOBAL MULTIPLAYER] All players cleared')
    } catch (error) {
      console.error('[GLOBAL MULTIPLAYER] Failed to clear players:', error)
      // Fallback a localStorage
      localStorage.setItem("rpg-multiplayer-state", JSON.stringify({ players: {} }))
    }
  }
}

