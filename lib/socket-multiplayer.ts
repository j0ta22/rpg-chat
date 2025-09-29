import { io, Socket } from 'socket.io-client'

export interface ChatMessage {
  id: string
  text: string
  timestamp: number
  playerId: string
  playerName: string
}

export interface CombatChallenge {
  id: string
  challengerId: string
  challengerName: string
  challengedId: string
  challengedName: string
  timestamp: number
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}

export interface XPUpdate {
  xpGained: number
  newStats: {
    level: number
    experience: number
    experienceToNext: number
    health: number
    maxHealth: number
    attack: number
    defense: number
    speed: number
  }
  leveledUp: boolean
  levelsGained: number
  levelUpReward?: {
    healthIncrease: number
    attackIncrease: number
    defenseIncrease: number
    speedIncrease: number
  }
}

export interface CombatState {
  id: string
  challenger: {
    id: string
    name: string
    avatar: string
    health: number
    maxHealth: number
    isAlive: boolean
  }
  challenged: {
    id: string
    name: string
    avatar: string
    health: number
    maxHealth: number
    isAlive: boolean
  }
  currentTurn: string
  turns: Array<{
    playerId: string
    action: {
      type: 'attack' | 'block' | 'dodge'
      damage?: number
      blocked?: boolean
      dodged?: boolean
    }
    timestamp: number
  }>
  status: 'waiting' | 'active' | 'finished'
  winner?: string
  startTime: number
  endTime?: number
}

export interface CombatAction {
  type: 'attack' | 'block' | 'dodge'
  damage?: number
  blocked?: boolean
  dodged?: boolean
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
  direction?: string
  stats?: {
    level: number
    experience: number
    experienceToNext: number
    health: number
    maxHealth: number
    attack: number
    defense: number
    speed: number
  }
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
  private onPlayerMove: (playerId: string, x: number, y: number, direction?: string) => void
  private onChatMessage: (message: ChatMessage) => void
  private onCombatChallenge?: (challenge: CombatChallenge) => void
  private onCombatStateUpdate?: (combatState: CombatState) => void
  private onXPUpdate?: (xpUpdate: XPUpdate) => void
  private heartbeatInterval: NodeJS.Timeout | null = null
  private keepAliveInterval: NodeJS.Timeout | null = null
  private currentPosition: { x: number; y: number; direction: string } | null = null
  private connectionTimeout: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 30000 // 30 segundos (muy reducido para evitar spam)
  private readonly KEEPALIVE_INTERVAL = 60000 // 60 segundos (muy tolerante)
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
    onPlayerMove: (playerId: string, x: number, y: number, direction?: string) => void,
    onChatMessage: (message: ChatMessage) => void,
    onCombatChallenge?: (challenge: CombatChallenge) => void,
    onCombatStateUpdate?: (combatState: CombatState) => void,
    onXPUpdate?: (xpUpdate: XPUpdate) => void,
  ) {
    this.onStateUpdate = onStateUpdate
    this.onPlayerJoin = onPlayerJoin
    this.onPlayerLeave = onPlayerLeave
    this.onPlayerMove = onPlayerMove
    this.onChatMessage = onChatMessage
    this.onCombatChallenge = onCombatChallenge
    this.onCombatStateUpdate = onCombatStateUpdate
    this.onXPUpdate = onXPUpdate
  }

  async connect(): Promise<void> {
    if (this.isConnected || this.isReconnecting) {
      return
    }

    this.isReconnecting = true
    this.connectionAttempts++

    return new Promise((resolve, reject) => {
      try {
        console.log(`🌍 Connecting to server... (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`, this.SERVER_URL)
        
        // Clear any existing connection
        if (this.socket) {
          this.socket.disconnect()
          this.socket = null
        }

        this.socket = io(this.SERVER_URL, {
          transports: ['polling', 'websocket'],
          timeout: this.CONNECTION_TIMEOUT,
          forceNew: false, // Reuse existing connection if possible
          reconnection: false, // DISABLED: Automatic reconnection causes issues
          autoConnect: false, // Manual connection control
          upgrade: true,
          rememberUpgrade: true, // Remember successful transport
          withCredentials: false
        })

        this.setupEventListeners()
        
        // Connect manually
        this.socket.connect()
        
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

    console.log('✅ Connected to server')
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
      console.log(`🎮 Player ${player.name} joined`)
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

    // Desafío de combate
    this.socket.on('combatChallenge', (challenge: CombatChallenge) => {
      console.log(`⚔️ Combat challenge from ${challenge.challengerName}`)
      if (this.onCombatChallenge) {
        this.onCombatChallenge(challenge)
      }
    })

    // Estado de combate actualizado
    this.socket.on('combatStateUpdate', (combatState: CombatState) => {
      console.log(`⚔️ Estado de combate actualizado: ${combatState.status}`)
      if (this.onCombatStateUpdate) {
        this.onCombatStateUpdate(combatState)
      }
    })

    this.socket.on('xpUpdate', (xpUpdate: XPUpdate) => {
      console.log(`📊 XP Update received: +${xpUpdate.xpGained} XP, Level ${xpUpdate.newStats.level}`)
      if (this.onXPUpdate) {
        this.onXPUpdate(xpUpdate)
      }
    })

    // Sistema de playerMoved deshabilitado temporalmente para estabilidad

    // Manejar limpieza de mensajes de jugadores
    this.socket.on('playerMessageCleared', (playerId: string) => {
      // Este evento se puede usar para limpiar mensajes específicos si es necesario
      console.log(`💬 Message cleared for player: ${playerId}`)
    })

    // Desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason)
      this.isConnected = false
      this.isReconnecting = false
      
      // Let Socket.IO handle reconnection automatically
      console.log('🔌 Connection lost - Socket.IO will attempt to reconnect automatically')
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
        // Enviar heartbeat con posición actual del jugador
        this.socket.emit('heartbeat', {
          x: this.currentPosition?.x || 0,
          y: this.currentPosition?.y || 0,
          direction: this.currentPosition?.direction || 'down'
        })
        console.log('💓 Heartbeat enviado con posición')
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
      console.log(`🎮 Joining game as ${player.name}`)
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

  updatePlayerPosition(x: number, y: number, direction?: string): void {
    // Solo actualizar posición local, se enviará en el próximo heartbeat
    this.currentPosition = { x, y, direction: direction || 'down' }
  }

  sendChatMessage(message: string): void {
    if (this.socket && this.socket.connected && this.isConnected) {
      // Asegurar que el mensaje sea un string
      const messageText = typeof message === 'string' ? message : String(message);
      this.socket.emit('chatMessage', messageText)
    }
  }

  // Métodos de combate
  challengePlayer(challengedPlayerId: string): void {
    if (this.socket && this.socket.connected && this.isConnected) {
      this.socket.emit('challengePlayer', { challengedPlayerId })
      console.log(`⚔️ Challenging player ${challengedPlayerId}`)
    }
  }

  respondToChallenge(challengeId: string, accepted: boolean): void {
    if (this.socket && this.socket.connected && this.isConnected) {
      this.socket.emit('respondToChallenge', { challengeId, accepted })
      console.log(`⚔️ ${accepted ? 'Accepting' : 'Declining'} challenge ${challengeId}`)
    }
  }

  sendCombatAction(combatId: string, action: CombatAction): void {
    if (this.socket && this.socket.connected && this.isConnected) {
      this.socket.emit('combatAction', { combatId, action })
      console.log(`⚔️ Sending combat action: ${action.type}`)
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
    console.log('🔌 Disconnected from server')
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