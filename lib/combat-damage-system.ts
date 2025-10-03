// Sistema de daño basado en stats para combate
// Este archivo contiene todas las funciones para calcular daño, críticos, defensa, etc.

export interface CombatStats {
  attack: number
  defense: number
  speed: number
  health: number
  maxHealth: number
  level: number
}

export interface DamageResult {
  damage: number
  isCritical: boolean
  isBlocked: boolean
  isDodged: boolean
  damageType: 'physical' | 'magical' | 'true'
  effects: string[]
  blockedBy: 'armor' | 'shield' | 'dodge' | null
}

export interface CombatAction {
  type: 'attack' | 'strong_attack' | 'quick_attack' | 'block' | 'dodge' | 'special'
  weaponType?: 'sword' | 'axe' | 'mace' | 'spear' | 'staff' | 'dagger'
  element?: 'fire' | 'ice' | 'lightning' | 'poison' | 'none'
}

// Constantes del sistema de combate
export const COMBAT_CONSTANTS = {
  // Daño base
  BASE_DAMAGE_MULTIPLIER: 0.8, // Multiplicador base del ataque
  CRITICAL_CHANCE_BASE: 0.05,  // 5% base de crítico
  CRITICAL_MULTIPLIER: 2.0,    // Daño crítico x2
  
  // Defensa
  DEFENSE_REDUCTION: 0.01,     // 1% de reducción por punto de defensa
  MAX_DEFENSE_REDUCTION: 0.75, // Máximo 75% de reducción
  
  // Velocidad
  DODGE_CHANCE_BASE: 0.1,      // 10% base de esquivar
  SPEED_DODGE_BONUS: 0.002,    // +0.2% por punto de velocidad
  MAX_DODGE_CHANCE: 0.6,       // Máximo 60% de esquivar
  
  // Bloqueo
  BLOCK_CHANCE_BASE: 0.15,     // 15% base de bloquear
  DEFENSE_BLOCK_BONUS: 0.003,  // +0.3% por punto de defensa
  MAX_BLOCK_CHANCE: 0.5,       // Máximo 50% de bloquear
  
  // Diferencia de nivel
  LEVEL_DAMAGE_BONUS: 0.05,    // +5% daño por nivel de diferencia
  MAX_LEVEL_BONUS: 0.5,        // Máximo 50% de bonus por nivel
  
  // Tipos de armas
  WEAPON_DAMAGE_MULTIPLIERS: {
    sword: 1.0,    // Daño normal
    axe: 1.2,      // +20% daño, -10% velocidad
    mace: 1.15,    // +15% daño, -5% velocidad
    spear: 0.9,    // -10% daño, +15% velocidad
    staff: 0.8,    // -20% daño, +25% velocidad, +magia
    dagger: 0.85   // -15% daño, +20% velocidad, +crítico
  },
  
  // Elementos
  ELEMENT_DAMAGE_BONUS: 0.2,   // +20% daño elemental
  ELEMENT_EFFECT_CHANCE: 0.3   // 30% chance de efecto elemental
}

/**
 * Calcula el daño de un ataque basado en las stats del atacante y defensor
 */
export function calculateDamage(
  attacker: CombatStats, 
  target: CombatStats, 
  action: CombatAction
): DamageResult {
  console.log('⚔️ Calculating damage:', { attacker, target, action })
  
  // 1. Calcular daño base
  const baseDamage = calculateBaseDamage(attacker, action)
  console.log('📊 Base damage:', baseDamage)
  
  // 2. Calcular chance de crítico
  const criticalChance = calculateCriticalChance(attacker, action)
  const isCritical = Math.random() < criticalChance
  console.log('💥 Critical chance:', criticalChance, 'Is critical:', isCritical)
  
  // 3. Aplicar multiplicador de crítico
  let damage = baseDamage
  if (isCritical) {
    damage *= COMBAT_CONSTANTS.CRITICAL_MULTIPLIER
  }
  
  // 4. Calcular chance de esquivar
  const dodgeChance = calculateDodgeChance(target, action)
  const isDodged = Math.random() < dodgeChance
  console.log('💨 Dodge chance:', dodgeChance, 'Is dodged:', isDodged)
  
  if (isDodged) {
    return {
      damage: 0,
      isCritical: false,
      isBlocked: false,
      isDodged: true,
      damageType: 'physical',
      effects: [],
      blockedBy: 'dodge'
    }
  }
  
  // 5. Calcular chance de bloqueo
  const blockChance = calculateBlockChance(target, action)
  const isBlocked = Math.random() < blockChance
  console.log('🛡️ Block chance:', blockChance, 'Is blocked:', isBlocked)
  
  // 6. Aplicar reducción de defensa
  if (!isBlocked) {
    const defenseReduction = calculateDefenseReduction(target)
    damage = Math.max(1, damage * (1 - defenseReduction))
    console.log('🛡️ Defense reduction:', defenseReduction, 'Final damage after defense:', damage)
  } else {
    damage = Math.floor(damage * 0.5) // Bloqueo reduce daño a la mitad
    console.log('🛡️ Blocked! Damage reduced to:', damage)
  }
  
  // 7. Aplicar bonus por diferencia de nivel
  const levelBonus = calculateLevelBonus(attacker, target)
  damage = Math.floor(damage * (1 + levelBonus))
  console.log('📈 Level bonus:', levelBonus, 'Final damage:', damage)
  
  // 8. Calcular efectos especiales
  const effects = calculateSpecialEffects(attacker, target, action, isCritical)
  
  return {
    damage: Math.max(1, Math.floor(damage)),
    isCritical,
    isBlocked,
    isDodged: false,
    damageType: action.element && action.element !== 'none' ? 'magical' : 'physical',
    effects,
    blockedBy: isBlocked ? 'armor' : null
  }
}

/**
 * Calcula el daño base basado en el ataque del jugador y el tipo de acción
 */
function calculateBaseDamage(attacker: CombatStats, action: CombatAction): number {
  let baseDamage = attacker.attack * COMBAT_CONSTANTS.BASE_DAMAGE_MULTIPLIER
  
  // Modificadores por tipo de acción
  switch (action.type) {
    case 'strong_attack':
      baseDamage *= 1.5  // +50% daño
      break
    case 'quick_attack':
      baseDamage *= 0.7  // -30% daño
      break
    case 'attack':
    default:
      baseDamage *= 1.0  // Daño normal
      break
  }
  
  // Modificadores por tipo de arma
  if (action.weaponType) {
    baseDamage *= COMBAT_CONSTANTS.WEAPON_DAMAGE_MULTIPLIERS[action.weaponType]
  }
  
  // Bonus elemental
  if (action.element && action.element !== 'none') {
    baseDamage *= (1 + COMBAT_CONSTANTS.ELEMENT_DAMAGE_BONUS)
  }
  
  return baseDamage
}

/**
 * Calcula la chance de crítico basada en velocidad y tipo de arma
 */
function calculateCriticalChance(attacker: CombatStats, action: CombatAction): number {
  let critChance = COMBAT_CONSTANTS.CRITICAL_CHANCE_BASE
  
  // Bonus por velocidad (máximo 10% adicional)
  const speedBonus = Math.min(attacker.speed * 0.001, 0.1)
  critChance += speedBonus
  
  // Bonus por tipo de arma
  if (action.weaponType === 'dagger') {
    critChance += 0.1  // +10% crítico para dagas
  }
  
  // Bonus por nivel
  critChance += attacker.level * 0.005  // +0.5% por nivel
  
  return Math.min(critChance, 0.4) // Máximo 40% de crítico
}

/**
 * Calcula la chance de esquivar basada en velocidad del defensor
 */
function calculateDodgeChance(target: CombatStats, action: CombatAction): number {
  let dodgeChance = COMBAT_CONSTANTS.DODGE_CHANCE_BASE
  
  // Bonus por velocidad
  dodgeChance += target.speed * COMBAT_CONSTANTS.SPEED_DODGE_BONUS
  
  // Penalización por ataques rápidos (más difíciles de esquivar)
  if (action.type === 'quick_attack') {
    dodgeChance *= 0.7
  }
  
  return Math.min(dodgeChance, COMBAT_CONSTANTS.MAX_DODGE_CHANCE)
}

/**
 * Calcula la chance de bloqueo basada en defensa del defensor
 */
function calculateBlockChance(target: CombatStats, action: CombatAction): number {
  let blockChance = COMBAT_CONSTANTS.BLOCK_CHANCE_BASE
  
  // Bonus por defensa
  blockChance += target.defense * COMBAT_CONSTANTS.DEFENSE_BLOCK_BONUS
  
  // Penalización por ataques fuertes (más difíciles de bloquear)
  if (action.type === 'strong_attack') {
    blockChance *= 0.6
  }
  
  return Math.min(blockChance, COMBAT_CONSTANTS.MAX_BLOCK_CHANCE)
}

/**
 * Calcula la reducción de daño por defensa
 */
function calculateDefenseReduction(target: CombatStats): number {
  const reduction = target.defense * COMBAT_CONSTANTS.DEFENSE_REDUCTION
  return Math.min(reduction, COMBAT_CONSTANTS.MAX_DEFENSE_REDUCTION)
}

/**
 * Calcula el bonus de daño por diferencia de nivel
 */
function calculateLevelBonus(attacker: CombatStats, target: CombatStats): number {
  const levelDiff = attacker.level - target.level
  const bonus = levelDiff * COMBAT_CONSTANTS.LEVEL_DAMAGE_BONUS
  return Math.min(Math.max(bonus, -0.2), COMBAT_CONSTANTS.MAX_LEVEL_BONUS) // Entre -20% y +50%
}

/**
 * Calcula efectos especiales basados en elementos y críticos
 */
function calculateSpecialEffects(
  attacker: CombatStats, 
  target: CombatStats, 
  action: CombatAction, 
  isCritical: boolean
): string[] {
  const effects: string[] = []
  
  // Efectos por elementos
  if (action.element && action.element !== 'none' && Math.random() < COMBAT_CONSTANTS.ELEMENT_EFFECT_CHANCE) {
    switch (action.element) {
      case 'fire':
        effects.push('burning')
        break
      case 'ice':
        effects.push('frozen')
        break
      case 'lightning':
        effects.push('shocked')
        break
      case 'poison':
        effects.push('poisoned')
        break
    }
  }
  
  // Efectos por crítico
  if (isCritical) {
    const criticalEffects = ['stunned', 'bleeding', 'armor_break']
    const randomEffect = criticalEffects[Math.floor(Math.random() * criticalEffects.length)]
    effects.push(randomEffect)
  }
  
  return effects
}

/**
 * Determina el tipo de arma basado en el equipamiento del jugador
 */
export function getWeaponType(equippedWeapon: any): string {
  if (!equippedWeapon) return 'sword'
  
  const weaponName = equippedWeapon.name.toLowerCase()
  
  if (weaponName.includes('axe') || weaponName.includes('hatchet')) return 'axe'
  if (weaponName.includes('mace') || weaponName.includes('hammer')) return 'mace'
  if (weaponName.includes('spear') || weaponName.includes('lance')) return 'spear'
  if (weaponName.includes('staff') || weaponName.includes('wand')) return 'staff'
  if (weaponName.includes('dagger') || weaponName.includes('knife')) return 'dagger'
  
  return 'sword' // Default
}

/**
 * Determina el elemento de un arma basado en su nombre
 */
export function getWeaponElement(equippedWeapon: any): string {
  if (!equippedWeapon) return 'none'
  
  const weaponName = equippedWeapon.name.toLowerCase()
  
  if (weaponName.includes('fire') || weaponName.includes('flame') || weaponName.includes('burn')) return 'fire'
  if (weaponName.includes('ice') || weaponName.includes('frost') || weaponName.includes('cold')) return 'ice'
  if (weaponName.includes('lightning') || weaponName.includes('thunder') || weaponName.includes('electric')) return 'lightning'
  if (weaponName.includes('poison') || weaponName.includes('venom') || weaponName.includes('toxic')) return 'poison'
  
  return 'none'
}

/**
 * Obtiene las stats de combate de un jugador incluyendo equipamiento
 */
export async function getCombatStats(userId: string, baseStats: any): Promise<CombatStats> {
  // Esta función debería usar calculatePlayerStats del combat-system.ts
  // Por ahora retornamos las stats base
  return {
    attack: baseStats.attack || 10,
    defense: baseStats.defense || 5,
    speed: baseStats.speed || 3,
    health: baseStats.health || 100,
    maxHealth: baseStats.health || 100,
    level: baseStats.level || 1
  }
}
