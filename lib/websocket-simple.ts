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

// Usar un servidor WebSocket público para demo
// En producción, usarías tu propio servidor WebSocket
const WS_URL = 'wss://echo.websocket.org'

export class WebSocketSimpleClient {
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
    return new Promise((resolve, reject) => {
      try {
        console.log('🌍 Conectando a la sala global...')
        
        this.ws = new WebSocket(WS_URL)
        
        this.ws.onopen = () => {
          console.log('✅ Conectado a la sala global')
          this.isConnected = true
          this.startHeartbeat()
          this.clearReconnectInterval()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            // El servidor echo devuelve el mensaje tal como se envía
            // Simulamos que recibimos nuestro propio estado
            this.handleEchoMessage(event.data)
          }
        }

        this.ws.onclose = () => {
          console.log('🔌 Conexión cerrada')
          this.isConnected = false
          this.startReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('❌ Error de conexión:', error)
          this.isConnected = false
          reject(error)
        }

        // Timeout de conexión
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Timeout de conexión'))
          }
        }, 10000)

      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: any): void {
    if (message.type === 'state_update') {
      this.currentState = message.data
      this.onStateUpdate(this.currentState)
    }
  }

  private handleEchoMessage(data: string): void {
    // El servidor echo devuelve el mensaje tal como se envía
    // Simulamos que recibimos nuestro propio estado
    try {
      const message = JSON.parse(data)
      if (message.type === 'state_update') {
        this.currentState = message.data
        this.onStateUpdate(this.currentState)
      }
    } catch (error) {
      // Ignorar mensajes que no son JSON
    }
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'heartbeat',
          data: { playerId: this.playerId, timestamp: Date.now() }
        })
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  private startReconnect(): void {
    if (this.reconnectInterval) return
    
    this.reconnectInterval = setInterval(() => {
      console.log('🔄 Intentando reconectar...')
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

    this.currentState.players[this.playerId] = newPlayer
    
    this.sendMessage({
      type: 'state_update',
      data: this.currentState
    })
    
    this.onPlayerJoin(newPlayer)
    console.log(`🎮 Jugador ${newPlayer.name} se unió. Total: ${Object.keys(this.currentState.players).length}`)
  }

  updatePlayerPosition(x: number, y: number): void {
    if (this.currentState.players[this.playerId]) {
      this.currentState.players[this.playerId].x = x
      this.currentState.players[this.playerId].y = y
      this.currentState.players[this.playerId].lastSeen = Date.now()
      
      this.sendMessage({
        type: 'state_update',
        data: this.currentState
      })
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
      
      this.sendMessage({
        type: 'state_update',
        data: this.currentState
      })
    }
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
    
    this.isConnected = false
  }

  getPlayerId(): string {
    return this.playerId
  }

  // Función para limpiar manualmente todos los jugadores
  static clearAllPlayers(): void {
    console.log('🧹 Limpiar jugadores - requiere implementación del servidor')
  }
}

