const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Game state
const gameState = {
  players: {},
  lastUpdate: Date.now()
};

const playerStats = {};
const combatStates = {};
const combatChallenges = {};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/',
  perMessageDeflate: false
});

// Helper function to broadcast to all clients
function broadcastToAll(type, payload) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Helper function to send to specific client
function sendToClient(client, type, payload) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type, payload }));
  }
}

// Initialize player stats
function createInitialStats() {
  return {
    level: 1,
    experience: 0,
    health: 100,
    maxHealth: 100,
    attack: 10,
    defense: 5,
    speed: 3
  };
}

wss.on('connection', (ws, req) => {
  console.log(`🔌 Client connected: ${req.socket.remoteAddress}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(ws, data);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    // Find and remove player
    Object.keys(gameState.players).forEach(playerId => {
      if (gameState.players[playerId].ws === ws) {
        const player = gameState.players[playerId];
        delete gameState.players[playerId];
        delete playerStats[playerId];
        gameState.lastUpdate = Date.now();
        
        console.log(`👋 Player ${player.name} disconnected`);
        
        // Notify other players
        broadcastToAll('playerLeft', playerId);
      }
    });
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

function handleMessage(ws, data) {
  const { type, payload } = data;
  
  switch (type) {
    case 'joinGame':
      handleJoinGame(ws, payload);
      break;
    case 'heartbeat':
      handleHeartbeat(ws, payload);
      break;
    case 'updatePosition':
      handleUpdatePosition(ws, payload);
      break;
    case 'chatMessage':
      handleChatMessage(ws, payload);
      break;
    case 'challengePlayer':
      handleChallengePlayer(ws, payload);
      break;
    case 'respondToChallenge':
      handleRespondToChallenge(ws, payload);
      break;
    case 'combatAction':
      handleCombatAction(ws, payload);
      break;
    default:
      console.log('📥 Unknown message type:', type);
  }
}

function handleJoinGame(ws, playerData) {
  const playerId = generatePlayerId();
  const player = {
    id: playerId,
    name: playerData.name,
    avatar: playerData.avatar || 'character_1',
    color: playerData.color || '#3b82f6',
    x: playerData.x || 100,
    y: playerData.y || 150,
    direction: 'down',
    lastSeen: Date.now(),
    ws: ws
  };
  
  gameState.players[playerId] = player;
  gameState.lastUpdate = Date.now();
  
  // Initialize player stats
  playerStats[playerId] = createInitialStats();
  
  console.log(`🎮 Player ${player.name} joined. Total: ${Object.keys(gameState.players).length}`);
  
  // Send player ID to the client
  sendToClient(ws, 'playerId', { playerId: playerId });
  
  // Send initial stats to the player
  sendToClient(ws, 'xpUpdate', {
    xpGained: 0,
    newStats: playerStats[playerId],
    leveledUp: false,
    levelsGained: 0
  });
  
  // Send game state to the player (without WebSocket objects)
  const cleanGameState = {
    players: Object.fromEntries(
      Object.entries(gameState.players).map(([id, player]) => [
        id, 
        {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          color: player.color,
          x: player.x,
          y: player.y,
          direction: player.direction,
          lastSeen: player.lastSeen,
          stats: playerStats[id] || null
        }
      ])
    ),
    lastUpdate: gameState.lastUpdate
  };
  sendToClient(ws, 'gameState', cleanGameState);
  
  // Notify other players
  const cleanPlayer = {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    color: player.color,
    x: player.x,
    y: player.y,
    direction: player.direction,
    lastSeen: player.lastSeen,
    stats: playerStats[playerId] || null
  };
  broadcastToAll('playerJoined', cleanPlayer);
  
  // Send updated game state to all players (including the new one)
  const updatedGameState = {
    players: Object.fromEntries(
      Object.entries(gameState.players).map(([id, player]) => [
        id, 
        {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          color: player.color,
          x: player.x,
          y: player.y,
          direction: player.direction,
          lastSeen: player.lastSeen,
          stats: playerStats[id] || null
        }
      ])
    ),
    lastUpdate: gameState.lastUpdate
  };
  broadcastToAll('gameState', updatedGameState);
}

function handleUpdatePosition(ws, data) {
  // Find player by WebSocket
  const playerId = findPlayerByWebSocket(ws);
  if (playerId && gameState.players[playerId]) {
    const oldX = gameState.players[playerId].x;
    const oldY = gameState.players[playerId].y;
    
    gameState.players[playerId].x = data.x;
    gameState.players[playerId].y = data.y;
    gameState.players[playerId].direction = data.direction || 'down';
    gameState.players[playerId].lastSeen = Date.now();
    
    // Only broadcast if position actually changed
    if (oldX !== data.x || oldY !== data.y) {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.01) { // 1% of the time
        console.log(`📍 Position update: Player ${gameState.players[playerId].name} at (${data.x}, ${data.y})`);
      }
      
      // Broadcast position update to all other players
      const positionUpdate = {
        playerId: playerId,
        x: data.x,
        y: data.y,
        direction: data.direction || 'down'
      };
      
      // Send to all players except the one who moved
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'playerMoved',
            payload: positionUpdate
          }));
        }
      });
    }
  }
}

function handleHeartbeat(ws, data) {
  // Find player by WebSocket
  const playerId = findPlayerByWebSocket(ws);
  if (playerId && gameState.players[playerId]) {
    gameState.players[playerId].lastSeen = Date.now();
    
    // Update position if provided (fallback for heartbeat)
    if (data && typeof data.x === 'number' && typeof data.y === 'number') {
      const oldX = gameState.players[playerId].x;
      const oldY = gameState.players[playerId].y;
      
      gameState.players[playerId].x = data.x;
      gameState.players[playerId].y = data.y;
      gameState.players[playerId].direction = data.direction || 'down';
      
      // Only broadcast if position actually changed
      if (oldX !== data.x || oldY !== data.y) {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) { // 1% of the time
          console.log(`💓 Heartbeat with position: Player ${gameState.players[playerId].name} at (${data.x}, ${data.y})`);
        }
        
        // Broadcast position update to all other players
        const positionUpdate = {
          playerId: playerId,
          x: data.x,
          y: data.y,
          direction: data.direction || 'down'
        };
        
        // Send to all players except the one who moved
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'playerMoved',
              payload: positionUpdate
            }));
          }
        });
      }
    }
    
    sendToClient(ws, 'heartbeatAck', {});
  }
}

function handleChatMessage(ws, data) {
  const playerId = findPlayerByWebSocket(ws);
  if (playerId && gameState.players[playerId]) {
    const message = {
      id: generateMessageId(),
      playerId: playerId,
      playerName: gameState.players[playerId].name,
      message: data.message,
      text: data.message, // Alias for compatibility
      timestamp: Date.now()
    };
    
    console.log(`💬 ${message.playerName}: ${message.message}`);
    
    // Broadcast to all players
    broadcastToAll('chatMessage', message);
  }
}

function handleChallengePlayer(ws, data) {
  const challengerId = findPlayerByWebSocket(ws);
  const challengedId = data.challengedPlayerId;
  
  if (challengerId && gameState.players[challengerId] && gameState.players[challengedId]) {
    const challenge = {
      id: generateChallengeId(),
      challenger: {
        id: challengerId,
        name: gameState.players[challengerId].name,
        stats: playerStats[challengerId]
      },
      challenged: {
        id: challengedId,
        name: gameState.players[challengedId].name,
        stats: playerStats[challengedId]
      },
      timestamp: Date.now()
    };
    
    // Store challenge
    combatChallenges[challenge.id] = challenge;
    
    console.log(`⚔️ ${challenge.challenger.name} challenges ${challenge.challenged.name}`);
    
    // Send challenge to challenged player
    const challengedWs = gameState.players[challengedId].ws;
    sendToClient(challengedWs, 'combatChallenge', challenge);
    
    // Set timeout to expire challenge
    setTimeout(() => {
      if (combatChallenges[challenge.id]) {
        delete combatChallenges[challenge.id];
        console.log(`⚔️ Challenge expired: ${challenge.challenger.name} vs ${challenge.challenged.name}`);
      }
    }, 30000); // 30 seconds timeout
  }
}

function handleRespondToChallenge(ws, data) {
  const playerId = findPlayerByWebSocket(ws);
  const challengeId = data.challengeId;
  const accepted = data.accepted;
  
  if (!playerId || !challengeId || !combatChallenges[challengeId]) {
    console.log('❌ Invalid challenge response');
    return;
  }
  
  const challenge = combatChallenges[challengeId];
  
  // Verify this is the challenged player
  if (challenge.challenged.id !== playerId) {
    console.log('❌ Not the challenged player');
    return;
  }
  
  console.log(`⚔️ Challenge response: ${accepted ? 'accepted' : 'declined'} by ${gameState.players[playerId].name}`);
  
  if (accepted) {
    // Get player stats from playerStats object
    const challengerStats = playerStats[challenge.challenger.id] || {};
    const challengedStats = playerStats[challenge.challenged.id] || {};
    
    // Create combat state
    const combatState = {
      id: generateCombatId(),
      challenger: {
        id: challenge.challenger.id,
        name: challenge.challenger.name,
        avatar: gameState.players[challenge.challenger.id].avatar || 'character_1',
        health: (challengerStats.health || challengerStats.maxHealth) || 100,
        maxHealth: challengerStats.maxHealth || 100,
        isAlive: true,
        stats: challengerStats
      },
      challenged: {
        id: challenge.challenged.id,
        name: challenge.challenged.name,
        avatar: gameState.players[challenge.challenged.id].avatar || 'character_1',
        health: (challengedStats.health || challengedStats.maxHealth) || 100,
        maxHealth: challengedStats.maxHealth || 100,
        isAlive: true,
        stats: challengedStats
      },
      currentTurn: challenge.challenger.id, // Challenger goes first
      turns: [],
      status: 'active',
      startTime: Date.now()
    };
    
    combatStates[combatState.id] = combatState;
    
    // Send combat state to both players
    const challengerWs = gameState.players[challenge.challenger.id].ws;
    const challengedWs = gameState.players[challenge.challenged.id].ws;
    
    sendToClient(challengerWs, 'combatStateUpdate', combatState);
    sendToClient(challengedWs, 'combatStateUpdate', combatState);
    
    // Send global message
    const globalMessage = {
      id: generateMessageId(),
      playerId: 'system',
      playerName: 'System',
      message: `A fierce brawl broke out at the Drunken Monkey Tavern! ${challenge.challenger.name} vs ${challenge.challenged.name}`,
      text: `A fierce brawl broke out at the Drunken Monkey Tavern! ${challenge.challenger.name} vs ${challenge.challenged.name}`,
      timestamp: Date.now()
    };
    broadcastToAll('chatMessage', globalMessage);
    
    console.log(`⚔️ Combat started: ${challenge.challenger.name} vs ${challenge.challenged.name}`);
  } else {
    // Send decline message to challenger
    const challengerWs = gameState.players[challenge.challenger.id].ws;
    sendToClient(challengerWs, 'combatChallengeDeclined', {
      challengerName: challenge.challenger.name,
      challengedName: challenge.challenged.name
    });
  }
  
  // Clean up challenge
  delete combatChallenges[challengeId];
}

function handleCombatAction(ws, data) {
  const playerId = findPlayerByWebSocket(ws);
  const combatId = data.combatId;
  const action = data.action;
  
  if (!playerId || !combatId || !combatStates[combatId]) {
    console.log('❌ Invalid combat action');
    return;
  }
  
  const combatState = combatStates[combatId];
  
  // Verify combat is active and it's player's turn
  if (combatState.status !== 'active' || combatState.currentTurn !== playerId) {
    console.log('❌ Invalid combat action: not player turn or combat not active');
    return;
  }
  
  console.log(`⚔️ Combat action: ${action.type} by ${gameState.players[playerId].name}`);
  
  // Get WebSocket connections
  const challengerWs = gameState.players[combatState.challenger.id].ws;
  const challengedWs = gameState.players[combatState.challenged.id].ws;
  
  // Process the action
  const isChallenger = playerId === combatState.challenger.id;
  const attacker = isChallenger ? combatState.challenger : combatState.challenged;
  const target = isChallenger ? combatState.challenged : combatState.challenger;
  
  let processedAction = { ...action };
  
  if (action.type === 'attack') {
    // Calculate damage using stats
    const attackerStats = attacker.stats || {};
    const targetStats = target.stats || {};
    const attack = typeof attackerStats.attack === 'number' ? attackerStats.attack : 15;
    const defense = typeof targetStats.defense === 'number' ? targetStats.defense : 5;
    const attackerSpeed = typeof attackerStats.speed === 'number' ? attackerStats.speed : 10;
    const targetSpeed = typeof targetStats.speed === 'number' ? targetStats.speed : 10;

    // Base damage derived from attack with small variance
    const variance = Math.floor(Math.random() * 5) - 2; // -2..+2
    const baseDamage = Math.max(1, attack + variance);

    // Chances influenced by stats
    const baseDodge = 0.05;
    const baseBlock = 0.05;
    const speedDiff = targetSpeed - attackerSpeed; // faster target -> higher dodge
    const isDodged = Math.random() < Math.max(0.05, Math.min(0.5, baseDodge + speedDiff * 0.01));
    const isBlocked = !isDodged && (Math.random() < Math.max(0.05, Math.min(0.4, baseBlock + defense * 0.01)));
    
    if (!isDodged) {
      // Defense reduces damage multiplicatively (2% per defense point), min 1 dmg
      const defenseReduction = Math.max(0, Math.min(0.8, defense * 0.02));
      const mitigated = Math.max(1, Math.floor(baseDamage * (1 - defenseReduction)));
      const finalDamage = isBlocked ? Math.max(1, Math.floor(mitigated * 0.5)) : mitigated;
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
  
  // Add turn to combat state
  const turn = {
    playerId: playerId,
    action: processedAction,
    timestamp: Date.now()
  };
  
  combatState.turns.push(turn);
  
  // Switch turns
  combatState.currentTurn = isChallenger ? combatState.challenged.id : combatState.challenger.id;
  
  // Check for winner
  let winner = null;
  if (!combatState.challenger.isAlive) {
    winner = combatState.challenged.id;
  } else if (!combatState.challenged.isAlive) {
    winner = combatState.challenger.id;
  }
  
  if (winner) {
    // Combat finished
    combatState.status = 'finished';
    combatState.winner = winner;
    combatState.endTime = Date.now();
    
    const winnerName = winner === combatState.challenger.id ? combatState.challenger.name : combatState.challenged.name;
    const loserName = winner === combatState.challenger.id ? combatState.challenged.name : combatState.challenger.name;
    
    // Send victory message
    const victoryMessage = {
      id: generateMessageId(),
      playerId: 'system',
      playerName: 'System',
      message: `A fierce brawl broke out at the Drunken Monkey Tavern! ${winnerName} emerged victorious, while ${loserName} was defeated.`,
      text: `A fierce brawl broke out at the Drunken Monkey Tavern! ${winnerName} emerged victorious, while ${loserName} was defeated.`,
      timestamp: Date.now()
    };
    broadcastToAll('chatMessage', victoryMessage);
    
    // Calculate XP for both players
    const winnerStats = playerStats[winner];
    const loserStats = playerStats[combatState.challenger.id === winner ? combatState.challenged.id : combatState.challenger.id];
    
    if (winnerStats && loserStats) {
      // Winner gets XP
      const winnerXP = 50; // Base XP for victory
      const winnerResult = addExperience(winnerStats, winnerXP);
      playerStats[winner] = winnerResult.newStats;
      
      // Loser gets some XP too
      const loserXP = 20; // Base XP for participation
      const loserResult = addExperience(loserStats, loserXP);
      playerStats[combatState.challenger.id === winner ? combatState.challenged.id : combatState.challenger.id] = loserResult.newStats;
      
      // Send XP updates
      
      sendToClient(challengerWs, 'xpUpdate', {
        xpGained: combatState.challenger.id === winner ? winnerXP : loserXP,
        newStats: combatState.challenger.id === winner ? winnerResult.newStats : loserResult.newStats,
        leveledUp: combatState.challenger.id === winner ? winnerResult.leveledUp : loserResult.leveledUp,
        levelsGained: combatState.challenger.id === winner ? winnerResult.levelsGained : loserResult.levelsGained
      });
      
      sendToClient(challengedWs, 'xpUpdate', {
        xpGained: combatState.challenged.id === winner ? winnerXP : loserXP,
        newStats: combatState.challenged.id === winner ? winnerResult.newStats : loserResult.newStats,
        leveledUp: combatState.challenged.id === winner ? winnerResult.leveledUp : loserResult.leveledUp,
        levelsGained: combatState.challenged.id === winner ? winnerResult.levelsGained : loserResult.levelsGained
      });
    }
    
    // Send updated game state to both players with new stats
    const cleanGameState = {
      players: Object.fromEntries(
        Object.entries(gameState.players).map(([id, player]) => [
          id, 
          {
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            color: player.color,
            x: player.x,
            y: player.y,
            direction: player.direction,
            lastSeen: player.lastSeen,
            stats: playerStats[id] || null
          }
        ])
      ),
      lastUpdate: Date.now()
    };
    
    sendToClient(challengerWs, 'gameState', cleanGameState);
    sendToClient(challengedWs, 'gameState', cleanGameState);
    
    console.log(`⚔️ Combat finished: ${winnerName} defeated ${loserName}`);
  }
  
  // Send updated combat state to both players
  
  sendToClient(challengerWs, 'combatStateUpdate', combatState);
  sendToClient(challengedWs, 'combatStateUpdate', combatState);
}

function findPlayerByWebSocket(ws) {
  for (const [playerId, player] of Object.entries(gameState.players)) {
    if (player.ws === ws) {
      return playerId;
    }
  }
  return null;
}

function generatePlayerId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateMessageId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateChallengeId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateCombatId() {
  return Math.random().toString(36).substr(2, 9);
}

// XP System functions
function addExperience(stats, xpGained) {
  const newStats = { ...stats };
  newStats.experience += xpGained;
  
  let leveledUp = false;
  let levelsGained = 0;
  
  // Check for level up
  while (newStats.experience >= calculateXPRequired(newStats.level)) {
    newStats.level++;
    newStats.experience -= calculateXPRequired(newStats.level - 1);
    newStats.maxHealth += 10;
    newStats.health = newStats.maxHealth; // Full heal on level up
    newStats.attack += 2;
    newStats.defense += 1;
    newStats.speed += 1;
    leveledUp = true;
    levelsGained++;
  }
  
  return {
    newStats,
    leveledUp,
    levelsGained
  };
}

function calculateXPRequired(level) {
  return level * 100; // 100 XP per level
}

// Clean up inactive players every 60 seconds
setInterval(() => {
  const now = Date.now();
  const timeout = 120000; // 2 minutes
  
  Object.keys(gameState.players).forEach(playerId => {
    if (now - gameState.players[playerId].lastSeen > timeout) {
      const player = gameState.players[playerId];
      delete gameState.players[playerId];
      delete playerStats[playerId];
      gameState.lastUpdate = now;
      
      console.log(`👋 Player ${player.name} disconnected due to inactivity`);
      
      // Notify other players
      broadcastToAll('playerLeft', playerId);
    }
  });
}, 60000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🌐 WebSocket available at ws://localhost:${PORT}`);
});
