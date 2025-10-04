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

// Player activity tracking
const playerActivity = new Map();

const playerStats = {};
const combatStates = {};
const combatChallenges = {};

// Combat constants
const COMBAT_CONSTANTS = {
  BASE_DAMAGE_MULTIPLIER: 0.8,
  CRITICAL_CHANCE_BASE: 0.05,
  CRITICAL_MULTIPLIER: 2.0,
  DEFENSE_REDUCTION: 0.01,
  MAX_DEFENSE_REDUCTION: 0.75,
  DODGE_CHANCE_BASE: 0.1,
  SPEED_DODGE_BONUS: 0.002,
  MAX_DODGE_CHANCE: 0.6,
  BLOCK_CHANCE_BASE: 0.15,
  DEFENSE_BLOCK_BONUS: 0.003,
  MAX_BLOCK_CHANCE: 0.5,
  LEVEL_DAMAGE_BONUS: 0.05,
  MAX_LEVEL_BONUS: 0.5
};

// Rewards constants
const REWARDS_CONSTANTS = {
  BASE_GOLD: 25,
  LEVEL_BONUS_GOLD: 5,
  MAX_GOLD: 100,
  BASE_XP: 50,
  LEVEL_BONUS_XP: 10,
  PERFORMANCE_BONUS_XP: 25,
  SURVIVAL_BONUS_XP: 15,
  MAX_XP: 200,
  MAX_LEVEL_DIFFERENCE: 5,
  PENALTY_THRESHOLD: 5,
  ITEM_DROP_CHANCES: {
    common: 0.40,
    uncommon: 0.25,
    rare: 0.15,
    epic: 0.10,
    legendary: 0.05
  },
  XP_LOSS_BASE: 20,
  XP_LOSS_LEVEL_BONUS: 5,
  MAX_XP_LOSS: 50
};

// Enhanced damage calculation system
function calculateDamage(attacker, target, action) {
  console.log('⚔️ Calculating enhanced damage:', { 
    attacker: attacker.name, 
    target: target.name, 
    action: action.type 
  });
  
  // 1. Calculate base damage
  const baseDamage = calculateBaseDamage(attacker, action);
  console.log('📊 Base damage:', baseDamage);
  
  // 2. Calculate critical chance
  const criticalChance = calculateCriticalChance(attacker, action);
  const isCritical = Math.random() < criticalChance;
  console.log('💥 Critical chance:', criticalChance, 'Is critical:', isCritical);
  
  // 3. Apply critical multiplier
  let damage = baseDamage;
  if (isCritical) {
    damage *= COMBAT_CONSTANTS.CRITICAL_MULTIPLIER;
  }
  
  // 4. Calculate dodge chance
  const dodgeChance = calculateDodgeChance(target, action);
  const isDodged = Math.random() < dodgeChance;
  console.log('💨 Dodge chance:', dodgeChance, 'Is dodged:', isDodged);
  
  if (isDodged) {
    return {
      damage: 0,
      isCritical: false,
      isBlocked: false,
      isDodged: true,
      effects: [],
      blockedBy: 'dodge'
    };
  }
  
  // 5. Calculate block chance
  const blockChance = calculateBlockChance(target, action);
  const isBlocked = Math.random() < blockChance;
  console.log('🛡️ Block chance:', blockChance, 'Is blocked:', isBlocked);
  
  // 6. Apply defense reduction
  if (!isBlocked) {
    const defenseReduction = calculateDefenseReduction(target);
    damage = Math.max(1, damage * (1 - defenseReduction));
    console.log('🛡️ Defense reduction:', defenseReduction, 'Final damage after defense:', damage);
  } else {
    damage = Math.floor(damage * 0.5); // Block reduces damage by half
    console.log('🛡️ Blocked! Damage reduced to:', damage);
  }
  
  // 7. Apply level bonus
  const levelBonus = calculateLevelBonus(attacker, target);
  damage = Math.floor(damage * (1 + levelBonus));
  console.log('📈 Level bonus:', levelBonus, 'Final damage:', damage);
  
  // 8. Calculate special effects
  const effects = calculateSpecialEffects(attacker, target, action, isCritical);
  
  return {
    damage: Math.max(1, Math.floor(damage)),
    isCritical,
    isBlocked,
    isDodged: false,
    effects,
    blockedBy: isBlocked ? 'armor' : null
  };
}

function calculateBaseDamage(attacker, action) {
  let baseDamage = attacker.attack * COMBAT_CONSTANTS.BASE_DAMAGE_MULTIPLIER;
  
  // Action type modifiers
  switch (action.type) {
    case 'strong_attack':
      baseDamage *= 1.5; // +50% damage
      break;
    case 'quick_attack':
      baseDamage *= 0.7; // -30% damage
      break;
    case 'attack':
    default:
      baseDamage *= 1.0; // Normal damage
      break;
  }
  
  // Weapon type modifiers
  if (action.weaponType) {
    const weaponMultipliers = {
      sword: 1.0,
      axe: 1.2,
      mace: 1.15,
      spear: 0.9,
      staff: 0.8,
      dagger: 0.85
    };
    baseDamage *= weaponMultipliers[action.weaponType] || 1.0;
  }
  
  // Elemental bonus
  if (action.element && action.element !== 'none') {
    baseDamage *= 1.2; // +20% elemental damage
  }
  
  return baseDamage;
}

function calculateCriticalChance(attacker, action) {
  let critChance = COMBAT_CONSTANTS.CRITICAL_CHANCE_BASE;
  
  // Speed bonus (max 10% additional)
  const speedBonus = Math.min(attacker.speed * 0.001, 0.1);
  critChance += speedBonus;
  
  // Weapon bonus
  if (action.weaponType === 'dagger') {
    critChance += 0.1; // +10% crit for daggers
  }
  
  // Level bonus
  critChance += attacker.level * 0.005; // +0.5% per level
  
  return Math.min(critChance, 0.4); // Max 40% crit chance
}

function calculateDodgeChance(target, action) {
  let dodgeChance = COMBAT_CONSTANTS.DODGE_CHANCE_BASE;
  
  // Speed bonus
  dodgeChance += target.speed * COMBAT_CONSTANTS.SPEED_DODGE_BONUS;
  
  // Quick attack penalty (harder to dodge)
  if (action.type === 'quick_attack') {
    dodgeChance *= 0.7;
  }
  
  return Math.min(dodgeChance, COMBAT_CONSTANTS.MAX_DODGE_CHANCE);
}

function calculateBlockChance(target, action) {
  let blockChance = COMBAT_CONSTANTS.BLOCK_CHANCE_BASE;
  
  // Defense bonus
  blockChance += target.defense * COMBAT_CONSTANTS.DEFENSE_BLOCK_BONUS;
  
  // Strong attack penalty (harder to block)
  if (action.type === 'strong_attack') {
    blockChance *= 0.6;
  }
  
  return Math.min(blockChance, COMBAT_CONSTANTS.MAX_BLOCK_CHANCE);
}

function calculateDefenseReduction(target) {
  const reduction = target.defense * COMBAT_CONSTANTS.DEFENSE_REDUCTION;
  return Math.min(reduction, COMBAT_CONSTANTS.MAX_DEFENSE_REDUCTION);
}

function calculateLevelBonus(attacker, target) {
  const levelDiff = attacker.level - target.level;
  const bonus = levelDiff * COMBAT_CONSTANTS.LEVEL_DAMAGE_BONUS;
  return Math.min(Math.max(bonus, -0.2), COMBAT_CONSTANTS.MAX_LEVEL_BONUS);
}

function calculateSpecialEffects(attacker, target, action, isCritical) {
  const effects = [];
  
  // Elemental effects
  if (action.element && action.element !== 'none' && Math.random() < 0.3) {
    effects.push(action.element);
  }
  
  // Critical effects
  if (isCritical) {
    const criticalEffects = ['stunned', 'bleeding', 'armor_break'];
    const randomEffect = criticalEffects[Math.floor(Math.random() * criticalEffects.length)];
    effects.push(randomEffect);
  }
  
  return effects;
}

function getWeaponType(equippedWeapon) {
  if (!equippedWeapon) return 'sword';
  
  const weaponName = equippedWeapon.name.toLowerCase();
  
  if (weaponName.includes('axe') || weaponName.includes('hatchet')) return 'axe';
  if (weaponName.includes('mace') || weaponName.includes('hammer')) return 'mace';
  if (weaponName.includes('spear') || weaponName.includes('lance')) return 'spear';
  if (weaponName.includes('staff') || weaponName.includes('wand')) return 'staff';
  if (weaponName.includes('dagger') || weaponName.includes('knife')) return 'dagger';
  
  return 'sword';
}

function getWeaponElement(equippedWeapon) {
  if (!equippedWeapon) return 'none';
  
  const weaponName = equippedWeapon.name.toLowerCase();
  
  if (weaponName.includes('fire') || weaponName.includes('flame') || weaponName.includes('burn')) return 'fire';
  if (weaponName.includes('ice') || weaponName.includes('frost') || weaponName.includes('cold')) return 'ice';
  if (weaponName.includes('lightning') || weaponName.includes('thunder') || weaponName.includes('electric')) return 'lightning';
  if (weaponName.includes('poison') || weaponName.includes('venom') || weaponName.includes('toxic')) return 'poison';
  
  return 'none';
}

// Rewards calculation functions
function calculateCombatRewards(combatResult) {
  console.log('🏆 Calculating combat rewards for:', combatResult.winnerId);
  
  const levelDifference = Math.abs(combatResult.winnerLevel - combatResult.loserLevel);
  const noRewards = levelDifference > REWARDS_CONSTANTS.PENALTY_THRESHOLD;
  
  let gold = 0;
  let experience = 0;
  let item = undefined;
  
  if (!noRewards) {
    // Calculate gold
    gold = calculateGoldReward(combatResult.winnerLevel, combatResult.damageDealt);
    
    // Calculate XP
    experience = calculateXPReward(combatResult.winnerLevel, combatResult.damageDealt, combatResult.combatDuration);
    
    // Calculate item drop
    item = calculateItemDrop();
  }
  
  const rewards = {
    gold,
    experience,
    item,
    penalties: {
      levelDifference,
      noRewards,
      reason: noRewards ? `Diferencia de nivel muy grande (${levelDifference} > ${REWARDS_CONSTANTS.PENALTY_THRESHOLD})` : undefined
    }
  };
  
  console.log('💰 Combat rewards calculated:', rewards);
  return rewards;
}

function calculateGoldReward(winnerLevel, damageDealt) {
  let gold = REWARDS_CONSTANTS.BASE_GOLD;
  gold += winnerLevel * REWARDS_CONSTANTS.LEVEL_BONUS_GOLD;
  
  // Bonus por daño causado (máximo 20% extra)
  const damageBonus = Math.min(damageDealt * 0.1, gold * 0.2);
  gold += damageBonus;
  
  return Math.min(Math.floor(gold), REWARDS_CONSTANTS.MAX_GOLD);
}

function calculateXPReward(winnerLevel, damageDealt, combatDuration) {
  let xp = REWARDS_CONSTANTS.BASE_XP;
  xp += winnerLevel * REWARDS_CONSTANTS.LEVEL_BONUS_XP;
  
  // Bonus por daño causado
  const damageBonus = Math.min(damageDealt * 0.5, REWARDS_CONSTANTS.PERFORMANCE_BONUS_XP);
  xp += damageBonus;
  
  // Bonus por duración del combate
  const durationBonus = Math.min(combatDuration / 10, REWARDS_CONSTANTS.SURVIVAL_BONUS_XP);
  xp += durationBonus;
  
  return Math.min(Math.floor(xp), REWARDS_CONSTANTS.MAX_XP);
}

function calculateItemDrop() {
  // 30% chance base de drop
  if (Math.random() > 0.3) {
    return undefined;
  }
  
  // Determinar rareza
  const rarity = determineItemRarity();
  
  return {
    rarity: rarity,
    name: `Item ${rarity}` // Placeholder - en producción se obtendría de la DB
  };
}

function determineItemRarity() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [rarity, chance] of Object.entries(REWARDS_CONSTANTS.ITEM_DROP_CHANCES)) {
    cumulative += chance;
    if (random <= cumulative) {
      return rarity;
    }
  }
  
  return 'common';
}

function calculateXPLoss(loserLevel, winnerLevel) {
  const levelDifference = Math.abs(winnerLevel - loserLevel);
  
  let xpLoss = REWARDS_CONSTANTS.XP_LOSS_BASE;
  xpLoss += loserLevel * REWARDS_CONSTANTS.XP_LOSS_LEVEL_BONUS;
  
  // Bonus de pérdida si el perdedor es de nivel mucho mayor
  if (levelDifference > REWARDS_CONSTANTS.PENALTY_THRESHOLD) {
    xpLoss += levelDifference * 2; // +2 XP perdido por cada nivel de diferencia
  }
  
  return Math.min(xpLoss, REWARDS_CONSTANTS.MAX_XP_LOSS);
}

// WebSocket server
const wss = new WebSocket.Server({ server });

// Store WebSocket connections
const connections = new Map();

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📥 Received message:', message.type, 'from client');
      console.log('📥 Message data:', message.data);
      
      switch (message.type) {
        case 'joinGame':
          console.log('🎮 Processing joinGame message...');
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
  console.log('🎮 handleJoinGame called with data:', data);
  const { name, avatar, x, y, color } = data;
  
  // Validate player data
  if (!name || name === 'undefined' || name === undefined) {
    console.log('❌ Invalid player name:', name);
    ws.close(1000, 'Invalid player name');
    return;
  }
  
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
  
  // Track player activity
  playerActivity.set(playerId, Date.now());
  
  console.log('🎮 Player joined:', name, 'with ID:', playerId);
  console.log('🎮 Current players count:', Object.keys(gameState.players).length);
  
  // Send player ID back
  const playerIdMessage = {
    type: 'playerId',
    data: { playerId }
  };
  console.log('📤 Sending playerId message:', playerIdMessage);
  ws.send(JSON.stringify(playerIdMessage));
  
  // Broadcast updated game state
  console.log('📤 Broadcasting game state...');
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
  
  console.log(`⚔️ Enhanced combat action: ${action.type} by ${gameState.players[playerId].name}`);
  
  // Get WebSocket connections
  const challengerWs = gameState.players[combatState.challenger.id].ws;
  const challengedWs = gameState.players[combatState.challenged.id].ws;
  
  // Process the action
  const isChallenger = playerId === combatState.challenger.id;
  const attacker = isChallenger ? combatState.challenger : combatState.challenged;
  const target = isChallenger ? combatState.challenged : combatState.challenger;
  
  let processedAction = { ...action };
  
  if (action.type === 'attack' || action.type === 'strong_attack' || action.type === 'quick_attack') {
    // Enhanced damage calculation
    const damageResult = calculateDamage(attacker, target, action);
    
    if (!damageResult.isDodged) {
      target.health = Math.max(0, target.health - damageResult.damage);
      target.isAlive = target.health > 0;
      
      // Track combat statistics
      combatState.totalDamageDealt += damageResult.damage;
      if (damageResult.isCritical) {
        combatState.criticalHits++;
      }
      
      processedAction.damage = damageResult.damage;
      processedAction.isCritical = damageResult.isCritical;
      processedAction.isBlocked = damageResult.isBlocked;
      processedAction.isDodged = false;
      processedAction.effects = damageResult.effects;
      processedAction.blockedBy = damageResult.blockedBy;
    } else {
      processedAction.dodged = true;
      processedAction.damage = 0;
      processedAction.isCritical = false;
      processedAction.isBlocked = false;
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
  
  // Check for combat end
  if (target.health <= 0) {
    combatState.status = 'finished';
    combatState.winner = attacker.id;
    combatState.endTime = Date.now();
    
    // Calculate combat duration
    const combatDuration = Math.floor((combatState.endTime - combatState.startTime) / 1000);
    
    // Calculate rewards
    const combatResult = {
      winnerId: attacker.id,
      loserId: target.id,
      winnerLevel: attacker.level,
      loserLevel: target.level,
      combatDuration: combatDuration,
      damageDealt: combatState.totalDamageDealt,
      criticalHits: combatState.criticalHits
    };
    
    const rewards = calculateCombatRewards(combatResult);
    const xpLoss = calculateXPLoss(target.level, attacker.level);
    
    console.log('🏆 Combat finished! Winner:', attacker.name);
    console.log('💰 Rewards:', rewards);
    console.log('💀 XP Loss:', xpLoss);
    
    // Send rewards to both players
    const rewardsData = {
      type: 'combatRewards',
      data: {
        winner: {
          id: attacker.id,
          name: attacker.name,
          rewards: rewards
        },
        loser: {
          id: target.id,
          name: target.name,
          xpLoss: xpLoss,
          levelDifference: Math.abs(attacker.level - target.level)
        }
      }
    };
    
    challengerWs.send(JSON.stringify(rewardsData));
    challengedWs.send(JSON.stringify(rewardsData));
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
  // Update player activity
  const playerId = findPlayerByWebSocket(ws);
  if (playerId) {
    playerActivity.set(playerId, Date.now());
  }
  
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

// Clean up inactive players (no heartbeat for 30 seconds)
function cleanupInactivePlayers() {
  const now = Date.now();
  const INACTIVE_TIMEOUT = 30000; // 30 seconds
  let cleanedUp = false;
  
  for (const [playerId, lastActivity] of playerActivity.entries()) {
    if (now - lastActivity > INACTIVE_TIMEOUT) {
      console.log(`🧹 Cleaning up inactive player: ${playerId}`);
      
      // Get player info before removing
      const player = gameState.players[playerId];
      
      // Close WebSocket if still open
      if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.close();
      }
      
      // Remove from game state
      if (gameState.players[playerId]) {
        delete gameState.players[playerId];
      }
      
      // Remove from activity tracking
      playerActivity.delete(playerId);
      cleanedUp = true;
    }
  }
  
  // Broadcast updated game state after cleanup
  if (cleanedUp) {
    console.log(`🧹 Cleanup completed. Active players: ${Object.keys(gameState.players).length}`);
    broadcastGameState();
  }
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    players: Object.keys(gameState.players).length,
    uptime: process.uptime()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Enhanced WebSocket server with rewards running on port ${PORT}`);
  
  // Start cleanup interval (every 10 seconds)
  setInterval(cleanupInactivePlayers, 10000);
  console.log('🧹 Player cleanup interval started (every 10 seconds)');
});
