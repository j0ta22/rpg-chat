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
  lastSeen: number // Timestamp para detectar jugadores inactivos
  currentMessage?: ChatMessage // Mensaje actual del jugador
}

export interface GameState {
  players: Record<string, Player>
}

export class MultiplayerClient {
  private ws: WebSocket | null = null
  private playerId: string
  private onStateUpdate: (state: GameState) => void
  private onPlayerJoin: (player: Player) => void
  private onPlayerLeave: (playerId: string) => void
  private heartbeatInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 3000 // 3 segundos
  private readonly PLAYER_TIMEOUT = 30000 // 30 segundos para considerar desconectado

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
    return Math.random().toString(36).substring(2, 15)
  }

  private migrateExistingPlayers(): void {
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      const state: GameState = JSON.parse(stateStr)
      const now = Date.now()
      let needsUpdate = false

      for (const playerId in state.players) {
        const player = state.players[playerId]
        if (!player.lastSeen) {
          // Marcar jugadores sin lastSeen como muy antiguos para que sean eliminados
          player.lastSeen = now - (this.PLAYER_TIMEOUT + 1000) // 1 segundo más que el timeout
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        localStorage.setItem("rpg-multiplayer-state", JSON.stringify(state))
      }
    }
  }

  // For demo purposes, we'll simulate multiplayer with local storage and polling
  // In production, this would use actual WebSocket connections
  connect(): Promise<void> {
    return new Promise((resolve) => {
      // Initialize local multiplayer state
      const existingState = localStorage.getItem("rpg-multiplayer-state")
      if (!existingState) {
        localStorage.setItem("rpg-multiplayer-state", JSON.stringify({ players: {} }))
      } else {
        // Migrar jugadores existentes que no tengan lastSeen
        this.migrateExistingPlayers()
      }

      // Start polling for state changes
      this.startPolling()
      
      // Start heartbeat to keep this player alive
      this.startHeartbeat()
      
      // Start cleanup process for inactive players
      this.startCleanup()
      
      // Agregar event listeners para detectar cuando el usuario cierra la pestaña
      this.setupPageUnloadHandlers()
      
      resolve()
    })
  }

  private startPolling() {
    setInterval(() => {
      const stateStr = localStorage.getItem("rpg-multiplayer-state")
      if (stateStr) {
        const state: GameState = JSON.parse(stateStr)
        this.onStateUpdate(state)
      }
    }, 100) // Poll every 100ms for smooth movement
  }

  joinGame(player: Omit<Player, "id" | "lastSeen">): void {
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      const state: GameState = JSON.parse(stateStr)
      const newPlayer: Player = { 
        ...player, 
        id: this.playerId,
        lastSeen: Date.now()
      }
      
      state.players[this.playerId] = newPlayer
      localStorage.setItem("rpg-multiplayer-state", JSON.stringify(state))
      
      this.onPlayerJoin(newPlayer)
    }
  }

  updatePlayerPosition(x: number, y: number): void {
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      const state: GameState = JSON.parse(stateStr)
      if (state.players[this.playerId]) {
        state.players[this.playerId].x = x
        state.players[this.playerId].y = y
        state.players[this.playerId].lastSeen = Date.now()
        localStorage.setItem("rpg-multiplayer-state", JSON.stringify(state))
      }
    }
  }

  sendMessage(text: string): void {
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      const state: GameState = JSON.parse(stateStr)
      if (state.players[this.playerId]) {
        const message: ChatMessage = {
          id: Math.random().toString(36).substring(2, 15),
          text: text.trim(),
          timestamp: Date.now(),
          playerId: this.playerId
        }
        
        state.players[this.playerId].currentMessage = message
        state.players[this.playerId].lastSeen = Date.now()
        localStorage.setItem("rpg-multiplayer-state", JSON.stringify(state))
        
        // Message sent successfully
        
        // Limpiar el mensaje después de 5 segundos
        setTimeout(() => {
          this.clearMessage()
        }, 5000)
      } else {
        console.error(`[Chat] Player ${this.playerId} not found in state when sending message`)
      }
    } else {
      console.error(`[Chat] No multiplayer state found when sending message`)
    }
  }

  private clearMessage(): void {
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      const state: GameState = JSON.parse(stateStr)
      if (state.players[this.playerId] && state.players[this.playerId].currentMessage) {
        delete state.players[this.playerId].currentMessage
        localStorage.setItem("rpg-multiplayer-state", JSON.stringify(state))
      }
    }
  }

  leaveGame(): void {
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      const state: GameState = JSON.parse(stateStr)
      delete state.players[this.playerId]
      localStorage.setItem("rpg-multiplayer-state", JSON.stringify(state))
      this.onPlayerLeave(this.playerId)
    }
  }

  getPlayerId(): string {
    return this.playerId
  }

  // Función para limpiar manualmente todos los jugadores
  static clearAllPlayers(): void {
    localStorage.setItem("rpg-multiplayer-state", JSON.stringify({ players: {} }))
  }


  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat()
    }, this.HEARTBEAT_INTERVAL)
  }

  private updateHeartbeat(): void {
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      const state: GameState = JSON.parse(stateStr)
      if (state.players[this.playerId]) {
        state.players[this.playerId].lastSeen = Date.now()
        localStorage.setItem("rpg-multiplayer-state", JSON.stringify(state))
      } else {
        console.warn(`[Multiplayer] Player ${this.playerId} not found in state during heartbeat`)
      }
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactivePlayers()
    }, 5000) // Ejecutar limpieza cada 5 segundos
  }

  private cleanupInactivePlayers(): void {
    const stateStr = localStorage.getItem("rpg-multiplayer-state")
    if (stateStr) {
      const state: GameState = JSON.parse(stateStr)
      const now = Date.now()
      let playersRemoved = false

      // Buscar jugadores inactivos
      for (const playerId in state.players) {
        const player = state.players[playerId]
        
        // Verificar si el jugador tiene la propiedad lastSeen
        if (!player.lastSeen) {
          player.lastSeen = now
          continue
        }
        
        const timeSinceLastSeen = now - player.lastSeen
        
        if (timeSinceLastSeen > this.PLAYER_TIMEOUT) {
          delete state.players[playerId]
          this.onPlayerLeave(playerId)
          playersRemoved = true
        }
      }

      // Solo actualizar localStorage si hubo cambios
      if (playersRemoved) {
        localStorage.setItem("rpg-multiplayer-state", JSON.stringify(state))
      }
    }
  }

  private setupPageUnloadHandlers(): void {
    // Handler para cuando el usuario cierra la pestaña o navega fuera
    const handleBeforeUnload = () => {
      this.leaveGame()
    }

    const handleUnload = () => {
      this.leaveGame()
    }

    // Agregar event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('unload', handleUnload)
      
      // También detectar cuando la página pierde el foco por mucho tiempo
      let lastFocus = Date.now()
      
      const handleVisibilityChange = () => {
        if (document.hidden) {
          lastFocus = Date.now()
        } else {
          // Si la página estuvo oculta por más de 30 segundos, actualizar heartbeat
          if (Date.now() - lastFocus > 30000) {
            this.updateHeartbeat()
          }
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  disconnect(): void {
    // Limpiar intervalos
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    this.leaveGame()
  }
}
