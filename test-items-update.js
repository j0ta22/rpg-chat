const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateItems() {
  try {
    console.log('🔄 Starting database update...')
    
    // First, clear existing items
    console.log('🗑️ Clearing existing items...')
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.error('❌ Error clearing items:', deleteError)
      return
    }
    
    console.log('✅ Existing items cleared')
    
    // Insert a few test items first
    const testItems = [
      { name: 'Studded Helmet', description: 'Reinforced headgear', item_type: 'armor', rarity: 'uncommon', stat_bonuses: { defense: 5 }, price: 12, icon_url: '/Items Pack/armor/uncommon/studded_helmet.png', level_required: 4, equipment_slot: 'helmet' },
      { name: 'Leather Cap', description: 'Sturdy headgear', item_type: 'armor', rarity: 'common', stat_bonuses: { defense: 3 }, price: 7, icon_url: '/Items Pack/armor/common/leather_cap.png', level_required: 2, equipment_slot: 'helmet' },
      { name: 'Short Sword', description: 'A quick and agile blade', item_type: 'weapon', rarity: 'common', stat_bonuses: { attack: 4, speed: 1 }, price: 10, icon_url: '/Items Pack/weapons/common/short_sword.png', level_required: 1, equipment_slot: 'weapon' }
    ]
    
    console.log('📦 Inserting test items...')
    const { data, error } = await supabase
      .from('items')
      .insert(testItems)
      .select()
    
    if (error) {
      console.error('❌ Error inserting items:', error)
      return
    }
    
    console.log(`✅ Successfully inserted ${data.length} test items`)
    console.log('🎉 Test update completed successfully!')
    
  } catch (error) {
    console.error('❌ Error updating database:', error)
  }
}

updateItems()
