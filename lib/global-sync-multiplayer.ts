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

export class GlobalSyncMultiplayerClient {
  private playerId: string
  private onStateUpdate: (state: GameState) => void
  private onPlayerJoin: (player: Player) => void
  private onPlayerLeave: (playerId: string) => void
  private syncInterval: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly SYNC_INTERVAL = 1000 // 1 segundo para mejor sincronización
  private readonly HEARTBEAT_INTERVAL = 3000 // 3 segundos
  private readonly PLAYER_TIMEOUT = 15000 // 15 segundos
  private currentState: GameState = { players: {}, lastUpdate: 0 }
  private isConnected = false
  private readonly STORAGE_KEY = 'rpg-chat-global-room'

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
      this.setupStorageListener()
      
      this.isConnected = true
      console.log('✅ Conectado a la sala global')
    } catch (error) {
      console.error('❌ Error conectando a la sala global:', error)
    }
  }

  private async loadState(): Promise<void> {
    try {
      const stateStr = localStorage.getItem(this.STORAGE_KEY)
      if (stateStr) {
        const parsed = JSON.parse(stateStr)
        if (parsed.players && typeof parsed.lastUpdate === 'number') {
          this.currentState = parsed
          this.cleanupInactivePlayers()
          this.onStateUpdate(this.currentState)
          console.log('📥 Estado cargado:', this.currentState)
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando estado:', error)
    }
  }

  private async saveState(): Promise<void> {
    try {
      this.currentState.lastUpdate = Date.now()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentState))
      console.log('💾 Estado guardado:', this.currentState)
    } catch (error) {
      console.warn('⚠️ Error guardando estado:', error)
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
    // Escuchar cambios en localStorage desde otras pestañas
    window.addEventListener('storage', this.handleStorageChange)
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
    console.log(`🔑 Storage key: ${this.STORAGE_KEY}`)
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

  getPlayerId(): string {
    return this.playerId
  }

  getCurrentState(): GameState {
    return this.currentState
  }

  // Función para limpiar manualmente todos los jugadores
  static async clearAllPlayers(): Promise<void> {
    try {
      localStorage.setItem('rpg-chat-global-room', JSON.stringify({ players: {}, lastUpdate: Date.now() }))
      console.log('🧹 Todos los jugadores eliminados')
    } catch (error) {
      console.warn('⚠️ Error limpiando jugadores:', error)
    }
  }
}