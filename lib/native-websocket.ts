export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: string;
  lastSeen: number;
  avatar?: string;
  color?: string;
  stats?: {
    level: number;
    experience: number;
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    speed: number;
  };
}

export interface GameState {
  players: Record<string, Player>;
  lastUpdate: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  text: string; // Alias for compatibility
  timestamp: number;
}

export class NativeWebSocketClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentPosition: { x: number; y: number; direction: string } | null = null;
  private playerId = '';

  constructor(
    private onGameState: (gameState: GameState) => void,
    private onPlayerJoined: (player: Player) => void,
    private onPlayerLeft: (playerId: string) => void,
    private onChatMessage: (message: ChatMessage) => void,
    private onXPUpdate?: (xpUpdate: any) => void,
    private onGoldUpdate?: (goldUpdate: { delta: number }) => void,
    private onPlayerId?: (playerId: string) => void,
    private onPlayerMoved?: (data: { playerId: string; x: number; y: number; direction: string }) => void,
    private onCombatChallenge?: (challenge: any) => void,
    private onCombatStateUpdate?: (combatState: any) => void,
    private onCombatChallengeDeclined?: (data: any) => void,
    private onItemDrop?: (itemDrop: any) => void
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to WebSocket server...');
        
        // Use environment variable for WebSocket URL, fallback to localhost for development
        let wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
        
        // Ensure the URL uses wss:// for production and ws:// for development
        if (wsUrl.startsWith('https://')) {
          wsUrl = wsUrl.replace('https://', 'wss://');
        } else if (wsUrl.startsWith('http://')) {
          wsUrl = wsUrl.replace('http://', 'ws://');
        }
        
        console.log('🔌 WebSocket URL:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('✅ Connected to WebSocket server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          console.log('💓 Heartbeat started');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ Error parsing message:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          
          // DISABLED: No automatic reconnection to prevent connection loops
          console.log('🔌 Connection closed - no automatic reconnection');
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };
        
      } catch (error) {
        console.error('❌ Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleMessage(data: any) {
    try {
      switch (data.type) {
        case 'gameState':
          console.log('📥 Received gameState');
          this.onGameState(data.payload);
          break;
        case 'playerJoined':
          console.log('📥 Received playerJoined');
          this.onPlayerJoined(data.payload);
          break;
        case 'playerLeft':
          console.log('📥 Received playerLeft');
          this.onPlayerLeft(data.payload);
          break;
        case 'chatMessage':
          console.log('📥 Received chatMessage');
          this.onChatMessage(data.payload);
          break;
        case 'xpUpdate':
          console.log('📥 Received xpUpdate');
          if (this.onXPUpdate) {
            this.onXPUpdate(data.payload);
          }
          break;
        case 'goldUpdate':
          console.log('📥 Received goldUpdate:', data.payload);
          if (this.onGoldUpdate) {
            this.onGoldUpdate(data.payload);
          }
          break;
        case 'heartbeatAck':
          console.log('📥 Received heartbeatAck');
          break;
        case 'playerId':
          console.log('📥 Received playerId:', data.payload.playerId);
          this.playerId = data.payload.playerId;
          if (this.onPlayerId) {
            this.onPlayerId(data.payload.playerId);
          }
          break;
        case 'playerMoved':
          console.log('📥 Received playerMoved:', data.payload);
          if (this.onPlayerMoved) {
            this.onPlayerMoved(data.payload);
          }
          break;
        case 'combatChallenge':
          console.log('📥 Received combatChallenge:', data.payload);
          if (this.onCombatChallenge) {
            this.onCombatChallenge(data.payload);
          }
          break;
        case 'combatStateUpdate':
          console.log('📥 Received combatStateUpdate:', data.payload);
          if (this.onCombatStateUpdate) {
            this.onCombatStateUpdate(data.payload);
          }
          break;
        case 'combatChallengeDeclined':
          console.log('📥 Received combatChallengeDeclined:', data.payload);
          if (this.onCombatChallengeDeclined) {
            this.onCombatChallengeDeclined(data.payload);
          }
          break;
        case 'itemDrop':
          console.log('📥 Received itemDrop:', data.payload);
          if (this.onItemDrop) {
            this.onItemDrop(data.payload);
          }
          break;
        default:
          console.log('📥 Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  }

  private sendMessage(type: string, payload: any) {
    if (this.ws && this.isConnected) {
      console.log(`📤 Sending message: ${type}`, payload);
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('⚠️ Cannot send message - WebSocket not connected');
    }
  }

  joinGame(playerData: any): void {
    console.log('🎮 Sending joinGame with data:', playerData);
    this.sendMessage('joinGame', playerData);
  }

  updatePlayerPosition(x: number, y: number, direction?: string): void {
    this.currentPosition = { x, y, direction: direction || 'down' };
    
    // Send immediate position update if connected
    if (this.isConnected) {
      this.sendMessage('updatePosition', {
        x: x,
        y: y,
        direction: direction || 'down'
      });
    }
  }

  sendChatMessage(message: string): void {
    this.sendMessage('chatMessage', { message });
  }

  challengePlayer(challengedPlayerId: string): void {
    this.sendMessage('challengePlayer', { challengedPlayerId });
  }

  respondToChallenge(challengeId: string, accepted: boolean): void {
    this.sendMessage('respondToChallenge', { challengeId, accepted });
  }

  sendCombatAction(combatId: string, action: any): void {
    this.sendMessage('combatAction', { combatId, action });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        const heartbeatData = this.currentPosition ? {
          x: this.currentPosition.x,
          y: this.currentPosition.y,
          direction: this.currentPosition.direction
        } : {};
        
        this.sendMessage('heartbeat', heartbeatData);
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) { // 1% of the time
          console.log('💓 Heartbeat sent');
        }
      }
    }, 200); // 200ms for responsive updates (5 times per second)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect(): void {
    console.log('🔌 Disconnect called - closing WebSocket');
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  isConnectedToServer(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  getPlayerId(): string {
    return this.playerId || '';
  }
}
