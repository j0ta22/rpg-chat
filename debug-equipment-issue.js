require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugEquipmentIssue() {
  try {
    console.log('🔧 Debugging equipment issue...')
    
    const testUserId = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d' // Jota12
    const testPlayerId = '0563351e-541d-458e-8bd2-75d773d66d4b' // Jota character
    
    console.log(`👤 Testing with user: Jota12 (${testUserId})`)
    
    // Get a test item
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, name, equipment_slot, level_required, rarity')
      .not('equipment_slot', 'is', null)
      .neq('equipment_slot', 'consumable')
      .lte('level_required', 1)
      .limit(1)
    
    if (itemsError || !items || items.length === 0) {
      console.error('❌ No items found:', itemsError)
      return
    }
    
    const testItem = items[0]
    console.log(`📦 Testing with item: ${testItem.name} (${testItem.id})`)
    
    // Test canEquipItem step by step
    console.log('\n🔍 Step 1: Check item details')
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('equipment_slot, level_required, name')
      .eq('id', testItem.id)
      .single()

    if (itemError || !item) {
      console.error('❌ Error fetching item:', itemError)
      return
    }

    console.log('📦 Item found:', { name: item.name, equipment_slot: item.equipment_slot, level_required: item.level_required })

    if (item.equipment_slot === 'consumable') {
      console.log('❌ Cannot equip consumable items')
      return
    }

    console.log('\n🔍 Step 2: Check player level')
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, stats')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (playersError || !players || players.length === 0) {
      console.error('❌ Error fetching player:', playersError)
      return
    }
    
    const player = players[0]
    const userLevel = player.stats?.level || 1
    console.log('👤 Player level check:', { userLevel, requiredLevel: item.level_required })

    if (userLevel < item.level_required) {
      console.log(`❌ Level requirement not met: Requires level ${item.level_required}, you are level ${userLevel}`)
      return
    }

    console.log('\n🔍 Step 3: Check inventory')
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from('player_inventory')
      .select('id, player_id, item_id')
      .eq('player_id', testUserId)
      .eq('item_id', testItem.id)
      .single()

    console.log('📦 Inventory check result:', { inventoryItem, inventoryError })

    if (inventoryError || !inventoryItem) {
      console.log(`❌ Item not found in inventory: ${inventoryError?.message || 'No inventory item found'}`)
      
      // Check if user has any inventory items
      const { data: allInventory, error: allInventoryError } = await supabase
        .from('player_inventory')
        .select('id, player_id, item_id, items(name)')
        .eq('player_id', testUserId)
        .limit(5)
      
      console.log('📦 All inventory items:', { allInventory, allInventoryError })
      return
    }

    console.log('✅ All checks passed - item should be equippable')
    
    // Test the actual canEquipItem function
    console.log('\n🔍 Step 4: Test canEquipItem function')
    const canEquipResult = await canEquipItem(testUserId, testItem.id)
    console.log('🔍 canEquipItem result:', canEquipResult)
    
  } catch (error) {
    console.error('❌ Error in debug:', error)
    console.error('Error details:', error.message, error.stack)
  }
}

// Simulate the canEquipItem function
async function canEquipItem(userId, itemId) {
  try {
    console.log('🔍 canEquipItem called with:', { userId, itemId })
    
    // Get the item
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

    // Get player level
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
    const userLevel = player.stats?.level || 1
    console.log('👤 Player level check:', { userLevel, requiredLevel: item.level_required })

    if (userLevel < item.level_required) {
      return { canEquip: false, reason: `Requires level ${item.level_required}, you are level ${userLevel}` }
    }

    // Check if player has the item in inventory
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from('player_inventory')
      .select('id')
      .eq('player_id', userId)
      .eq('item_id', itemId)
      .single()

    if (inventoryError || !inventoryItem) {
      console.log('❌ Inventory check failed:', { inventoryError, inventoryItem })
      return { canEquip: false, reason: 'Item not found in inventory' }
    }

    console.log('✅ Item can be equipped')
    return { canEquip: true }
  } catch (error) {
    console.error('Error in canEquipItem:', error)
    console.error('Error details:', error.message, error.stack)
    return { canEquip: false, reason: 'Unknown error' }
  }
}

debugEquipmentIssue()