// Sistema de recompensas y penalizaciones de combate
// Maneja oro, XP, items aleatorios y penalizaciones por diferencia de nivel

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface CombatRewards {
  gold: number
  experience: number
  item?: {
    id: string
    name: string
    rarity: string
    iconUrl: string
  }
  penalties: {
    levelDifference: number
    noRewards: boolean
    reason?: string
  }
}

export interface CombatResult {
  winnerId: string
  loserId: string
  winnerLevel: number
  loserLevel: number
  combatDuration: number
  damageDealt: number
  criticalHits: number
}

// Constantes del sistema de recompensas
export const REWARDS_CONSTANTS = {
  // Oro base
  BASE_GOLD: 25,
  LEVEL_BONUS_GOLD: 5, // +5 oro por nivel del ganador
  MAX_GOLD: 100,
  
  // XP base
  BASE_XP: 50,
  LEVEL_BONUS_XP: 10, // +10 XP por nivel del ganador
  PERFORMANCE_BONUS_XP: 25, // Bonus por daño causado
  SURVIVAL_BONUS_XP: 15, // Bonus por sobrevivir
  MAX_XP: 200,
  
  // Penalización por diferencia de nivel
  MAX_LEVEL_DIFFERENCE: 5, // Máxima diferencia sin penalización
  PENALTY_THRESHOLD: 5, // Diferencia > 5 = sin recompensas
  
  // Probabilidades de drop de items por rareza
  ITEM_DROP_CHANCES: {
    common: 0.40,    // 40% chance
    uncommon: 0.25,  // 25% chance
    rare: 0.15,      // 15% chance
    epic: 0.10,      // 10% chance
    legendary: 0.05  // 5% chance
  },
  
  // XP perdido por el perdedor
  XP_LOSS_BASE: 20,
  XP_LOSS_LEVEL_BONUS: 5, // +5 XP perdido por nivel del perdedor
  MAX_XP_LOSS: 50
}

/**
 * Calcula las recompensas de combate para el ganador
 */
export async function calculateCombatRewards(combatResult: CombatResult): Promise<CombatRewards> {
  console.log('🏆 Calculating combat rewards for:', combatResult.winnerId)
  
  const levelDifference = Math.abs(combatResult.winnerLevel - combatResult.loserLevel)
  const noRewards = levelDifference > REWARDS_CONSTANTS.PENALTY_THRESHOLD
  
  let gold = 0
  let experience = 0
  let item = undefined
  
  if (!noRewards) {
    // Calcular oro
    gold = calculateGoldReward(combatResult.winnerLevel, combatResult.damageDealt)
    
    // Calcular XP
    experience = calculateXPReward(combatResult.winnerLevel, combatResult.damageDealt, combatResult.combatDuration)
    
    // Calcular drop de item
    item = await calculateItemDrop()
  }
  
  const rewards: CombatRewards = {
    gold,
    experience,
    item,
    penalties: {
      levelDifference,
      noRewards,
      reason: noRewards ? `Diferencia de nivel muy grande (${levelDifference} > ${REWARDS_CONSTANTS.PENALTY_THRESHOLD})` : undefined
    }
  }
  
  console.log('💰 Combat rewards calculated:', rewards)
  return rewards
}

/**
 * Calcula la pérdida de XP para el perdedor
 */
export function calculateXPLoss(loserLevel: number, winnerLevel: number): number {
  const levelDifference = Math.abs(winnerLevel - loserLevel)
  
  let xpLoss = REWARDS_CONSTANTS.XP_LOSS_BASE
  xpLoss += loserLevel * REWARDS_CONSTANTS.XP_LOSS_LEVEL_BONUS
  
  // Bonus de pérdida si el perdedor es de nivel mucho mayor
  if (levelDifference > REWARDS_CONSTANTS.PENALTY_THRESHOLD) {
    xpLoss += levelDifference * 2 // +2 XP perdido por cada nivel de diferencia
  }
  
  return Math.min(xpLoss, REWARDS_CONSTANTS.MAX_XP_LOSS)
}

/**
 * Calcula la recompensa de oro
 */
function calculateGoldReward(winnerLevel: number, damageDealt: number): number {
  let gold = REWARDS_CONSTANTS.BASE_GOLD
  gold += winnerLevel * REWARDS_CONSTANTS.LEVEL_BONUS_GOLD
  
  // Bonus por daño causado (máximo 20% extra)
  const damageBonus = Math.min(damageDealt * 0.1, gold * 0.2)
  gold += damageBonus
  
  return Math.min(Math.floor(gold), REWARDS_CONSTANTS.MAX_GOLD)
}

/**
 * Calcula la recompensa de XP
 */
function calculateXPReward(winnerLevel: number, damageDealt: number, combatDuration: number): number {
  let xp = REWARDS_CONSTANTS.BASE_XP
  xp += winnerLevel * REWARDS_CONSTANTS.LEVEL_BONUS_XP
  
  // Bonus por daño causado
  const damageBonus = Math.min(damageDealt * 0.5, REWARDS_CONSTANTS.PERFORMANCE_BONUS_XP)
  xp += damageBonus
  
  // Bonus por duración del combate (combates más largos = más XP)
  const durationBonus = Math.min(combatDuration / 10, REWARDS_CONSTANTS.SURVIVAL_BONUS_XP)
  xp += durationBonus
  
  return Math.min(Math.floor(xp), REWARDS_CONSTANTS.MAX_XP)
}

/**
 * Calcula el drop de item aleatorio
 */
async function calculateItemDrop(): Promise<CombatRewards['item'] | undefined> {
  // Determinar si hay drop (30% chance base)
  if (Math.random() > 0.3) {
    return undefined
  }
  
  // Determinar rareza del item
  const rarity = determineItemRarity()
  
  // Obtener item aleatorio de esa rareza
  const item = await getRandomItemByRarity(rarity)
  
  return item
}

/**
 * Determina la rareza del item basado en probabilidades
 */
function determineItemRarity(): string {
  const random = Math.random()
  let cumulative = 0
  
  for (const [rarity, chance] of Object.entries(REWARDS_CONSTANTS.ITEM_DROP_CHANCES)) {
    cumulative += chance
    if (random <= cumulative) {
      return rarity
    }
  }
  
  return 'common' // Fallback
}

/**
 * Obtiene un item aleatorio de una rareza específica
 */
async function getRandomItemByRarity(rarity: string): Promise<CombatRewards['item'] | undefined> {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('id, name, rarity, icon_url')
      .eq('rarity', rarity)
      .limit(100)
    
    if (error || !items || items.length === 0) {
      console.error('Error fetching items by rarity:', error)
      return undefined
    }
    
    const randomIndex = Math.floor(Math.random() * items.length)
    const selectedItem = items[randomIndex]
    
    return {
      id: selectedItem.id,
      name: selectedItem.name,
      rarity: selectedItem.rarity,
      iconUrl: selectedItem.icon_url
    }
  } catch (error) {
    console.error('Error getting random item:', error)
    return undefined
  }
}

/**
 * Aplica las recompensas al ganador
 */
export async function applyWinnerRewards(userId: string, rewards: CombatRewards): Promise<boolean> {
  try {
    console.log('🎁 Applying winner rewards to user:', userId)
    
    // Actualizar oro
    if (rewards.gold > 0) {
      const { error: goldError } = await supabase.rpc('increment_user_gold', {
        user_id: userId,
        amount: rewards.gold
      })
      
      if (goldError) {
        console.error('Error updating gold:', goldError)
        return false
      }
      
      console.log('💰 Added gold:', rewards.gold)
    }
    
    // Actualizar XP
    if (rewards.experience > 0) {
      const { error: xpError } = await supabase.rpc('add_user_experience', {
        user_id: userId,
        xp_amount: rewards.experience
      })
      
      if (xpError) {
        console.error('Error updating XP:', xpError)
        return false
      }
      
      console.log('⭐ Added XP:', rewards.experience)
    }
    
    // Agregar item al inventario
    if (rewards.item) {
      const { error: itemError } = await supabase
        .from('player_inventory')
        .insert({
          user_id: userId,
          item_id: rewards.item.id,
          quantity: 1
        })
      
      if (itemError) {
        console.error('Error adding item to inventory:', itemError)
        return false
      }
      
      console.log('🎁 Added item to inventory:', rewards.item.name)
    }
    
    return true
  } catch (error) {
    console.error('Error applying winner rewards:', error)
    return false
  }
}

/**
 * Aplica la pérdida de XP al perdedor
 */
export async function applyLoserPenalty(userId: string, xpLoss: number): Promise<boolean> {
  try {
    console.log('💀 Applying XP loss to user:', userId, 'Loss:', xpLoss)
    
    const { error } = await supabase.rpc('remove_user_experience', {
      user_id: userId,
      xp_amount: xpLoss
    })
    
    if (error) {
      console.error('Error removing XP:', error)
      return false
    }
    
    console.log('📉 Removed XP:', xpLoss)
    return true
  } catch (error) {
    console.error('Error applying XP loss:', error)
    return false
  }
}

/**
 * Obtiene el resumen de recompensas para mostrar al jugador
 */
export function getRewardsSummary(rewards: CombatRewards, isWinner: boolean): string {
  if (!isWinner) {
    return 'No recibiste recompensas por perder el combate.'
  }
  
  if (rewards.penalties.noRewards) {
    return `No recibiste recompensas: ${rewards.penalties.reason}`
  }
  
  let summary = `¡Recompensas recibidas!\n`
  
  if (rewards.gold > 0) {
    summary += `💰 Oro: +${rewards.gold}\n`
  }
  
  if (rewards.experience > 0) {
    summary += `⭐ XP: +${rewards.experience}\n`
  }
  
  if (rewards.item) {
    summary += `🎁 Item: ${rewards.item.name} (${rewards.item.rarity})\n`
  }
  
  return summary.trim()
}

/**
 * Obtiene el resumen de penalización para mostrar al jugador
 */
export function getPenaltySummary(xpLoss: number, levelDifference: number): string {
  let summary = `Penalización por perder:\n`
  summary += `📉 XP perdido: -${xpLoss}\n`
  
  if (levelDifference > REWARDS_CONSTANTS.PENALTY_THRESHOLD) {
    summary += `⚠️ Diferencia de nivel alta: ${levelDifference} niveles`
  }
  
  return summary
}
