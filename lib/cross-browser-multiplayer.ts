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

// Usar BroadcastChannel para comunicación entre pestañas del mismo origen
// y localStorage como fallback para diferentes navegadores
export class CrossBrowserMultiplayerClient {
  private playerId: string
  private onStateUpdate: (state: GameState) => void
  private onPlayerJoin: (player: Player) => void
  private onPlayerLeave: (playerId: string) => void
  private syncInterval: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private broadcastChannel: BroadcastChannel | null = null
  private readonly SYNC_INTERVAL = 500 // 500ms para sincronización rápida
  private readonly HEARTBEAT_INTERVAL = 3000 // 3 segundos
  private readonly PLAYER_TIMEOUT = 30000 // 30 segundos
  private currentState: GameState = { players: {} }
  private readonly STORAGE_KEY = 'rpg-global-multiplayer-state'
  private readonly CHANNEL_NAME = 'rpg-multiplayer-channel'

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
      // Cargar estado inicial primero
      await this.loadState()
      
      // Inicializar BroadcastChannel para comunicación entre pestañas
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel(this.CHANNEL_NAME)
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data)
        }
        this.broadcastChannel.onerror = (error) => {
          console.warn('[CROSS-BROWSER MULTIPLAYER] BroadcastChannel error:', error)
        }
      }
      
      // Iniciar sincronización
      this.startSync()
      this.startHeartbeat()
      
      console.log('[CROSS-BROWSER MULTIPLAYER] Connected to global state')
    } catch (error) {
      console.error('[CROSS-BROWSER MULTIPLAYER] Connection failed:', error)
    }
  }

  private async loadState(): Promise<void> {
    try {
      const stateStr = localStorage.getItem(this.STORAGE_KEY)
      if (stateStr) {
        const state: GameState = JSON.parse(stateStr)
        this.currentState = state
        this.onStateUpdate(this.currentState)
      }
    } catch (error) {
      console.error('[CROSS-BROWSER MULTIPLAYER] Failed to load state:', error)
    }
  }

  private async saveState(): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentState))
      
      // Broadcast a otras pestañas solo si el canal está abierto
      if (this.broadcastChannel && this.broadcastChannel.readyState === 'open') {
        this.broadcastChannel.postMessage({
          type: 'state_update',
          data: this.currentState
        })
      }
    } catch (error) {
      console.error('[CROSS-BROWSER MULTIPLAYER] Failed to save state:', error)
    }
  }

  private handleBroadcastMessage(message: any): void {
    try {
      if (message.type === 'state_update') {
        this.currentState = message.data
        this.onStateUpdate(this.currentState)
      }
    } catch (error) {
      console.warn('[CROSS-BROWSER MULTIPLAYER] Error handling broadcast message:', error)
    }
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
    
    console.log(`[CROSS-BROWSER MULTIPLAYER] Player ${newPlayer.name} joined. Total players: ${Object.keys(this.currentState.players).length}`)
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
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }
    
    // Remover jugador del estado global
    if (this.currentState.players[this.playerId]) {
      delete this.currentState.players[this.playerId]
      this.saveState()
    }
  }

  getPlayerId(): string {
    return this.playerId
  }

  // Función para limpiar manualmente todos los jugadores
  static clearAllPlayers(): void {
    localStorage.setItem('rpg-global-multiplayer-state', JSON.stringify({ players: {} }))
    
    // Broadcast a otras pestañas
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('rpg-multiplayer-channel')
        if (channel.readyState === 'open') {
          channel.postMessage({
            type: 'state_update',
            data: { players: {} }
          })
        }
        channel.close()
      } catch (error) {
        console.warn('[CROSS-BROWSER MULTIPLAYER] Failed to broadcast clear message:', error)
      }
    }
    
    console.log('[CROSS-BROWSER MULTIPLAYER] All players cleared')
  }
}
