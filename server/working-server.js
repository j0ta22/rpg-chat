const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Simple game state
const gameState = {
  players: {},
  lastUpdate: Date.now()
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Simple join game handler
  socket.on('joinGame', (playerData) => {
    console.log(`🎮 Player ${playerData.name} joined`);
    
    const player = {
      id: socket.id,
      ...playerData,
      lastSeen: Date.now()
    };
    
    gameState.players[socket.id] = player;
    gameState.lastUpdate = Date.now();
    
    // Send simple response
    socket.emit('gameState', gameState);
    
    // Notify other players
    socket.broadcast.emit('playerJoined', player);
  });
  
  // Simple heartbeat
  socket.on('heartbeat', (data) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].lastSeen = Date.now();
      
      // Update position if provided
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        gameState.players[socket.id].x = data.x;
        gameState.players[socket.id].y = data.y;
        gameState.players[socket.id].direction = data.direction || 'down';
        console.log(`💓 Heartbeat with position: Player ${gameState.players[socket.id].name} at (${data.x}, ${data.y})`);
      }
      
      socket.emit('heartbeatAck');
    }
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      console.log(`👋 Player ${gameState.players[socket.id].name} disconnected`);
      delete gameState.players[socket.id];
      gameState.lastUpdate = Date.now();
      
      // Notify other players
      socket.broadcast.emit('playerLeft', socket.id);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Working server running on port ${PORT}`);
});
