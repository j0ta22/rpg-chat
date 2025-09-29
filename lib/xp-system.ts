// XP and Level System
export interface PlayerStats {
  level: number
  experience: number
  experienceToNext: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  speed: number
}

export interface LevelUpReward {
  healthIncrease: number
  attackIncrease: number
  defenseIncrease: number
  speedIncrease: number
}

// XP System Constants
export const XP_CONSTANTS = {
  BASE_XP_REQUIRED: 100, // XP needed for level 2
  XP_MULTIPLIER: 1.5, // Each level requires 1.5x more XP
  MAX_LEVEL: 50,
  
  // Base stats for level 1
  BASE_HEALTH: 100,
  BASE_ATTACK: 15,
  BASE_DEFENSE: 5,
  BASE_SPEED: 10,
  
  // Stat increases per level
  HEALTH_PER_LEVEL: 10,
  ATTACK_PER_LEVEL: 2,
  DEFENSE_PER_LEVEL: 1,
  SPEED_PER_LEVEL: 0.5,
  
  // XP rewards
  COMBAT_VICTORY_XP: 50,
  COMBAT_DEFEAT_XP: 10, // Small consolation XP
  FIRST_BLOOD_XP: 25, // Bonus for first hit
  PERFECT_VICTORY_XP: 75, // Win without taking damage
}

// Calculate XP required for a specific level
export function calculateXPRequired(level: number): number {
  if (level <= 1) return 0
  
  let totalXP = 0
  for (let i = 2; i <= level; i++) {
    totalXP += Math.floor(XP_CONSTANTS.BASE_XP_REQUIRED * Math.pow(XP_CONSTANTS.XP_MULTIPLIER, i - 2))
  }
  return totalXP
}

// Calculate XP needed for next level
export function calculateXPToNext(currentLevel: number, currentXP: number): number {
  const nextLevelXP = calculateXPRequired(currentLevel + 1)
  return nextLevelXP - currentXP
}

// Create initial player stats
export function createInitialStats(): PlayerStats {
  return {
    level: 1,
    experience: 0,
    experienceToNext: XP_CONSTANTS.BASE_XP_REQUIRED,
    health: XP_CONSTANTS.BASE_HEALTH,
    maxHealth: XP_CONSTANTS.BASE_HEALTH,
    attack: XP_CONSTANTS.BASE_ATTACK,
    defense: XP_CONSTANTS.BASE_DEFENSE,
    speed: XP_CONSTANTS.BASE_SPEED,
  }
}

// Add XP and handle level ups
export function addExperience(stats: PlayerStats, xpGained: number): { 
  newStats: PlayerStats, 
  leveledUp: boolean, 
  levelsGained: number,
  levelUpReward?: LevelUpReward 
} {
  let newStats = { ...stats }
  let leveledUp = false
  let levelsGained = 0
  let levelUpReward: LevelUpReward | undefined

  newStats.experience += xpGained

  // Check for level ups
  while (newStats.level < XP_CONSTANTS.MAX_LEVEL) {
    const xpNeededForNext = calculateXPToNext(newStats.level, newStats.experience)
    
    if (xpNeededForNext <= 0) {
      // Level up!
      leveledUp = true
      levelsGained++
      
      // Calculate stat increases
      const healthIncrease = XP_CONSTANTS.HEALTH_PER_LEVEL
      const attackIncrease = XP_CONSTANTS.ATTACK_PER_LEVEL
      const defenseIncrease = XP_CONSTANTS.DEFENSE_PER_LEVEL
      const speedIncrease = XP_CONSTANTS.SPEED_PER_LEVEL
      
      // Apply stat increases
      newStats.level++
      newStats.maxHealth += healthIncrease
      newStats.health += healthIncrease // Heal on level up
      newStats.attack += attackIncrease
      newStats.defense += defenseIncrease
      newStats.speed += speedIncrease
      
      // Store level up reward for UI display
      levelUpReward = {
        healthIncrease,
        attackIncrease,
        defenseIncrease,
        speedIncrease
      }
      
      // Update XP to next level
      newStats.experienceToNext = calculateXPToNext(newStats.level, newStats.experience)
    } else {
      // No more level ups possible
      newStats.experienceToNext = xpNeededForNext
      break
    }
  }

  return { newStats, leveledUp, levelsGained, levelUpReward }
}

// Calculate combat XP based on performance
export function calculateCombatXP(
  isVictory: boolean, 
  damageDealt: number, 
  damageTaken: number,
  turnsTaken: number,
  isFirstBlood: boolean = false
): number {
  let xp = 0

  if (isVictory) {
    xp += XP_CONSTANTS.COMBAT_VICTORY_XP
    
    // Bonus for perfect victory (no damage taken)
    if (damageTaken === 0) {
      xp += XP_CONSTANTS.PERFECT_VICTORY_XP
    }
    
    // Bonus for first blood
    if (isFirstBlood) {
      xp += XP_CONSTANTS.FIRST_BLOOD_XP
    }
    
    // Bonus for quick victory (fewer turns)
    if (turnsTaken <= 3) {
      xp += 25
    }
  } else {
    // Consolation XP for defeat
    xp += XP_CONSTANTS.COMBAT_DEFEAT_XP
    
    // Bonus XP based on damage dealt
    xp += Math.floor(damageDealt / 10)
  }

  return xp
}

// Format XP display
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`
  }
  return xp.toString()
}

// Get level title based on level
export function getLevelTitle(level: number): string {
  if (level >= 50) return "Legendary Hero"
  if (level >= 40) return "Master Warrior"
  if (level >= 30) return "Elite Fighter"
  if (level >= 20) return "Veteran"
  if (level >= 15) return "Experienced"
  if (level >= 10) return "Skilled"
  if (level >= 5) return "Novice"
  return "Beginner"
}
