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
  }
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
  });
  
  // Simple heartbeat
  socket.on('heartbeat', () => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].lastSeen = Date.now();
      socket.emit('heartbeatAck');
    }
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      console.log(`👋 Player ${gameState.players[socket.id].name} disconnected`);
      delete gameState.players[socket.id];
      gameState.lastUpdate = Date.now();
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
});
