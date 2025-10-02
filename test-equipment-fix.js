require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Import the functions from the TypeScript file
async function testEquipmentSystem() {
  try {
    console.log('🔧 Testing equipment system...')
    
    // Use specific test user
    const testUserId = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d' // Jota12
    const testPlayerId = '0563351e-541d-458e-8bd2-75d773d66d4b' // Jota character
    
    console.log(`👤 Testing with user: Jota12 (${testUserId})`)
    
    // Get player data
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('stats')
      .eq('id', testPlayerId)
      .single()
    
    if (playerError || !player) {
      console.error('❌ No player found:', playerError)
      return
    }
    
    const userLevel = player.stats?.level || 1
    console.log(`📊 User level: ${userLevel}`)
    
    // Get items that can be equipped
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, name, equipment_slot, level_required, rarity')
      .not('equipment_slot', 'is', null)
      .neq('equipment_slot', 'consumable')
      .lte('level_required', userLevel)
      .limit(5)
    
    if (itemsError || !items || items.length === 0) {
      console.error('❌ No equippable items found:', itemsError)
      return
    }
    
    console.log(`📦 Found ${items.length} equippable items:`)
    items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} - ${item.equipment_slot} (level ${item.level_required})`)
    })
    
    // Test canEquipItem function
    const testItem = items[0]
    console.log(`\n🔍 Testing canEquipItem for: ${testItem.name}`)
    
    // Simulate the canEquipItem logic
    const canEquip = await canEquipItem(testUserId, testItem.id)
    console.log(`  Can equip: ${canEquip.canEquip}`)
    if (!canEquip.canEquip) {
      console.log(`  Reason: ${canEquip.reason}`)
    }
    
    // Test getUserEquipment
    console.log(`\n⚔️ Testing getUserEquipment...`)
    const equipment = await getUserEquipment(testUserId)
    console.log('Current equipment:', equipment)
    
    console.log('\n✅ Equipment system test completed!')
    
  } catch (error) {
    console.error('❌ Error in equipment system test:', error)
  }
}

// Simulate the canEquipItem function
async function canEquipItem(userId, itemId) {
  try {
    console.log('🔍 Checking if item can be equipped:', { userId, itemId })
    
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

    // Get player level - use the specific player ID
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('stats')
      .eq('id', '0563351e-541d-458e-8bd2-75d773d66d4b') // Jota character
      .single()

    if (playerError || !player) {
      console.error('❌ Error fetching player level:', playerError)
      return { canEquip: false, reason: 'Player not found' }
    }

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
      return { canEquip: false, reason: 'Item not found in inventory' }
    }

    console.log('✅ Item can be equipped')
    return { canEquip: true }
  } catch (error) {
    console.error('Error checking if item can be equipped:', error)
    return { canEquip: false, reason: 'Unknown error' }
  }
}

// Simulate the getUserEquipment function
async function getUserEquipment(userId) {
  try {
    // Get the equipment record
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

    // Map items to their slots
    const itemMap = new Map(items.map(item => [item.id, item]))

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

testEquipmentSystem()
