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

// Player stats and XP system
let playerStats = {};

// XP System Constants (matching frontend)
const XP_CONSTANTS = {
  BASE_XP_REQUIRED: 100,
  XP_MULTIPLIER: 1.5,
  MAX_LEVEL: 50,
  BASE_HEALTH: 100,
  BASE_ATTACK: 15,
  BASE_DEFENSE: 5,
  BASE_SPEED: 10,
  HEALTH_PER_LEVEL: 10,
  ATTACK_PER_LEVEL: 2,
  DEFENSE_PER_LEVEL: 1,
  SPEED_PER_LEVEL: 0.5,
  COMBAT_VICTORY_XP: 50,
  COMBAT_DEFEAT_XP: 10,
  FIRST_BLOOD_XP: 25,
  PERFECT_VICTORY_XP: 75,
};

// Helper function to add stats to game state
function addStatsToGameState(gameState, playerStats) {
  return {
    ...gameState,
    players: Object.keys(gameState.players).reduce((acc, playerId) => {
      acc[playerId] = {
        ...gameState.players[playerId],
        stats: playerStats[playerId]
      };
      return acc;
    }, {})
  };
}

// XP System Functions
function calculateXPRequired(level) {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += Math.floor(XP_CONSTANTS.BASE_XP_REQUIRED * Math.pow(XP_CONSTANTS.XP_MULTIPLIER, i - 2));
  }
  return totalXP;
}

function calculateXPToNext(currentLevel, currentXP) {
  const nextLevelXP = calculateXPRequired(currentLevel + 1);
  return nextLevelXP - currentXP;
}

function createInitialStats() {
  return {
    level: 1,
    experience: 0,
    experienceToNext: XP_CONSTANTS.BASE_XP_REQUIRED,
    health: XP_CONSTANTS.BASE_HEALTH,
    maxHealth: XP_CONSTANTS.BASE_HEALTH,
    attack: XP_CONSTANTS.BASE_ATTACK,
    defense: XP_CONSTANTS.BASE_DEFENSE,
    speed: XP_CONSTANTS.BASE_SPEED,
  };
}

function addExperience(stats, xpGained) {
  let newStats = { ...stats };
  let leveledUp = false;
  let levelsGained = 0;
  let levelUpReward = null;

  newStats.experience += xpGained;

  // Check for level ups
  while (newStats.level < XP_CONSTANTS.MAX_LEVEL) {
    const xpNeededForNext = calculateXPToNext(newStats.level, newStats.experience);
    
    if (xpNeededForNext <= 0) {
      // Level up!
      leveledUp = true;
      levelsGained++;
      
      // Calculate stat increases
      const healthIncrease = XP_CONSTANTS.HEALTH_PER_LEVEL;
      const attackIncrease = XP_CONSTANTS.ATTACK_PER_LEVEL;
      const defenseIncrease = XP_CONSTANTS.DEFENSE_PER_LEVEL;
      const speedIncrease = XP_CONSTANTS.SPEED_PER_LEVEL;
      
      // Apply stat increases
      newStats.level++;
      newStats.maxHealth += healthIncrease;
      newStats.health += healthIncrease; // Heal on level up
      newStats.attack += attackIncrease;
      newStats.defense += defenseIncrease;
      newStats.speed += speedIncrease;
      
      // Store level up reward for UI display
      levelUpReward = {
        healthIncrease,
        attackIncrease,
        defenseIncrease,
        speedIncrease
      };
      
      // Update XP to next level
      newStats.experienceToNext = calculateXPToNext(newStats.level, newStats.experience);
    } else {
      // No more level ups possible
      newStats.experienceToNext = xpNeededForNext;
      break;
    }
  }

  return { newStats, leveledUp, levelsGained, levelUpReward };
}

function calculateCombatXP(isVictory, damageDealt, damageTaken, turnsTaken, isFirstBlood = false) {
  let xp = 0;

  if (isVictory) {
    xp += XP_CONSTANTS.COMBAT_VICTORY_XP;
    
    // Bonus for perfect victory (no damage taken)
    if (damageTaken === 0) {
      xp += XP_CONSTANTS.PERFECT_VICTORY_XP;
    }
    
    // Bonus for first blood
    if (isFirstBlood) {
      xp += XP_CONSTANTS.FIRST_BLOOD_XP;
    }
    
    // Bonus for quick victory (fewer turns)
    if (turnsTaken <= 3) {
      xp += 25;
    }
  } else {
    // Consolation XP for defeat
    xp += XP_CONSTANTS.COMBAT_DEFEAT_XP;
    
    // Bonus XP based on damage dealt
    xp += Math.floor(damageDealt / 10);
  }

  return xp;
}

// Sistema de throttling simple para estabilidad
const lastPositionUpdate = new Map();
const POSITION_UPDATE_INTERVAL = 300; // 300ms entre actualizaciones

// Limpiar jugadores inactivos cada 60 segundos (más tolerante)
setInterval(() => {
  const now = Date.now();
  const timeout = 120000; // 120 segundos (2 minutos) - más tolerante
  
  Object.keys(gameState.players).forEach(playerId => {
    if (now - gameState.players[playerId].lastSeen > timeout) {
      console.log(`👋 Player ${gameState.players[playerId].name} disconnected due to inactivity`);
      delete gameState.players[playerId];
      delete playerStats[playerId]; // Clean up player stats
      lastPositionUpdate.delete(playerId); // Clean up throttle
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
  socket.emit('gameState', addStatsToGameState(gameState, playerStats));

  // Manejar unirse al juego
  socket.on('joinGame', (playerData) => {
    const player = {
      id: socket.id,
      ...playerData,
      lastSeen: Date.now()
    };
    
    gameState.players[socket.id] = player;
    gameState.lastUpdate = Date.now();
    
    // Initialize player stats if not exists
    if (!playerStats[socket.id]) {
      playerStats[socket.id] = createInitialStats();
      console.log(`📊 Initialized stats for player ${player.name} (Level ${playerStats[socket.id].level})`);
    }
    
    console.log(`🎮 Player ${player.name} joined. Total: ${Object.keys(gameState.players).length}`);
    
    // Send initial stats to the player
    if (playerStats[socket.id]) {
      socket.emit('xpUpdate', {
        xpGained: 0,
        newStats: playerStats[socket.id],
        leveledUp: false,
        levelsGained: 0
      });
      console.log(`📊 Sent initial stats to ${player.name}: Level ${playerStats[socket.id].level}`);
    }
    
    // Agregar stats al objeto del jugador antes de enviarlo
    const playerWithStats = {
      ...player,
      stats: playerStats[socket.id]
    };
    
    // Notificar a todos los clientes
    io.emit('playerJoined', playerWithStats);
    
    // Enviar estado del juego con stats a todos
    io.emit('gameState', addStatsToGameState(gameState, playerStats));
  });

  // DISABLED: updatePosition causes immediate disconnections
  // socket.on('updatePosition', (positionData) => {
  //   if (gameState.players[socket.id]) {
  //     try {
  //       // Actualizar posición del jugador
  //       gameState.players[socket.id].x = positionData.x;
  //       gameState.players[socket.id].y = positionData.y;
  //       gameState.players[socket.id].direction = positionData.direction || 'down';
  //       gameState.players[socket.id].lastSeen = Date.now();
  //       gameState.lastUpdate = Date.now();
  //       
  //       console.log(`🔄 Player ${gameState.players[socket.id].name} moved to (${positionData.x}, ${positionData.y}) direction: ${positionData.direction || 'down'}`);
  //       
  //       // NO enviar gameState para evitar desconexiones
  //       // socket.broadcast.emit('gameState', addStatsToGameState(gameState, playerStats));
  //     } catch (error) {
  //       console.error('❌ Error procesando actualización de posición:', error);
  //     }
  //   }
  // });

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
      // No enviar estado completo en cada mensaje de chat
      
      // Limpiar el mensaje después de 10 segundos
      setTimeout(() => {
        if (gameState.players[socket.id]) {
          gameState.players[socket.id].currentMessage = undefined;
          gameState.lastUpdate = Date.now();
          // Solo enviar actualización del mensaje, no el estado completo
          socket.broadcast.emit('playerMessageCleared', socket.id);
        }
      }, 10000);
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      const player = gameState.players[socket.id];
      delete gameState.players[socket.id];
      delete playerStats[socket.id]; // Clean up player stats
      lastPositionUpdate.delete(socket.id); // Clean up throttle
      gameState.lastUpdate = Date.now();
      
      console.log(`👋 Player ${player.name} disconnected`);
      
      // Notificar a todos los clientes
      io.emit('playerLeft', socket.id);
      io.emit('gameState', addStatsToGameState(gameState, playerStats));
    }
  });

  // Heartbeat para mantener conexión activa
  socket.on('heartbeat', (data) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].lastSeen = Date.now();
      gameState.lastUpdate = Date.now();
      
      // Si el cliente envía posición en el heartbeat, actualizarla
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        gameState.players[socket.id].x = data.x;
        gameState.players[socket.id].y = data.y;
        gameState.players[socket.id].direction = data.direction || 'down';
        console.log(`💓 Heartbeat with position: Player ${gameState.players[socket.id].name} at (${data.x}, ${data.y})`);
      }
      
      // Solo enviar confirmación de heartbeat, no el estado completo
      socket.emit('heartbeatAck');
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
      
      // Get player stats
      const challengerStats = playerStats[challenge.challengerId] || createInitialStats();
      const challengedStats = playerStats[challenge.challengedId] || createInitialStats();
      
      const combatState = {
        id: combatId,
        challenger: {
          id: challenger.id,
          name: challenger.name,
          avatar: challenger.avatar,
          health: challengerStats.health,
          maxHealth: challengerStats.maxHealth,
          isAlive: true,
          stats: {
            level: challengerStats.level,
            attack: challengerStats.attack,
            defense: challengerStats.defense,
            speed: challengerStats.speed
          }
        },
        challenged: {
          id: challenged.id,
          name: challenged.name,
          avatar: challenged.avatar,
          health: challengedStats.health,
          maxHealth: challengedStats.maxHealth,
          isAlive: true,
          stats: {
            level: challengedStats.level,
            attack: challengedStats.attack,
            defense: challengedStats.defense,
            speed: challengedStats.speed
          }
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
      
      // Calculate and award XP
      const turnsTaken = combatState.turns.length;
      const winnerStats = playerStats[winner.id];
      const loserStats = playerStats[loser.id];
      
      if (winnerStats && loserStats) {
        // Calculate damage dealt by each player
        let winnerDamageDealt = 0;
        let loserDamageDealt = 0;
        let winnerDamageTaken = 0;
        let loserDamageTaken = 0;
        let isFirstBlood = false;
        
        combatState.turns.forEach((turn, index) => {
          if (turn.action.damage) {
            if (turn.playerId === winner.id) {
              winnerDamageDealt += turn.action.damage;
              loserDamageTaken += turn.action.damage;
              if (index === 0) isFirstBlood = true;
            } else {
              loserDamageDealt += turn.action.damage;
              winnerDamageTaken += turn.action.damage;
            }
          }
        });
        
        // Award XP to winner
        const winnerXP = calculateCombatXP(true, winnerDamageDealt, winnerDamageTaken, turnsTaken, isFirstBlood);
        const winnerResult = addExperience(winnerStats, winnerXP);
        playerStats[winner.id] = winnerResult.newStats;
        
        // Award XP to loser
        const loserXP = calculateCombatXP(false, loserDamageDealt, loserDamageTaken, turnsTaken);
        const loserResult = addExperience(loserStats, loserXP);
        playerStats[loser.id] = loserResult.newStats;
        
        console.log(`📊 XP Awarded - ${winner.name}: +${winnerXP} XP (Level ${winnerResult.newStats.level})`);
        console.log(`📊 XP Awarded - ${loser.name}: +${loserXP} XP (Level ${loserResult.newStats.level})`);
        
        // Send XP updates to players
        io.to(winner.id).emit('xpUpdate', {
          xpGained: winnerXP,
          newStats: winnerResult.newStats,
          leveledUp: winnerResult.leveledUp,
          levelsGained: winnerResult.levelsGained,
          levelUpReward: winnerResult.levelUpReward
        });
        
        io.to(loser.id).emit('xpUpdate', {
          xpGained: loserXP,
          newStats: loserResult.newStats,
          leveledUp: loserResult.leveledUp,
          levelsGained: loserResult.levelsGained,
          levelUpReward: loserResult.levelUpReward
        });
        
        // Send level up notifications if applicable
        if (winnerResult.leveledUp) {
          const levelUpMessage = {
            id: Math.random().toString(36).substring(2, 15),
            text: `🎉 ${winner.name} reached level ${winnerResult.newStats.level}!`,
            timestamp: Date.now(),
            playerId: 'system',
            playerName: 'System'
          };
          io.emit('chatMessage', levelUpMessage);
        }
        
        if (loserResult.leveledUp) {
          const levelUpMessage = {
            id: Math.random().toString(36).substring(2, 15),
            text: `🎉 ${loser.name} reached level ${loserResult.newStats.level}!`,
            timestamp: Date.now(),
            playerId: 'system',
            playerName: 'System'
          };
          io.emit('chatMessage', levelUpMessage);
        }
      }
      
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
