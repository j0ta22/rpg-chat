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

// Almacenamiento de combates y desafíos
let combatChallenges = {};
let combatStates = {};

// Limpiar jugadores inactivos cada 60 segundos (más tolerante)
setInterval(() => {
  const now = Date.now();
  const timeout = 60000; // 60 segundos
  
  Object.keys(gameState.players).forEach(playerId => {
    if (now - gameState.players[playerId].lastSeen > timeout) {
      console.log(`👋 Player ${gameState.players[playerId].name} disconnected due to inactivity`);
      delete gameState.players[playerId];
    }
  });
  
  gameState.lastUpdate = now;
}, 60000);

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
  console.log(`🔌 Client connected: ${socket.id}`);

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
    
    console.log(`🎮 Player ${player.name} joined. Total: ${Object.keys(gameState.players).length}`);
    
    // Notificar a todos los clientes
    io.emit('playerJoined', player);
    io.emit('gameState', gameState);
  });

  // Manejar actualización de posición
  socket.on('updatePosition', (positionData) => {
    if (gameState.players[socket.id]) {
      try {
        gameState.players[socket.id].x = positionData.x;
        gameState.players[socket.id].y = positionData.y;
        gameState.players[socket.id].direction = positionData.direction || 'down'; // Incluir dirección
        gameState.players[socket.id].lastSeen = Date.now();
        gameState.lastUpdate = Date.now();
        
        console.log(`🔄 Player ${gameState.players[socket.id].name} moved to (${positionData.x}, ${positionData.y}) direction: ${positionData.direction || 'down'}`);
        
        // Notificar a todos los clientes excepto al que envió la actualización
        socket.broadcast.emit('playerMoved', {
          playerId: socket.id,
          x: positionData.x,
          y: positionData.y,
          direction: positionData.direction || 'down'
        });
        
        // Enviar el estado completo para sincronización (siempre para mantener visibilidad)
        socket.broadcast.emit('gameState', gameState);
        
        // También enviar al cliente que se movió para confirmación
        socket.emit('gameState', gameState);
      } catch (error) {
        console.error('❌ Error procesando actualización de posición:', error);
      }
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
      
      console.log(`👋 Player ${player.name} disconnected`);
      
      // Notificar a todos los clientes
      io.emit('playerLeft', socket.id);
      io.emit('gameState', gameState);
    }
  });

  // Heartbeat para mantener conexión activa
  socket.on('heartbeat', () => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].lastSeen = Date.now();
      gameState.lastUpdate = Date.now();
      
      // Enviar estado actualizado para mantener sincronización
      socket.emit('gameState', gameState);
    }
  });

  // ===== EVENTOS DE COMBATE =====

  // Manejar desafío de combate
  socket.on('challengePlayer', (data) => {
    const challenger = gameState.players[socket.id];
    const challenged = gameState.players[data.challengedPlayerId];
    
    if (!challenger || !challenged) {
      console.log('❌ Challenge failed: player not found');
      return;
    }

    // Verificar distancia (80 píxeles)
    const distance = Math.sqrt(
      Math.pow(challenger.x - challenged.x, 2) + Math.pow(challenger.y - challenged.y, 2)
    );
    
    if (distance > 80) {
      console.log('❌ Challenge failed: players too far apart');
      return;
    }

    // Crear desafío
    const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const challenge = {
      id: challengeId,
      challengerId: socket.id,
      challengerName: challenger.name,
      challengedId: data.challengedPlayerId,
      challengedName: challenged.name,
      timestamp: Date.now(),
      status: 'pending'
    };

    combatChallenges[challengeId] = challenge;
    
    console.log(`⚔️ Challenge created: ${challenger.name} challenges ${challenged.name}`);
    
    // Enviar desafío al jugador desafiado
    io.to(data.challengedPlayerId).emit('combatChallenge', challenge);
    
    // Timeout del desafío (30 segundos)
    setTimeout(() => {
      if (combatChallenges[challengeId] && combatChallenges[challengeId].status === 'pending') {
        combatChallenges[challengeId].status = 'expired';
        io.to(data.challengedPlayerId).emit('combatChallenge', combatChallenges[challengeId]);
        delete combatChallenges[challengeId];
        console.log(`⚔️ Challenge expired: ${challengeId}`);
      }
    }, 30000);
  });

  // Manejar respuesta al desafío
  socket.on('respondToChallenge', (data) => {
    const challenge = combatChallenges[data.challengeId];
    
    if (!challenge) {
      console.log('❌ Challenge response failed: challenge not found');
      return;
    }

    if (challenge.challengedId !== socket.id) {
      console.log('❌ Challenge response failed: not the challenged player');
      return;
    }

    challenge.status = data.accepted ? 'accepted' : 'declined';
    
    console.log(`⚔️ Challenge ${data.accepted ? 'accepted' : 'declined'}: ${challenge.challengerName} vs ${challenge.challengedName}`);
    
    // Notificar a ambos jugadores
    io.to(challenge.challengerId).emit('combatChallenge', challenge);
    io.to(challenge.challengedId).emit('combatChallenge', challenge);
    
    if (data.accepted) {
      // Crear estado de combate
      const combatId = `combat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const challenger = gameState.players[challenge.challengerId];
      const challenged = gameState.players[challenge.challengedId];
      
      const combatState = {
        id: combatId,
        challenger: {
          id: challenger.id,
          name: challenger.name,
          avatar: challenger.avatar,
          health: 100,
          maxHealth: 100,
          isAlive: true
        },
        challenged: {
          id: challenged.id,
          name: challenged.name,
          avatar: challenged.avatar,
          health: 100,
          maxHealth: 100,
          isAlive: true
        },
        currentTurn: challenge.challengerId,
        turns: [],
        status: 'active',
        startTime: Date.now()
      };

      combatStates[combatId] = combatState;
      
      console.log(`⚔️ Combat started: ${combatId}`);
      
      // Notificar a ambos jugadores
      io.to(challenge.challengerId).emit('combatStateUpdate', combatState);
      io.to(challenge.challengedId).emit('combatStateUpdate', combatState);
    }
    
    // Limpiar desafío
    delete combatChallenges[data.challengeId];
  });

  // Manejar acción de combate
  socket.on('combatAction', (data) => {
    const combatState = combatStates[data.combatId];
    
    if (!combatState) {
      console.log('❌ Combat action failed: combat not found');
      return;
    }

    if (combatState.status !== 'active') {
      console.log('❌ Combat action failed: combat not active');
      return;
    }

    if (combatState.currentTurn !== socket.id) {
      console.log('❌ Combat action failed: not player turn');
      return;
    }

    // Procesar acción
    const action = data.action;
    const isChallenger = socket.id === combatState.challenger.id;
    const attacker = isChallenger ? combatState.challenger : combatState.challenged;
    const target = isChallenger ? combatState.challenged : combatState.challenger;
    
    let processedAction = { ...action };
    
    if (action.type === 'attack') {
      // Calcular daño
      const baseDamage = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
      const isBlocked = Math.random() < 0.2; // 20% chance de bloqueo automático
      const isDodged = Math.random() < 0.3; // 30% chance de esquivar
      
      if (!isDodged) {
        const finalDamage = isBlocked ? Math.floor(baseDamage * 0.5) : baseDamage;
        target.health = Math.max(0, target.health - finalDamage);
        target.isAlive = target.health > 0;
        
        processedAction.damage = finalDamage;
        processedAction.blocked = isBlocked;
        processedAction.dodged = false;
      } else {
        processedAction.dodged = true;
        processedAction.damage = 0;
      }
    }
    
    // Agregar turno
    const turn = {
      playerId: socket.id,
      action: processedAction,
      timestamp: Date.now()
    };
    
    combatState.turns.push(turn);
    
    // Cambiar turno
    combatState.currentTurn = isChallenger ? combatState.challenged.id : combatState.challenger.id;
    
    // Verificar si alguien ganó
    if (!combatState.challenger.isAlive) {
      combatState.winner = combatState.challenged.id;
      combatState.status = 'finished';
      combatState.endTime = Date.now();
    } else if (!combatState.challenged.isAlive) {
      combatState.winner = combatState.challenger.id;
      combatState.status = 'finished';
      combatState.endTime = Date.now();
    }
    
    console.log(`⚔️ Combat action: ${attacker.name} ${action.type}${processedAction.damage ? ` (${processedAction.damage} damage)` : ''}`);
    
    // Notificar a ambos jugadores
    io.to(combatState.challenger.id).emit('combatStateUpdate', combatState);
    io.to(combatState.challenged.id).emit('combatStateUpdate', combatState);
    
    // Limpiar combate si terminó
    if (combatState.status === 'finished') {
      // Enviar mensaje global de victoria
      const winner = combatState.winner === combatState.challenger.id ? combatState.challenger : combatState.challenged;
      const loser = combatState.winner === combatState.challenger.id ? combatState.challenged : combatState.challenger;
      
      const victoryMessage = {
        id: Math.random().toString(36).substring(2, 15),
        text: `A fierce brawl broke out at the Drunken Monkey Tavern! ${winner.name} emerged victorious, while ${loser.name} was defeated.`,
        timestamp: Date.now(),
        playerId: 'system',
        playerName: 'System'
      };
      
      // Enviar mensaje global a todos los jugadores
      io.emit('chatMessage', victoryMessage);
      
      console.log(`🏆 Combat finished: ${winner.name} defeated ${loser.name}`);
      console.log(`📢 Global message sent: "${victoryMessage.text}"`);
      
      setTimeout(() => {
        delete combatStates[data.combatId];
        console.log(`⚔️ Combat finalized: ${data.combatId}`);
      }, 5000);
    }
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 WebSocket available at ws://localhost:${PORT}`);
});
