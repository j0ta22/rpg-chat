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
// Para demo, usaremos JSONBin.io que es gratuito y funciona entre navegadores
const API_BASE_URL = 'https://api.jsonbin.io/v3/b'
const BIN_ID = '65f8a1231f5677401f3a1234' // Reemplazar con tu bin ID real
const API_KEY = '$2a$10$your-api-key-here' // Reemplazar con tu API key real

export class RealMultiplayerClient {
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
  private isConnected = false

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
      console.log('🌍 Conectando a la sala global...')
      
      // Cargar estado inicial
      await this.loadState()
      
      // Iniciar sincronización
      this.startSync()
      this.startHeartbeat()
      
      this.isConnected = true
      console.log('✅ Conectado a la sala global')
    } catch (error) {
      console.error('❌ Error conectando a la sala global:', error)
      // Fallback a localStorage si falla la conexión
      this.fallbackToLocalStorage()
    }
  }

  private async loadState(): Promise<void> {
    try {
      // Intentar cargar desde la API
      const response = await fetch(`${API_BASE_URL}/${BIN_ID}/latest`, {
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
          return
        }
      }
      
      // Si falla la API, usar localStorage como fallback
      this.fallbackToLocalStorage()
    } catch (error) {
      console.warn('⚠️ API no disponible, usando localStorage:', error)
      this.fallbackToLocalStorage()
    }
  }

  private fallbackToLocalStorage(): void {
    const stateStr = localStorage.getItem('rpg-multiplayer-state')
    if (stateStr) {
      this.currentState = JSON.parse(stateStr)
      this.onStateUpdate(this.currentState)
    }
  }

  private async saveState(): Promise<void> {
    try {
      // Intentar guardar en la API
      const response = await fetch(`${API_BASE_URL}/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'X-Master-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.currentState)
      })
      
      if (response.ok) {
        // También guardar en localStorage como backup
        localStorage.setItem('rpg-multiplayer-state', JSON.stringify(this.currentState))
        return
      }
    } catch (error) {
      console.warn('⚠️ Error guardando en API, usando localStorage:', error)
    }
    
    // Fallback a localStorage
    localStorage.setItem('rpg-multiplayer-state', JSON.stringify(this.currentState))
  }

  private startSync(): void {
    this.syncInterval = setInterval(async () => {
      await this.loadState()
    }, this.SYNC_INTERVAL)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.currentState.players[this.playerId]) {
        this.currentState.players[this.playerId].lastSeen = Date.now()
        this.saveState()
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
    this.saveState()
    this.onPlayerJoin(newPlayer)
    
    console.log(`🎮 Player ${newPlayer.name} joined. Total: ${Object.keys(this.currentState.players).length}`)
  }

  updatePlayerPosition(x: number, y: number): void {
    if (this.currentState.players[this.playerId]) {
      this.currentState.players[this.playerId].x = x
      this.currentState.players[this.playerId].y = y
      this.currentState.players[this.playerId].lastSeen = Date.now()
      this.saveState()
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
      this.saveState()
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
      this.saveState()
    }
    
    this.isConnected = false
  }

  getPlayerId(): string {
    return this.playerId
  }

  // Función para limpiar manualmente todos los jugadores
  static async clearAllPlayers(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'X-Master-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ players: {} })
      })
      console.log('🧹 Todos los jugadores eliminados de la API')
    } catch (error) {
      console.warn('⚠️ Error limpiando API, usando localStorage:', error)
    }
    
    // También limpiar localStorage
    localStorage.setItem('rpg-multiplayer-state', JSON.stringify({ players: {} }))
    console.log('🧹 Todos los jugadores eliminados')
  }
}

