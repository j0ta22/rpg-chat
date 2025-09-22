import { io, Socket } from 'socket.io-client'

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
  private keepAliveInterval: NodeJS.Timeout | null = null
  private connectionTimeout: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 8000 // 8 segundos
  private readonly KEEPALIVE_INTERVAL = 15000 // 15 segundos
  private readonly CONNECTION_TIMEOUT = 8000 // 8 segundos
  private readonly SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://rpg-chat-mfru.onrender.com' 
      : 'http://localhost:3001')
  private isConnected = false
  private connectionAttempts = 0
  private maxConnectionAttempts = 3
  private isReconnecting = false
  private lastSuccessfulConnection = 0
  private reconnectDelay = 2000
  private maxReconnectDelay = 10000

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
    if (this.isConnected || this.isReconnecting) {
      return
    }

    this.isReconnecting = true
    this.connectionAttempts++

    return new Promise((resolve, reject) => {
      try {
        console.log(`🌍 Conectando al servidor... (intento ${this.connectionAttempts}/${this.maxConnectionAttempts})`, this.SERVER_URL)
        
        // Clear any existing connection
        if (this.socket) {
          this.socket.disconnect()
          this.socket = null
        }

        this.socket = io(this.SERVER_URL, {
          transports: ['polling', 'websocket'],
          timeout: this.CONNECTION_TIMEOUT,
          forceNew: false, // Reuse existing connection if possible
          reconnection: true, // Enable automatic reconnection
          reconnectionDelay: 1000, // 1 second delay
          reconnectionAttempts: 5, // Max 5 attempts
          reconnectionDelayMax: 5000, // Max 5 seconds delay
          autoConnect: true,
          upgrade: true,
          rememberUpgrade: true, // Remember successful transport
          withCredentials: false
        })

        this.setupEventListeners()
        
        // Connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            console.error('❌ Timeout de conexión')
            this.handleConnectionFailure()
            reject(new Error('Timeout de conexión'))
          }
        }, this.CONNECTION_TIMEOUT)

        // Wait for connection
        this.socket.on('connect', () => {
          this.handleSuccessfulConnection()
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ Error de conexión:', error)
          this.handleConnectionFailure()
          reject(error)
        })

      } catch (error) {
        console.error('❌ Error conectando al servidor:', error)
        this.handleConnectionFailure()
        reject(error)
      }
    })
  }

  private handleSuccessfulConnection() {
    this.isConnected = true
    this.isReconnecting = false
    this.connectionAttempts = 0
    this.lastSuccessfulConnection = Date.now()
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    console.log('✅ Conectado al servidor')
    this.startHeartbeat()
    this.startKeepAlive()
  }

  private handleConnectionFailure() {
    this.isConnected = false
    this.isReconnecting = false
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    console.error('❌ Fallo de conexión - no se intentará reconectar automáticamente')
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
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado del servidor:', reason)
      this.isConnected = false
      this.isReconnecting = false
      
      // Let Socket.IO handle reconnection automatically
      console.log('🔌 Conexión perdida - Socket.IO intentará reconectar automáticamente')
    })

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ Error del socket:', error)
    })
  }


  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected && this.isConnected) {
        this.socket.emit('heartbeat')
        console.log('💓 Heartbeat enviado')
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  private startKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
    }

    this.keepAliveInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.SERVER_URL}/keepalive`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (response.ok) {
          console.log('🔄 Keep-alive enviado')
        } else {
          console.warn('⚠️ Keep-alive falló:', response.status)
        }
      } catch (error) {
        console.warn('⚠️ Error en keep-alive:', error)
        // If keep-alive fails, try to reconnect
        if (this.isConnected) {
          this.attemptReconnection()
        }
      }
    }, this.KEEPALIVE_INTERVAL)
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
    if (this.socket && this.socket.connected && this.isConnected) {
      try {
        this.socket.emit('updatePosition', { x, y })
      } catch (error) {
        console.warn('⚠️ Error enviando posición:', error)
      }
    }
  }

  sendChatMessage(message: string): void {
    if (this.socket && this.socket.connected && this.isConnected) {
      // Asegurar que el mensaje sea un string
      const messageText = typeof message === 'string' ? message : String(message);
      this.socket.emit('chatMessage', messageText)
    }
  }

  disconnect(): void {
    this.isReconnecting = false
    this.connectionAttempts = 0
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
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

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnecting: this.isReconnecting,
      attempts: this.connectionAttempts,
      lastConnection: this.lastSuccessfulConnection
    }
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