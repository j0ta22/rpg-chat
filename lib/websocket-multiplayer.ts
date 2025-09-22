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

export interface WebSocketMessage {
  type: 'player_join' | 'player_leave' | 'player_update' | 'state_sync' | 'chat_message'
  data: any
}

export class WebSocketMultiplayerClient {
  private ws: WebSocket | null = null
  private playerId: string
  private onStateUpdate: (state: GameState) => void
  private onPlayerJoin: (player: Player) => void
  private onPlayerLeave: (playerId: string) => void
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 5000 // 5 segundos
  private readonly RECONNECT_INTERVAL = 3000 // 3 segundos
  private readonly PLAYER_TIMEOUT = 30000 // 30 segundos
  private isConnected = false
  private serverUrl: string

  constructor(
    onStateUpdate: (state: GameState) => void,
    onPlayerJoin: (player: Player) => void,
    onPlayerLeave: (playerId: string) => void,
    serverUrl: string = 'wss://echo.websocket.org'
  ) {
    this.playerId = this.generatePlayerId()
    this.onStateUpdate = onStateUpdate
    this.onPlayerJoin = onPlayerJoin
    this.onPlayerLeave = onPlayerLeave
    this.serverUrl = serverUrl
  }

  private generatePlayerId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Usar un servidor WebSocket público para demo
        // En producción, usarías tu propio servidor
        this.ws = new WebSocket(this.serverUrl)
        
        this.ws.onopen = () => {
          console.log('[WEBSOCKET] Connected to server')
          this.isConnected = true
          this.startHeartbeat()
          this.clearReconnectInterval()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('[WEBSOCKET] Error parsing message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('[WEBSOCKET] Connection closed')
          this.isConnected = false
          this.startReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('[WEBSOCKET] Connection error:', error)
          this.isConnected = false
          reject(error)
        }

        // Timeout de conexión
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'))
          }
        }, 10000)

      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'player_join':
        this.onPlayerJoin(message.data)
        break
      case 'player_leave':
        this.onPlayerLeave(message.data.playerId)
        break
      case 'state_sync':
        this.onStateUpdate(message.data)
        break
      case 'player_update':
        // Actualizar posición de jugador específico
        break
      case 'chat_message':
        // Manejar mensaje de chat
        break
    }
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'player_update',
          data: { playerId: this.playerId, timestamp: Date.now() }
        })
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  private startReconnect(): void {
    if (this.reconnectInterval) return
    
    this.reconnectInterval = setInterval(() => {
      console.log('[WEBSOCKET] Attempting to reconnect...')
      this.connect().catch(() => {
        // Reintentar en el siguiente intervalo
      })
    }, this.RECONNECT_INTERVAL)
  }

  private clearReconnectInterval(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
  }

  joinGame(player: Omit<Player, "id" | "lastSeen">): void {
    const newPlayer: Player = {
      ...player,
      id: this.playerId,
      lastSeen: Date.now()
    }

    this.sendMessage({
      type: 'player_join',
      data: newPlayer
    })
  }

  updatePlayerPosition(x: number, y: number): void {
    this.sendMessage({
      type: 'player_update',
      data: {
        playerId: this.playerId,
        x,
        y,
        timestamp: Date.now()
      }
    })
  }

  sendChatMessage(message: string): void {
    const chatMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 15),
      text: message,
      timestamp: Date.now(),
      playerId: this.playerId
    }

    this.sendMessage({
      type: 'chat_message',
      data: chatMessage
    })
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
    }
    if (this.ws) {
      this.ws.close()
    }
  }

  getPlayerId(): string {
    return this.playerId
  }

  // Función para limpiar manualmente todos los jugadores
  static clearAllPlayers(): void {
    // En un sistema real, esto requeriría comunicación con el servidor
    console.log('[WEBSOCKET] Clear all players - requires server implementation')
  }
}

