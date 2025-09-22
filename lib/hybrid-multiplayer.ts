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
  lastUpdate: number
}

export class HybridMultiplayerClient {
  private playerId: string
  private onStateUpdate: (state: GameState) => void
  private onPlayerJoin: (player: Player) => void
  private onPlayerLeave: (playerId: string) => void
  private syncInterval: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly SYNC_INTERVAL = 2000 // 2 segundos
  private readonly HEARTBEAT_INTERVAL = 5000 // 5 segundos
  private readonly PLAYER_TIMEOUT = 30000 // 30 segundos
  private currentState: GameState = { players: {}, lastUpdate: 0 }
  private isConnected = false
  private readonly STORAGE_KEY = 'rpg-chat-global-room'
  private readonly BIN_ID = '65f8a8c41f5677401f3a1234' // ID público para demo
  private readonly API_URL = `https://api.jsonbin.io/v3/b/${this.BIN_ID}`
  private readonly API_KEY = '$2a$10$example' // Clave pública de ejemplo
  private useLocalStorage = false

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
      
      // Intentar conectar al servicio externo primero
      const connected = await this.testExternalService()
      
      if (connected) {
        console.log('✅ Conectado al servicio externo')
        this.useLocalStorage = false
      } else {
        console.log('⚠️ Servicio externo no disponible, usando localStorage')
        this.useLocalStorage = true
      }
      
      // Cargar estado inicial
      await this.loadState()
      
      // Iniciar sincronización
      this.startSync()
      this.startHeartbeat()
      this.setupStorageListener()
      
      this.isConnected = true
      console.log('✅ Conectado a la sala global')
    } catch (error) {
      console.error('❌ Error conectando a la sala global:', error)
      // Fallback a localStorage
      this.useLocalStorage = true
      await this.loadState()
      this.startSync()
      this.startHeartbeat()
      this.setupStorageListener()
      this.isConnected = true
    }
  }

  private async testExternalService(): Promise<boolean> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'X-Master-Key': this.API_KEY,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch (error) {
      console.warn('⚠️ Servicio externo no disponible:', error)
      return false
    }
  }

  private async loadState(): Promise<void> {
    try {
      if (this.useLocalStorage) {
        await this.loadFromLocalStorage()
      } else {
        await this.loadFromExternalService()
      }
    } catch (error) {
      console.warn('⚠️ Error cargando estado, usando localStorage:', error)
      await this.loadFromLocalStorage()
    }
  }

  private async loadFromLocalStorage(): Promise<void> {
    const stateStr = localStorage.getItem(this.STORAGE_KEY)
    if (stateStr) {
      const parsed = JSON.parse(stateStr)
      if (parsed.players && typeof parsed.lastUpdate === 'number') {
        this.currentState = parsed
        this.cleanupInactivePlayers()
        this.onStateUpdate(this.currentState)
        console.log('📥 Estado cargado desde localStorage:', this.currentState)
      }
    }
  }

  private async loadFromExternalService(): Promise<void> {
    const response = await fetch(this.API_URL, {
      method: 'GET',
      headers: {
        'X-Master-Key': this.API_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.record && data.record.players) {
        this.currentState = data.record
        this.cleanupInactivePlayers()
        this.onStateUpdate(this.currentState)
        console.log('📥 Estado cargado desde servicio externo:', this.currentState)
      }
    } else {
      throw new Error('Servicio externo no disponible')
    }
  }

  private async saveState(): Promise<void> {
    try {
      this.currentState.lastUpdate = Date.now()
      
      if (this.useLocalStorage) {
        await this.saveToLocalStorage()
      } else {
        await this.saveToExternalService()
      }
    } catch (error) {
      console.warn('⚠️ Error guardando estado:', error)
      // Fallback a localStorage
      await this.saveToLocalStorage()
    }
  }

  private async saveToLocalStorage(): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentState))
    console.log('💾 Estado guardado en localStorage:', this.currentState)
  }

  private async saveToExternalService(): Promise<void> {
    const response = await fetch(this.API_URL, {
      method: 'PUT',
      headers: {
        'X-Master-Key': this.API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.currentState)
    })

    if (response.ok) {
      // También guardar en localStorage como backup
      await this.saveToLocalStorage()
      console.log('💾 Estado guardado en servicio externo:', this.currentState)
    } else {
      throw new Error('Error guardando en servicio externo')
    }
  }

  private startSync(): void {
    this.syncInterval = setInterval(async () => {
      try {
        const previousState = { ...this.currentState }
        await this.loadState()
        
        // Notificar cambios en el estado
        if (JSON.stringify(previousState) !== JSON.stringify(this.currentState)) {
          console.log('🔄 Estado actualizado desde sincronización')
          this.onStateUpdate(this.currentState)
        }
      } catch (error) {
        console.warn('⚠️ Error en sincronización:', error)
      }
    }, this.SYNC_INTERVAL)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.currentState.players[this.playerId]) {
        this.currentState.players[this.playerId].lastSeen = Date.now()
        this.saveState()
        console.log('💓 Heartbeat enviado')
      }
      
      // Limpiar jugadores inactivos
      this.cleanupInactivePlayers()
    }, this.HEARTBEAT_INTERVAL)
  }

  private setupStorageListener(): void {
    // Solo escuchar storage events si estamos usando localStorage
    if (this.useLocalStorage) {
      window.addEventListener('storage', this.handleStorageChange)
    }
  }

  private handleStorageChange = (e: StorageEvent) => {
    if (e.key === this.STORAGE_KEY && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue)
        if (newState.players && typeof newState.lastUpdate === 'number') {
          console.log('🔄 Sincronización desde otra pestaña:', newState)
          this.currentState = newState
          this.cleanupInactivePlayers()
          this.onStateUpdate(this.currentState)
        }
      } catch (error) {
        console.warn('⚠️ Error procesando cambio de storage:', error)
      }
    }
  }

  private cleanupInactivePlayers(): void {
    const now = Date.now()
    const activePlayers: Record<string, Player> = {}
    let hasChanges = false

    Object.entries(this.currentState.players).forEach(([id, player]) => {
      if (now - player.lastSeen < this.PLAYER_TIMEOUT) {
        activePlayers[id] = player
      } else {
        hasChanges = true
        console.log(`👋 Jugador ${player.name} desconectado por inactividad`)
        this.onPlayerLeave(id)
      }
    })

    if (hasChanges) {
      this.currentState.players = activePlayers
      this.saveState()
    }
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
    
    console.log(`🎮 Jugador ${newPlayer.name} se unió. Total: ${Object.keys(this.currentState.players).length}`)
    console.log(`🌍 Estado actual:`, this.currentState)
    console.log(`🔑 Modo: ${this.useLocalStorage ? 'localStorage' : 'servicio externo'}`)
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
    
    // Remover listener de storage
    window.removeEventListener('storage', this.handleStorageChange)
    
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

  getCurrentState(): GameState {
    return this.currentState
  }

  // Función para limpiar manualmente todos los jugadores
  static async clearAllPlayers(): Promise<void> {
    try {
      // Limpiar localStorage
      localStorage.setItem('rpg-chat-global-room', JSON.stringify({ players: {}, lastUpdate: Date.now() }))
      
      // Intentar limpiar servicio externo
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/65f8a8c41f5677401f3a1234`, {
          method: 'PUT',
          headers: {
            'X-Master-Key': '$2a$10$example',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ players: {}, lastUpdate: Date.now() })
        })
        
        if (response.ok) {
          console.log('🧹 Servicio externo limpiado')
        }
      } catch (error) {
        console.warn('⚠️ No se pudo limpiar servicio externo:', error)
      }
      
      console.log('🧹 Todos los jugadores eliminados')
    } catch (error) {
      console.warn('⚠️ Error limpiando jugadores:', error)
    }
  }
}
