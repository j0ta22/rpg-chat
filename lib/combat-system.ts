// Sistema de combate por turnos entre jugadores

export interface CombatPlayer {
  id: string
  name: string
  avatar: string
  health: number
  maxHealth: number
  isAlive: boolean
}

export interface CombatAction {
  type: 'attack' | 'block' | 'dodge'
  damage?: number
  blocked?: boolean
  dodged?: boolean
}

export interface CombatTurn {
  playerId: string
  action: CombatAction
  timestamp: number
}

export interface CombatState {
  id: string
  challenger: CombatPlayer
  challenged: CombatPlayer
  currentTurn: string // ID del jugador cuyo turno es
  turns: CombatTurn[]
  status: 'waiting' | 'active' | 'finished'
  winner?: string
  startTime: number
  endTime?: number
}

export interface CombatChallenge {
  id: string
  challengerId: string
  challengerName: string
  challengedId: string
  challengedName: string
  timestamp: number
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}

// Constantes del sistema de combate
export const COMBAT_CONSTANTS = {
  MAX_HEALTH: 100,
  ATTACK_DAMAGE_MIN: 15,
  ATTACK_DAMAGE_MAX: 25,
  BLOCK_DAMAGE_REDUCTION: 0.5, // Reduce el daño a la mitad
  DODGE_CHANCE: 0.3, // 30% de probabilidad de esquivar
  CHALLENGE_RANGE: 80, // Distancia máxima para desafiar
  CHALLENGE_TIMEOUT: 30000, // 30 segundos para aceptar/declinar
  TURN_TIMEOUT: 30000, // 30 segundos por turno
}

// Utilidades del sistema de combate
export class CombatUtils {
  // Calcular daño de ataque
  static calculateAttackDamage(): number {
    return Math.floor(
      Math.random() * (COMBAT_CONSTANTS.ATTACK_DAMAGE_MAX - COMBAT_CONSTANTS.ATTACK_DAMAGE_MIN + 1)
    ) + COMBAT_CONSTANTS.ATTACK_DAMAGE_MIN
  }

  // Verificar si un ataque es esquivado
  static isDodged(): boolean {
    return Math.random() < COMBAT_CONSTANTS.DODGE_CHANCE
  }

  // Calcular daño final considerando bloqueo
  static calculateFinalDamage(baseDamage: number, isBlocked: boolean): number {
    if (isBlocked) {
      return Math.floor(baseDamage * COMBAT_CONSTANTS.BLOCK_DAMAGE_REDUCTION)
    }
    return baseDamage
  }

  // Verificar si un jugador está en rango para desafiar
  static isInChallengeRange(
    challengerX: number, 
    challengerY: number, 
    challengedX: number, 
    challengedY: number
  ): boolean {
    const distance = Math.sqrt(
      Math.pow(challengerX - challengedX, 2) + Math.pow(challengerY - challengedY, 2)
    )
    return distance <= COMBAT_CONSTANTS.CHALLENGE_RANGE
  }

  // Crear un nuevo estado de combate
  static createCombatState(
    challenger: Omit<CombatPlayer, 'health' | 'maxHealth' | 'isAlive'>,
    challenged: Omit<CombatPlayer, 'health' | 'maxHealth' | 'isAlive'>
  ): CombatState {
    const combatId = `combat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      id: combatId,
      challenger: {
        ...challenger,
        health: COMBAT_CONSTANTS.MAX_HEALTH,
        maxHealth: COMBAT_CONSTANTS.MAX_HEALTH,
        isAlive: true
      },
      challenged: {
        ...challenged,
        health: COMBAT_CONSTANTS.MAX_HEALTH,
        maxHealth: COMBAT_CONSTANTS.MAX_HEALTH,
        isAlive: true
      },
      currentTurn: challenger.id, // El desafiant comienza
      turns: [],
      status: 'active',
      startTime: Date.now()
    }
  }

  // Procesar una acción de combate
  static processCombatAction(
    combatState: CombatState, 
    playerId: string, 
    action: CombatAction
  ): CombatState {
    if (combatState.status !== 'active') {
      return combatState
    }

    if (combatState.currentTurn !== playerId) {
      return combatState
    }

    const newTurn: CombatTurn = {
      playerId,
      action,
      timestamp: Date.now()
    }

    const updatedTurns = [...combatState.turns, newTurn]
    
    // Determinar el siguiente turno
    const nextTurn = combatState.currentTurn === combatState.challenger.id 
      ? combatState.challenged.id 
      : combatState.challenger.id

    // Si es un ataque, procesar el daño
    let updatedChallenger = { ...combatState.challenger }
    let updatedChallenged = { ...combatState.challenged }
    let winner: string | undefined

    if (action.type === 'attack') {
      const target = playerId === combatState.challenger.id ? updatedChallenged : updatedChallenger
      const isBlocked = target.health < target.maxHealth && Math.random() < 0.2 // 20% chance de bloqueo automático
      const isDodged = CombatUtils.isDodged()
      
      if (!isDodged) {
        const baseDamage = CombatUtils.calculateAttackDamage()
        const finalDamage = CombatUtils.calculateFinalDamage(baseDamage, isBlocked)
        
        target.health = Math.max(0, target.health - finalDamage)
        target.isAlive = target.health > 0
        
        // Actualizar la acción con los resultados
        newTurn.action.damage = finalDamage
        newTurn.action.blocked = isBlocked
        newTurn.action.dodged = false
      } else {
        newTurn.action.dodged = true
        newTurn.action.damage = 0
      }

      // Verificar si alguien ganó
      if (!updatedChallenger.isAlive) {
        winner = combatState.challenged.id
      } else if (!updatedChallenged.isAlive) {
        winner = combatState.challenger.id
      }
    }

    return {
      ...combatState,
      challenger: updatedChallenger,
      challenged: updatedChallenged,
      currentTurn: nextTurn,
      turns: updatedTurns,
      winner,
      status: winner ? 'finished' : 'active',
      endTime: winner ? Date.now() : undefined
    }
  }

  // Crear un nuevo desafío
  static createChallenge(
    challengerId: string,
    challengerName: string,
    challengedId: string,
    challengedName: string
  ): CombatChallenge {
    return {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      challengerId,
      challengerName,
      challengedId,
      challengedName,
      timestamp: Date.now(),
      status: 'pending'
    }
  }
}
