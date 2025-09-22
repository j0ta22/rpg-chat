const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: NODE_ENV === 'production' 
      ? ["https://dancing-banoffee-3f1566.netlify.app", "https://dancing-banoffee-3f1566.netlify.app/", "http://localhost:3000"] 
      : "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Try polling first for better compatibility
  pingTimeout: 30000, // 30 seconds
  pingInterval: 15000, // 15 seconds
  upgradeTimeout: 10000, // 10 seconds
  allowEIO3: true, // Allow Engine.IO v3 clients
  allowUpgrades: true,
  perMessageDeflate: false // Disable compression for better performance
});

// Middleware
app.use(cors());
app.use(express.json());

// Almacenamiento en memoria del estado del juego
let gameState = {
  players: {},
  lastUpdate: Date.now()
};

// Limpiar jugadores inactivos cada 30 segundos
setInterval(() => {
  const now = Date.now();
  const timeout = 30000; // 30 segundos
  
  Object.keys(gameState.players).forEach(playerId => {
    if (now - gameState.players[playerId].lastSeen > timeout) {
      console.log(`👋 Jugador ${gameState.players[playerId].name} desconectado por inactividad`);
      delete gameState.players[playerId];
    }
  });
  
  gameState.lastUpdate = now;
}, 30000);

// Health check endpoint para Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    players: Object.keys(gameState.players).length
  });
});

// Endpoint de prueba para verificar conectividad
app.get('/test', (req, res) => {
  res.status(200).json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    port: PORT
  });
});

// Keep-alive endpoint para mantener el servidor despierto
app.get('/keepalive', (req, res) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    players: Object.keys(gameState.players).length
  });
});

// API REST endpoints
app.get('/api/state', (req, res) => {
  res.json(gameState);
});

app.post('/api/state', (req, res) => {
  gameState = { ...gameState, ...req.body, lastUpdate: Date.now() };
  res.json({ success: true });
});

app.delete('/api/players', (req, res) => {
  gameState.players = {};
  gameState.lastUpdate = Date.now();
  res.json({ success: true });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Enviar estado actual al cliente que se conecta
  socket.emit('gameState', gameState);

  // Manejar unirse al juego
  socket.on('joinGame', (playerData) => {
    const player = {
      id: socket.id,
      ...playerData,
      lastSeen: Date.now()
    };
    
    gameState.players[socket.id] = player;
    gameState.lastUpdate = Date.now();
    
    console.log(`🎮 Jugador ${player.name} se unió. Total: ${Object.keys(gameState.players).length}`);
    
    // Notificar a todos los clientes
    io.emit('playerJoined', player);
    io.emit('gameState', gameState);
  });

  // Manejar actualización de posición
  socket.on('updatePosition', (positionData) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].x = positionData.x;
      gameState.players[socket.id].y = positionData.y;
      gameState.players[socket.id].lastSeen = Date.now();
      gameState.lastUpdate = Date.now();
      
      // Notificar a todos los clientes excepto al que envió la actualización
      socket.broadcast.emit('playerMoved', {
        playerId: socket.id,
        x: positionData.x,
        y: positionData.y
      });
      
      // También enviar el estado completo para sincronización
      socket.broadcast.emit('gameState', gameState);
    }
  });

  // Manejar mensajes de chat
  socket.on('chatMessage', (messageData) => {
    if (gameState.players[socket.id]) {
      // Asegurar que messageData sea un string
      const messageText = typeof messageData === 'string' ? messageData : String(messageData);
      
      const message = {
        id: Math.random().toString(36).substring(2, 15),
        text: messageText,
        timestamp: Date.now(),
        playerId: socket.id,
        playerName: gameState.players[socket.id].name
      };
      
      // Guardar el mensaje en el estado del jugador
      gameState.players[socket.id].currentMessage = message;
      gameState.players[socket.id].lastSeen = Date.now();
      gameState.lastUpdate = Date.now();
      
      // Notificar a todos los clientes
      io.emit('chatMessage', message);
      io.emit('gameState', gameState); // Enviar estado actualizado
      
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => {
        if (gameState.players[socket.id]) {
          gameState.players[socket.id].currentMessage = undefined;
          gameState.lastUpdate = Date.now();
          io.emit('gameState', gameState);
        }
      }, 5000);
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      const player = gameState.players[socket.id];
      delete gameState.players[socket.id];
      gameState.lastUpdate = Date.now();
      
      console.log(`👋 Jugador ${player.name} desconectado`);
      
      // Notificar a todos los clientes
      io.emit('playerLeft', socket.id);
      io.emit('gameState', gameState);
    }
  });

  // Heartbeat para mantener conexión activa
  socket.on('heartbeat', () => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].lastSeen = Date.now();
    }
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 WebSocket disponible en ws://localhost:${PORT}`);
});
