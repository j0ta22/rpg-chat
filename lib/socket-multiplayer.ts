import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string
  text: string
  timestamp: number
  playerId: string
  playerName: string
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

export class SocketMultiplayerClient {
  private socket: Socket | null = null
  private onStateUpdate: (state: GameState) => void
  private onPlayerJoin: (player: Player) => void
  private onPlayerLeave: (playerId: string) => void
  private onPlayerMove: (playerId: string, x: number, y: number) => void
  private onChatMessage: (message: ChatMessage) => void
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 5000 // 5 segundos
  private readonly SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://rpg-chat-mfru.onrender.com' 
      : 'http://localhost:3001')
  private isConnected = false

  constructor(
    onStateUpdate: (state: GameState) => void,
    onPlayerJoin: (player: Player) => void,
    onPlayerLeave: (playerId: string) => void,
    onPlayerMove: (playerId: string, x: number, y: number) => void,
    onChatMessage: (message: ChatMessage) => void,
  ) {
    this.onStateUpdate = onStateUpdate
    this.onPlayerJoin = onPlayerJoin
    this.onPlayerLeave = onPlayerLeave
    this.onPlayerMove = onPlayerMove
    this.onChatMessage = onChatMessage
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🌍 Conectando al servidor...')
        
        this.socket = io(this.SERVER_URL, {
          transports: ['websocket', 'polling']
        })

        this.setupEventListeners()
        
        // Esperar a que la conexión esté realmente establecida
        this.socket.on('connect', () => {
          this.isConnected = true
          console.log('✅ Conectado al servidor')
          this.startHeartbeat()
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Error de conexión:', error)
          reject(error)
        })

        // Timeout de conexión
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Timeout de conexión'))
          }
        }, 5000)

      } catch (error) {
        console.error('❌ Error conectando al servidor:', error)
        reject(error)
      }
    })
  }

  private setupEventListeners(): void {
    if (!this.socket) return

    // Estado del juego
    this.socket.on('gameState', (state: GameState) => {
      console.log('📥 Estado del juego recibido:', state)
      this.onStateUpdate(state)
    })

    // Jugador se unió
    this.socket.on('playerJoined', (player: Player) => {
      console.log(`🎮 Jugador ${player.name} se unió`)
      this.onPlayerJoin(player)
    })

    // Jugador se fue
    this.socket.on('playerLeft', (playerId: string) => {
      console.log(`👋 Jugador ${playerId} se fue`)
      this.onPlayerLeave(playerId)
    })

    // Jugador se movió
    this.socket.on('playerMoved', (data: { playerId: string, x: number, y: number }) => {
      this.onPlayerMove(data.playerId, data.x, data.y)
    })

    // Mensaje de chat
    this.socket.on('chatMessage', (message: ChatMessage) => {
      console.log(`💬 ${message.playerName}: ${message.text}`)
      this.onChatMessage(message)
    })

    // Desconexión
    this.socket.on('disconnect', () => {
      console.log('🔌 Desconectado del servidor')
      this.isConnected = false
    })
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('heartbeat')
        console.log('💓 Heartbeat enviado')
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  joinGame(player: Omit<Player, "id" | "lastSeen">): void {
    if (this.socket && this.socket.connected && this.isConnected) {
      this.socket.emit('joinGame', player)
      console.log(`🎮 Uniéndose al juego como ${player.name}`)
    } else {
      console.error('❌ No conectado al servidor')
      // Reintentar después de un breve delay
      setTimeout(() => {
        if (this.socket && this.socket.connected && this.isConnected) {
          this.socket.emit('joinGame', player)
          console.log(`🎮 Reintentando unirse al juego como ${player.name}`)
        }
      }, 1000)
    }
  }

  updatePlayerPosition(x: number, y: number): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('updatePosition', { x, y })
    }
  }

  sendChatMessage(message: string): void {
    if (this.socket && this.socket.connected) {
      // Asegurar que el mensaje sea un string
      const messageText = typeof message === 'string' ? message : String(message);
      this.socket.emit('chatMessage', messageText)
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    console.log('🔌 Desconectado del servidor')
  }

  getPlayerId(): string {
    return this.socket?.id || ''
  }

  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  getCurrentState(): GameState {
    // Para Socket.IO, el estado se maneja en el servidor
    // Este método es para compatibilidad con el código existente
    return { players: {}, lastUpdate: Date.now() }
  }

  // Función estática para limpiar todos los jugadores
  static async clearAllPlayers(): Promise<void> {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://rpg-chat-mfru.onrender.com' 
          : 'http://localhost:3001')
        
      const response = await fetch(`${serverUrl}/api/players`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('🧹 Todos los jugadores eliminados del servidor')
      } else {
        console.warn('⚠️ Error limpiando jugadores del servidor')
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando jugadores del servidor:', error)
    }
  }
}
