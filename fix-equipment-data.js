require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixEquipmentData() {
  try {
    console.log('🔧 Starting equipment data fix...')
    
    // First, check current state
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, name, item_type, rarity, equipment_slot, level_required')
    
    if (fetchError) {
      console.error('❌ Error fetching items:', fetchError)
      return
    }
    
    console.log(`📦 Found ${items.length} items`)
    console.log(`Items with equipment_slot: ${items.filter(i => i.equipment_slot).length}`)
    console.log(`Items with level_required: ${items.filter(i => i.level_required).length}`)
    
    // Update items that need fixing
    const itemsToUpdate = items.filter(item => 
      !item.equipment_slot || !item.level_required
    )
    
    console.log(`🔧 Updating ${itemsToUpdate.length} items...`)
    
    for (const item of itemsToUpdate) {
      const equipmentSlot = getEquipmentSlot(item.name, item.item_type)
      const levelRequired = getLevelRequired(item.rarity)
      
      const { error: updateError } = await supabase
        .from('items')
        .update({
          equipment_slot: equipmentSlot,
          level_required: levelRequired
        })
        .eq('id', item.id)
      
      if (updateError) {
        console.error(`❌ Error updating item ${item.name}:`, updateError)
      } else {
        console.log(`✅ Updated ${item.name}: ${equipmentSlot} (level ${levelRequired})`)
      }
    }
    
    // Verify the update
    const { data: updatedItems, error: verifyError } = await supabase
      .from('items')
      .select('equipment_slot, level_required')
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      return
    }
    
    console.log('\n📊 Final status:')
    console.log(`Items with equipment_slot: ${updatedItems.filter(i => i.equipment_slot).length}`)
    console.log(`Items with level_required: ${updatedItems.filter(i => i.level_required).length}`)
    
    // Show sample items by equipment slot
    const { data: sampleItems, error: sampleError } = await supabase
      .from('items')
      .select('name, equipment_slot, level_required, rarity')
      .not('equipment_slot', 'is', null)
      .order('level_required')
      .limit(10)
    
    if (!sampleError && sampleItems) {
      console.log('\n📋 Sample items:')
      sampleItems.forEach(item => {
        console.log(`  ${item.name} - ${item.equipment_slot} (level ${item.level_required})`)
      })
    }
    
    console.log('\n✅ Equipment data fix completed!')
    
  } catch (error) {
    console.error('❌ Error in equipment data fix:', error)
  }
}

function getEquipmentSlot(name, itemType) {
  const lowerName = name.toLowerCase()
  
  if (itemType === 'weapon') return 'weapon'
  if (itemType === 'armor') return 'chest'
  if (itemType === 'accessory') return 'accessory'
  if (itemType === 'consumable') return 'consumable'
  
  if (lowerName.includes('helmet') || lowerName.includes('crown') || lowerName.includes('cap') || lowerName.includes('hat')) {
    return 'helmet'
  }
  if (lowerName.includes('chest') || lowerName.includes('armor') || lowerName.includes('vest') || lowerName.includes('plate')) {
    return 'chest'
  }
  if (lowerName.includes('legs') || lowerName.includes('pants') || lowerName.includes('leggings') || lowerName.includes('trousers')) {
    return 'legs'
  }
  if (lowerName.includes('boots') || lowerName.includes('shoes') || lowerName.includes('footwear')) {
    return 'boots'
  }
  if (lowerName.includes('gloves') || lowerName.includes('gauntlets') || lowerName.includes('hand')) {
    return 'gloves'
  }
  if (lowerName.includes('necklace') || lowerName.includes('ring') || lowerName.includes('amulet') || lowerName.includes('pendant')) {
    return 'accessory'
  }
  
  return 'weapon' // Default to weapon
}

function getLevelRequired(rarity) {
  switch (rarity) {
    case 'common': return 1
    case 'uncommon': return 4
    case 'rare': return 8
    case 'epic': return 12
    case 'legendary': return 16
    default: return 1
  }
}

fixEquipmentData()
