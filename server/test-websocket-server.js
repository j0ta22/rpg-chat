const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    players: Object.keys(gameState.players).length,
    uptime: process.uptime()
  });
});

// Game state
const gameState = {
  players: {},
  lastUpdate: Date.now()
};

const playerStats = {};
const combatStates = {};
const combatChallenges = {};

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📥 Received message:', message.type);
      
      switch (message.type) {
        case 'joinGame':
          handleJoinGame(ws, message.data);
          break;
        case 'updatePosition':
          handleUpdatePosition(ws, message.data);
          break;
        case 'challengePlayer':
          handleChallengePlayer(ws, message.data);
          break;
        case 'respondToChallenge':
          handleRespondToChallenge(ws, message.data);
          break;
        case 'combatAction':
          handleCombatAction(ws, message.data);
          break;
        case 'heartbeat':
          handleHeartbeat(ws, message.data);
          break;
        default:
          console.log('❓ Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    // Remove player from game state
    for (const [playerId, player] of Object.entries(gameState.players)) {
      if (player.ws === ws) {
        delete gameState.players[playerId];
        console.log('👋 Player removed:', player.name);
        break;
      }
    }
  });
});

function handleJoinGame(ws, data) {
  const { name, avatar, x, y, color } = data;
  const playerId = generatePlayerId();
  
  gameState.players[playerId] = {
    id: playerId,
    name,
    avatar,
    x,
    y,
    color,
    ws,
    health: 100,
    maxHealth: 100,
    attack: 10,
    defense: 5,
    speed: 3,
    level: 1
  };
  
  console.log('🎮 Player joined:', name, 'ID:', playerId);
  
  // Send player ID back
  ws.send(JSON.stringify({
    type: 'playerId',
    data: { playerId }
  }));
  
  // Broadcast updated game state
  broadcastGameState();
}

function handleUpdatePosition(ws, data) {
  const playerId = findPlayerByWebSocket(ws);
  if (!playerId) return;
  
  const player = gameState.players[playerId];
  if (player) {
    player.x = data.x;
    player.y = data.y;
    player.direction = data.direction;
    gameState.lastUpdate = Date.now();
  }
}

function handleChallengePlayer(ws, data) {
  const challengerId = findPlayerByWebSocket(ws);
  const challengedId = data.challengedId;
  
  if (!challengerId || !challengedId) return;
  
  const challenger = gameState.players[challengerId];
  const challenged = gameState.players[challengedId];
  
  if (!challenger || !challenged) return;
  
  const challengeId = generateChallengeId();
  combatChallenges[challengeId] = {
    id: challengeId,
    challenger: {
      id: challengerId,
      name: challenger.name,
      stats: {
        attack: challenger.attack,
        defense: challenger.defense,
        speed: challenger.speed,
        health: challenger.health,
        level: challenger.level
      }
    },
    challenged: {
      id: challengedId,
      name: challenged.name,
      stats: {
        attack: challenged.attack,
        defense: challenged.defense,
        speed: challenged.speed,
        health: challenged.health,
        level: challenged.level
      }
    },
    timestamp: Date.now()
  };
  
  // Send challenge to challenged player
  challenged.ws.send(JSON.stringify({
    type: 'combatChallenge',
    data: {
      challengeId,
      challenger: {
        name: challenger.name,
        level: challenger.level
      }
    }
  }));
  
  console.log('⚔️ Combat challenge sent:', challenger.name, '->', challenged.name);
}

function handleRespondToChallenge(ws, data) {
  const { challengeId, accepted } = data;
  const challenge = combatChallenges[challengeId];
  
  if (!challenge) return;
  
  if (accepted) {
    // Start combat
    const combatId = generateCombatId();
    combatStates[combatId] = {
      id: combatId,
      challenger: { ...challenge.challenger, health: 100, maxHealth: 100 },
      challenged: { ...challenge.challenged, health: 100, maxHealth: 100 },
      currentTurn: challenge.challenger.id,
      turns: [],
      status: 'active',
      startTime: Date.now(),
      totalDamageDealt: 0,
      criticalHits: 0
    };
    
    // Notify both players
    const challengerWs = gameState.players[challenge.challenger.id].ws;
    const challengedWs = gameState.players[challenge.challenged.id].ws;
    
    const combatState = combatStates[combatId];
    
    challengerWs.send(JSON.stringify({
      type: 'combatStateUpdate',
      data: { combatState, isYourTurn: true }
    }));
    
    challengedWs.send(JSON.stringify({
      type: 'combatStateUpdate',
      data: { combatState, isYourTurn: false }
    }));
    
    console.log('⚔️ Combat started:', challenge.challenger.name, 'vs', challenge.challenged.name);
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
  
  if (action.type === 'attack' || action.type === 'strong_attack' || action.type === 'quick_attack') {
    // Simple damage calculation
    const damage = Math.floor(Math.random() * 20) + 10;
    target.health = Math.max(0, target.health - damage);
    target.isAlive = target.health > 0;
    
    processedAction.damage = damage;
    processedAction.isCritical = Math.random() < 0.1;
    processedAction.isBlocked = false;
    processedAction.isDodged = false;
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
  
  // Check for combat end
  if (target.health <= 0) {
    combatState.status = 'finished';
    combatState.winner = attacker.id;
    combatState.endTime = Date.now();
    
    console.log('🏆 Combat finished! Winner:', attacker.name);
  }
  
  // Notify both players
  const combatStateUpdate = {
    type: 'combatStateUpdate',
    data: { 
      combatState, 
      isYourTurn: combatState.currentTurn === playerId 
    }
  };
  
  challengerWs.send(JSON.stringify(combatStateUpdate));
  challengedWs.send(JSON.stringify(combatStateUpdate));
}

function handleHeartbeat(ws, data) {
  // Send heartbeat acknowledgment
  ws.send(JSON.stringify({
    type: 'heartbeatAck',
    data: { timestamp: Date.now() }
  }));
}

function findPlayerByWebSocket(ws) {
  for (const [playerId, player] of Object.entries(gameState.players)) {
    if (player.ws === ws) {
      return playerId;
    }
  }
  return null;
}

function broadcastGameState() {
  const gameStateData = {
    type: 'gameState',
    data: {
      players: Object.values(gameState.players).map(player => ({
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        x: player.x,
        y: player.y,
        color: player.color,
        direction: player.direction
      }))
    }
  };
  
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(gameStateData));
    }
  });
}

function generatePlayerId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateChallengeId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateCombatId() {
  return Math.random().toString(36).substr(2, 9);
}

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Test WebSocket server running on port ${PORT}`);
});
