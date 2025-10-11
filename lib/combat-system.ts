import { supabase } from './supabase'

export interface CombatResult {
  winner: string | null
  player1Stats: any
  player2Stats: any
  duration: number
}

export interface PlayerRanking {
  username: string
  wins: number
  losses: number
  winRate: number
  totalCombats: number
  rank: number
}

export interface Item {
  id: string
  name: string
  description: string
  itemType: 'weapon' | 'armor' | 'accessory' | 'consumable'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  statBonuses: {
    attack?: number
    defense?: number
    speed?: number
    health?: number
    health_restore?: number
    mana_restore?: number
    attack_boost?: number
    defense_boost?: number
    speed_boost?: number
  }
  price: number
  iconUrl?: string
  levelRequired: number
  equipmentSlot: 'helmet' | 'chest' | 'legs' | 'boots' | 'gloves' | 'weapon' | 'accessory' | 'consumable'
}

export interface EquipmentSlot {
  slot: 'helmet' | 'chest' | 'legs' | 'boots' | 'gloves' | 'weapon' | 'accessory'
  item: Item | null
}

export interface UserEquipment {
  helmet: Item | null
  chest: Item | null
  legs: Item | null
  boots: Item | null
  gloves: Item | null
  weapon: Item | null
  accessory: Item | null
}

export interface PlayerInventoryItem {
  id: string
  item: Item
  quantity: number
  equipped: boolean
  acquiredDate: string
}

// Función para calcular stats del jugador con items equipados
export async function calculatePlayerStats(userId: string, baseStats: any) {
  try {
    console.log('🔧 Calculating player stats with equipment bonuses:', { userId, baseStats })
    
    // Obtener el equipamiento del jugador desde user_equipment
    const { data: equipment, error: equipmentError } = await supabase
      .from('user_equipment')
      .select(`
        helmet_item_id,
        chest_item_id,
        legs_item_id,
        boots_item_id,
        gloves_item_id,
        weapon_item_id,
        accessory_item_id
      `)
      .eq('user_id', userId)
      .single()

    if (equipmentError && equipmentError.code !== 'PGRST116') {
      console.error('Error fetching user equipment:', equipmentError)
      return baseStats
    }

    let finalStats = { ...baseStats }
    console.log('📊 Base stats:', finalStats)
    
    if (equipment) {
      // Obtener IDs de todos los items equipados
      const equippedItemIds = [
        equipment.helmet_item_id,
        equipment.chest_item_id,
        equipment.legs_item_id,
        equipment.boots_item_id,
        equipment.gloves_item_id,
        equipment.weapon_item_id,
        equipment.accessory_item_id
      ].filter(Boolean)

      if (equippedItemIds.length > 0) {
        console.log('⚔️ Found equipped items:', equippedItemIds.length)
        
        // Obtener detalles de los items equipados
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('id, name, stat_bonuses')
          .in('id', equippedItemIds)

        if (itemsError) {
          console.error('Error fetching item details:', itemsError)
          return baseStats
        }

        if (items && items.length > 0) {
          items.forEach((item, index) => {
            if (item?.stat_bonuses) {
              console.log(`📦 Item ${index + 1} (${item.name}) bonuses:`, item.stat_bonuses)
              Object.entries(item.stat_bonuses).forEach(([stat, bonus]) => {
                if (typeof bonus === 'number') {
                  const oldValue = finalStats[stat] || 0
                  finalStats[stat] = oldValue + bonus
                  console.log(`  +${bonus} ${stat}: ${oldValue} → ${finalStats[stat]}`)
                }
              })
            }
          })
        }
      } else {
        console.log('📦 No equipped items found')
      }
    } else {
      console.log('📦 No equipment record found')
    }

    console.log('📊 Final stats with equipment:', finalStats)
    return finalStats
  } catch (error) {
    console.error('Error calculating player stats:', error)
    return baseStats
  }
}

// Función para iniciar un combate
export async function startCombat(player1Id: string, player2Id: string, player1Stats: any, player2Stats: any) {
  try {
    console.log('⚔️ Starting combat between players:', player1Id, 'vs', player2Id)
    
    const player1FinalStats = await calculatePlayerStats(player1Id, player1Stats)
    const player2FinalStats = await calculatePlayerStats(player2Id, player2Stats)
    
    const combatResult = simulateCombat(player1FinalStats, player2FinalStats)
    
    const { data: combat, error } = await supabase
      .from('combats')
      .insert({
        player1_id: player1Id,
        player2_id: player2Id,
        winner_id: combatResult.winner ? (combatResult.winner === 'player1' ? player1Id : player2Id) : null,
        player1_stats: player1FinalStats,
        player2_stats: player2FinalStats,
        combat_duration: combatResult.duration
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving combat:', error)
      return null
    }

    await updatePlayerCombatStats(player1Id, player2Id, combatResult.winner)
    
    // Dar recompensas al ganador si hay uno
    if (combatResult.winner) {
      const winnerId = combatResult.winner === 'player1' ? player1Id : player2Id
      await giveCombatRewards(winnerId)
    }
    
    return combat
  } catch (error) {
    console.error('Error starting combat:', error)
    return null
  }
}

// Función para simular el combate
function simulateCombat(player1Stats: any, player2Stats: any): CombatResult {
  const duration = Math.floor(Math.random() * 30) + 10
  
  const player1Power = calculateCombatPower(player1Stats)
  const player2Power = calculateCombatPower(player2Stats)
  
  const randomFactor = (Math.random() - 0.5) * 0.2
  const player1FinalPower = player1Power * (1 + randomFactor)
  const player2FinalPower = player2Power * (1 - randomFactor)
  
  let winner: string | null = null
  if (player1FinalPower > player2FinalPower) {
    winner = 'player1'
  } else if (player2FinalPower > player1FinalPower) {
    winner = 'player2'
  }
  
  return {
    winner,
    player1Stats,
    player2Stats,
    duration
  }
}

// Función para calcular el poder de combate
function calculateCombatPower(stats: any): number {
  const attack = stats.attack || 0
  const defense = stats.defense || 0
  const speed = stats.speed || 0
  const health = stats.health || 100
  
  return attack + defense + speed + (health / 10)
}

// Función para actualizar estadísticas de combate
async function updatePlayerCombatStats(player1Id: string, player2Id: string, winner: string | null) {
  try {
    if (winner === 'player1') {
      await supabase.rpc('increment_user_wins', { user_id: player1Id })
      await supabase.rpc('increment_user_losses', { user_id: player2Id })
    } else if (winner === 'player2') {
      await supabase.rpc('increment_user_wins', { user_id: player2Id })
      await supabase.rpc('increment_user_losses', { user_id: player1Id })
    }
    
    await updateWinRate(player1Id)
    await updateWinRate(player2Id)
  } catch (error) {
    console.error('Error updating combat stats:', error)
  }
}

// Función para actualizar win rate
async function updateWinRate(userId: string) {
  try {
    // Use the RPC function for better performance
    const { error } = await supabase
      .rpc('update_user_ranking_stats', { user_id: userId })

    if (error) {
      console.error('Error updating win rate via RPC:', error)
      
      // Fallback to manual calculation
      const { data: user } = await supabase
        .from('users')
        .select('total_wins, total_losses')
        .eq('id', userId)
        .single()

      if (user) {
        const totalCombats = user.total_wins + user.total_losses
        const winRate = totalCombats > 0 ? (user.total_wins / totalCombats) * 100 : 0
        
        await supabase
          .from('users')
          .update({ win_rate: winRate })
          .eq('id', userId)
      }
    }
  } catch (error) {
    console.error('Error updating win rate:', error)
  }
}

// Función para obtener el ranking de jugadores
export async function getPlayerRanking(): Promise<PlayerRanking[]> {
  try {
    console.log('🏆 getPlayerRanking: Starting to fetch rankings...')
    
    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name, user_id')
      .limit(50)

    if (playersError) {
      console.error('Error fetching players:', playersError)
      return []
    }

    if (!players || players.length === 0) {
      console.log('No players found')
      return []
    }

    // Get user stats for all players
    const userIds = players.map(p => p.user_id).filter(id => id)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, total_wins, total_losses, win_rate')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching user stats:', usersError)
      return []
    }

    // Combine players with their user stats
    const playerRankings = players
      .map(player => {
        const userStats = users?.find(u => u.id === player.user_id)
        return {
          username: player.name, // Use player name instead of username
          wins: userStats?.total_wins || 0,
          losses: userStats?.total_losses || 0,
          winRate: userStats?.win_rate || 0,
          totalCombats: (userStats?.total_wins || 0) + (userStats?.total_losses || 0),
          playerId: player.id,
          userId: player.user_id
        }
      })
      .sort((a, b) => {
        // Sort by win rate first, then by total wins
        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate
        }
        return b.wins - a.wins
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }))

    console.log('Players query successful, found', playerRankings.length, 'players')
    return playerRankings
  } catch (error) {
    console.error('Error getting player ranking:', error)
    return []
  }
}

// Función para obtener el catálogo de items
export async function getItemCatalog(): Promise<Item[]> {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .order('rarity', { ascending: false })
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching items:', error)
      return []
    }

    return items?.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      itemType: item.item_type,
      rarity: item.rarity,
      statBonuses: item.stat_bonuses || {},
      price: item.price,
      iconUrl: item.icon_url,
      levelRequired: item.level_required || 1,
      equipmentSlot: item.equipment_slot || 'consumable'
    })) || []
  } catch (error) {
    console.error('Error getting item catalog:', error)
    return []
  }
}

// Función para obtener el inventario del jugador
export async function getPlayerInventory(userId: string): Promise<PlayerInventoryItem[]> {
  try {
    console.log('📦 Loading player inventory for user:', userId)
    
    const { data: inventory, error } = await supabase
      .from('player_inventory')
      .select(`
        id,
        quantity,
        equipped,
        acquired_date,
        items (
          id,
          name,
          description,
          item_type,
          rarity,
          stat_bonuses,
          price,
          icon_url,
          level_required,
          equipment_slot
        )
      `)
      .eq('player_id', userId)
      .order('equipped', { ascending: false })
      .order('acquired_date', { ascending: false })

    console.log('📦 Inventory query result:', { inventory, error })

    if (error) {
      console.error('❌ Error fetching inventory:', error)
      return []
    }

    const mappedInventory = inventory?.map(inv => ({
      id: inv.id,
      item: {
        id: inv.items.id,
        name: inv.items.name,
        description: inv.items.description,
        itemType: inv.items.item_type,
        rarity: inv.items.rarity,
        statBonuses: inv.items.stat_bonuses || {},
        price: inv.items.price,
        iconUrl: inv.items.icon_url,
        levelRequired: inv.items.level_required || 1,
        equipmentSlot: inv.items.equipment_slot || 'consumable'
      },
      quantity: inv.quantity,
      equipped: inv.equipped,
      acquiredDate: inv.acquired_date
    })) || []
    
    console.log('📦 Mapped inventory result:', mappedInventory.length, 'items')
    return mappedInventory
  } catch (error) {
    console.error('Error getting player inventory:', error)
    return []
  }
}

// Función para comprar un item
export async function buyItem(userId: string, itemId: string): Promise<boolean> {
  return await buyItemWithPrice(userId, itemId)
}

// Función para equipar/desequipar un item
export async function toggleItemEquip(userId: string, inventoryItemId: string): Promise<boolean> {
  try {
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('player_inventory')
      .select('equipped, items(item_type)')
      .eq('id', inventoryItemId)
      .eq('player_id', userId)
      .single()

    if (fetchError || !inventoryItem) {
      console.error('Error fetching inventory item:', fetchError)
      return false
    }

    const newEquippedState = !inventoryItem.equipped
    const itemType = inventoryItem.items.item_type

    if (newEquippedState && itemType !== 'consumable') {
      await supabase
        .from('player_inventory')
        .update({ equipped: false })
        .eq('player_id', userId)
        .eq('equipped', true)
        .in('item_id', 
          supabase
            .from('items')
            .select('id')
            .eq('item_type', itemType)
        )
    }

    const { error: updateError } = await supabase
      .from('player_inventory')
      .update({ equipped: newEquippedState })
      .eq('id', inventoryItemId)

    if (updateError) {
      console.error('Error updating item equip status:', updateError)
      return false
    }

    console.log('✅ Item equip status updated')
    return true
  } catch (error) {
    console.error('Error toggling item equip:', error)
    return false
  }
}

// Función para obtener el equipamiento del jugador
export async function getUserEquipment(userId: string): Promise<UserEquipment> {
  try {
    // First, get the equipment record
    const { data: equipment, error } = await supabase
      .from('user_equipment')
      .select(`
        helmet_item_id,
        chest_item_id,
        legs_item_id,
        boots_item_id,
        gloves_item_id,
        weapon_item_id,
        accessory_item_id
      `)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user equipment:', error)
      return {
        helmet: null,
        chest: null,
        legs: null,
        boots: null,
        gloves: null,
        weapon: null,
        accessory: null
      }
    }

    if (!equipment) {
      return {
        helmet: null,
        chest: null,
        legs: null,
        boots: null,
        gloves: null,
        weapon: null,
        accessory: null
      }
    }

    // Get item details for each equipped item
    const itemIds = [
      equipment.helmet_item_id,
      equipment.chest_item_id,
      equipment.legs_item_id,
      equipment.boots_item_id,
      equipment.gloves_item_id,
      equipment.weapon_item_id,
      equipment.accessory_item_id
    ].filter(Boolean)

    let items = []
    if (itemIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, name, description, item_type, rarity, stat_bonuses, price, icon_url, level_required, equipment_slot')
        .in('id', itemIds)

      if (itemsError) {
        console.error('Error fetching item details:', itemsError)
        items = []
      } else {
        items = itemsData || []
      }
    }

    // Map items to their slots and convert to Item interface
    const itemMap = new Map(items.map(item => [
      item.id, 
      {
        id: item.id,
        name: item.name,
        description: item.description,
        itemType: item.item_type,
        rarity: item.rarity,
        statBonuses: item.stat_bonuses || {},
        price: item.price,
        iconUrl: item.icon_url,
        levelRequired: item.level_required || 1,
        equipmentSlot: item.equipment_slot || 'consumable'
      }
    ]))

    return {
      helmet: equipment.helmet_item_id ? itemMap.get(equipment.helmet_item_id) || null : null,
      chest: equipment.chest_item_id ? itemMap.get(equipment.chest_item_id) || null : null,
      legs: equipment.legs_item_id ? itemMap.get(equipment.legs_item_id) || null : null,
      boots: equipment.boots_item_id ? itemMap.get(equipment.boots_item_id) || null : null,
      gloves: equipment.gloves_item_id ? itemMap.get(equipment.gloves_item_id) || null : null,
      weapon: equipment.weapon_item_id ? itemMap.get(equipment.weapon_item_id) || null : null,
      accessory: equipment.accessory_item_id ? itemMap.get(equipment.accessory_item_id) || null : null
    }
  } catch (error) {
    console.error('Error getting user equipment:', error)
    return {
      helmet: null,
      chest: null,
      legs: null,
      boots: null,
      gloves: null,
      weapon: null,
      accessory: null
    }
  }
}

// Función para verificar si un item puede ser equipado
export async function canEquipItem(userId: string, itemId: string): Promise<{ canEquip: boolean; reason?: string }> {
  try {
    console.log('🔍 Checking if item can be equipped:', { userId, itemId })
    
    // Obtener el item para verificar el slot y nivel requerido
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('equipment_slot, level_required, name')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      console.error('❌ Error fetching item:', itemError)
      return { canEquip: false, reason: 'Item not found' }
    }

    console.log('📦 Item found:', { name: item.name, equipment_slot: item.equipment_slot, level_required: item.level_required })

    if (item.equipment_slot === 'consumable') {
      return { canEquip: false, reason: 'Cannot equip consumable items' }
    }

    // Obtener el nivel del jugador desde la tabla players
    // Primero obtener el jugador activo del usuario
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, stats')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (playersError || !players || players.length === 0) {
      console.error('❌ Error fetching player:', playersError)
      return { canEquip: false, reason: 'Player not found' }
    }
    
    const player = players[0]

    // Obtener el nivel del personaje desde los stats
    const userLevel = player.stats?.level || 1

    console.log('👤 Player level check:', { userLevel, requiredLevel: item.level_required })

    if (userLevel < item.level_required) {
      return { canEquip: false, reason: `Requires level ${item.level_required}, you are level ${userLevel}` }
    }

    // Verificar que el jugador tiene el item en su inventario
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from('player_inventory')
      .select('id')
      .eq('player_id', userId)
      .eq('item_id', itemId)
      .single()

    if (inventoryError || !inventoryItem) {
      return { canEquip: false, reason: 'Item not found in inventory' }
    }

    console.log('✅ Item can be equipped')
    return { canEquip: true }
  } catch (error) {
    console.error('Error checking if item can be equipped:', error)
    console.error('Error details:', error.message, error.stack)
    return { canEquip: false, reason: 'Unknown error' }
  }
}

// Función para equipar un item
export async function equipItem(userId: string, itemId: string): Promise<{ success: boolean; reason?: string }> {
  try {
    console.log('🔧 Attempting to equip item:', { userId, itemId })
    
    // Verificar si el item puede ser equipado
    const canEquip = await canEquipItem(userId, itemId)
    console.log('🔍 canEquip result:', canEquip)
    if (!canEquip.canEquip) {
      console.error('❌ Cannot equip item:', canEquip.reason)
      return { success: false, reason: canEquip.reason }
    }

    // Obtener el item para verificar el slot
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('equipment_slot, level_required, name')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      console.error('❌ Error fetching item:', itemError)
      return { success: false, reason: 'Item not found' }
    }

    console.log('📦 Item found:', { name: item.name, equipment_slot: item.equipment_slot, level_required: item.level_required })

    // Crear o actualizar el equipamiento
    const slotField = `${item.equipment_slot}_item_id`
    console.log('🔧 Equipping to slot:', slotField)
    
    const { error: equipError } = await supabase
      .from('user_equipment')
      .upsert({
        user_id: userId,
        [slotField]: itemId
      }, {
        onConflict: 'user_id'
      })

    if (equipError) {
      console.error('❌ Error equipping item:', equipError)
      return { success: false, reason: 'Failed to equip item' }
    }

    console.log('✅ Item equipped successfully to slot:', item.equipment_slot)
    return { success: true }
  } catch (error) {
    console.error('Error equipping item:', error)
    return { success: false, reason: 'Unknown error occurred' }
  }
}

// Función para desequipar un item
export async function unequipItem(userId: string, slot: string): Promise<boolean> {
  try {
    const slotField = `${slot}_item_id`
    const { error } = await supabase
      .from('user_equipment')
      .update({ [slotField]: null })
      .eq('user_id', userId)

    if (error) {
      console.error('Error unequipping item:', error)
      return false
    }

    console.log('✅ Item unequipped successfully')
    return true
  } catch (error) {
    console.error('Error unequipping item:', error)
    return false
  }
}

// Función para vender un item
export async function sellItem(userId: string, inventoryItemId: string): Promise<boolean> {
  try {
    // Obtener el item del inventario
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('player_inventory')
      .select(`
        item_id,
        items (price)
      `)
      .eq('id', inventoryItemId)
      .eq('player_id', userId)
      .single()

    if (fetchError || !inventoryItem) {
      console.error('Error fetching inventory item:', fetchError)
      return false
    }

    const sellPrice = Math.floor(inventoryItem.items.price * 0.5) // 50% del precio original

    // Eliminar el item del inventario
    const { error: deleteError } = await supabase
      .from('player_inventory')
      .delete()
      .eq('id', inventoryItemId)

    if (deleteError) {
      console.error('Error deleting inventory item:', deleteError)
      return false
    }

    // Agregar oro al jugador
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('gold')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user gold:', userError)
      return false
    }

    await supabase
      .from('users')
      .update({ gold: user.gold + sellPrice })
      .eq('id', userId)

    console.log('✅ Item sold successfully')
    return true
  } catch (error) {
    console.error('Error selling item:', error)
    return false
  }
}

// Función para obtener el tamaño del inventario del jugador
export async function getInventorySize(userId: string): Promise<{ current: number; max: number }> {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('inventory_size')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching inventory size:', userError)
      return { current: 0, max: 20 }
    }

    const { count: currentSize, error: countError } = await supabase
      .from('player_inventory')
      .select('*', { count: 'exact' })
      .eq('player_id', userId)

    if (countError) {
      console.error('Error counting inventory items:', countError)
      return { current: 0, max: user.inventory_size || 20 }
    }

    return {
      current: currentSize || 0,
      max: user.inventory_size || 20
    }
  } catch (error) {
    console.error('Error getting inventory size:', error)
    return { current: 0, max: 20 }
  }
}

// Función para dar recompensas por combate
export async function giveCombatRewards(winnerId: string): Promise<boolean> {
  try {
    console.log('🏆 Giving combat rewards to winner:', winnerId)
    
    // 1. Dar 20 de oro
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('gold')
      .eq('id', winnerId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user gold:', userError)
      return false
    }

    const newGold = (user.gold || 0) + 20
    await supabase
      .from('users')
      .update({ gold: newGold })
      .eq('id', winnerId)

    console.log('💰 Added 20 gold to winner. New total:', newGold)

    // 2. Dar un item aleatorio
    const randomItem = await getRandomItem()
    if (randomItem) {
      const success = await buyItemWithPrice(winnerId, randomItem.id, 0) // Precio 0 porque es recompensa
      if (success) {
        console.log('🎁 Gave random item to winner:', randomItem.name)
      } else {
        console.error('❌ Failed to give item to winner')
      }
    }

    return true
  } catch (error) {
    console.error('Error giving combat rewards:', error)
    return false
  }
}

// Función para obtener un item aleatorio basado en probabilidades de rareza
async function getRandomItem(): Promise<Item | null> {
  try {
    // Probabilidades de rareza (mayor rareza = menor probabilidad)
    const rarityWeights = {
      'common': 50,      // 50% probabilidad
      'uncommon': 30,    // 30% probabilidad
      'rare': 15,        // 15% probabilidad
      'epic': 4,         // 4% probabilidad
      'legendary': 1     // 1% probabilidad
    }

    // Generar número aleatorio del 1 al 100
    const random = Math.random() * 100
    let selectedRarity = 'common'
    let cumulativeWeight = 0

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulativeWeight += weight
      if (random <= cumulativeWeight) {
        selectedRarity = rarity
        break
      }
    }

    console.log('🎲 Random item generation:', { random, selectedRarity })

    // Obtener un item aleatorio de la rareza seleccionada
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('rarity', selectedRarity)
      .limit(100) // Limitar para mejor rendimiento

    if (error || !items || items.length === 0) {
      console.error('Error fetching random items:', error)
      return null
    }

    // Seleccionar item aleatorio de la lista
    const randomIndex = Math.floor(Math.random() * items.length)
    const selectedItem = items[randomIndex]

    console.log('🎁 Selected random item:', {
      name: selectedItem.name,
      rarity: selectedItem.rarity,
      levelRequired: selectedItem.level_required
    })

    return {
      id: selectedItem.id,
      name: selectedItem.name,
      description: selectedItem.description,
      itemType: selectedItem.item_type,
      rarity: selectedItem.rarity,
      statBonuses: selectedItem.stat_bonuses || {},
      price: selectedItem.price,
      iconUrl: selectedItem.icon_url,
      levelRequired: selectedItem.level_required || 1,
      equipmentSlot: selectedItem.equipment_slot || 'consumable'
    }
  } catch (error) {
    console.error('Error getting random item:', error)
    return null
  }
}

// Función modificada para comprar items (soporte para precio 0 para recompensas)
export async function buyItemWithPrice(userId: string, itemId: string, customPrice?: number): Promise<boolean> {
  try {
    console.log('🛒 Starting buyItemWithPrice:', { userId, itemId, customPrice })
    
    // Obtener el item
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      console.error('❌ Error fetching item:', itemError)
      return false
    }
    
    console.log('✅ Item found:', { id: item.id, name: item.name, price: item.price })

    const price = customPrice !== undefined ? customPrice : item.price

    // Si el precio es 0, es una recompensa gratuita
    if (price > 0) {
      // Verificar que el jugador tiene suficiente oro
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('gold')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        console.error('Error fetching user gold:', userError)
        return false
      }

      if (user.gold < price) {
        console.error('Insufficient gold')
        return false
      }

      // Descontar oro
      await supabase
        .from('users')
        .update({ gold: user.gold - price })
        .eq('id', userId)
    }

    // Verificar si el jugador ya tiene el item
    const { data: existingItem, error: existingError } = await supabase
      .from('player_inventory')
      .select('*')
      .eq('player_id', userId)
      .eq('item_id', itemId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing item:', existingError)
      return false
    }

    if (existingItem) {
      // Si ya tiene el item, aumentar la cantidad
      console.log('📦 Item already exists, updating quantity:', existingItem.quantity + 1)
      const { error: updateError } = await supabase
        .from('player_inventory')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id)
      
      if (updateError) {
        console.error('❌ Error updating item quantity:', updateError)
        return false
      }
    } else {
      // Si no tiene el item, agregarlo
      console.log('📦 Adding new item to inventory:', { player_id: userId, item_id: itemId })
      const { data: insertData, error: insertError } = await supabase
        .from('player_inventory')
        .insert({
          player_id: userId,
          item_id: itemId,
          quantity: 1,
          equipped: false
        })
        .select()
      
      if (insertError) {
        console.error('❌ Error inserting item to inventory:', insertError)
        return false
      }
      
      console.log('✅ Item inserted successfully:', insertData)
    }

    console.log('✅ Item purchased successfully')
    return true
  } catch (error) {
    console.error('Error buying item:', error)
    return false
  }
}