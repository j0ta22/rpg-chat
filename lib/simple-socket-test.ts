import { io, Socket } from 'socket.io-client';

export class SimpleSocketTest {
  private socket: Socket | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Attempting to connect to server...');
        
        this.socket = io('http://localhost:3001', {
          transports: ['websocket'],
          autoConnect: true,
          reconnection: false
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to server');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from server:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);

      } catch (error) {
        console.error('❌ Error creating socket:', error);
        reject(error);
      }
    });
  }

  joinGame(playerData: any): void {
    if (this.socket && this.isConnected) {
      console.log('🎮 Sending joinGame event');
      this.socket.emit('joinGame', playerData);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}
