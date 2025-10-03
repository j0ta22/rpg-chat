const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQLUpdate() {
  try {
    console.log('🔄 Reading SQL file...')
    const sqlContent = fs.readFileSync('update-items-sql.sql', 'utf8')
    
    console.log('📦 Executing SQL update...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Error executing SQL:', error)
      return
    }
    
    console.log('✅ SQL update completed successfully!')
    
    // Verify the update
    console.log('🔍 Verifying update...')
    const { data: items, error: verifyError } = await supabase
      .from('items')
      .select('name, rarity, item_type')
      .order('rarity', { ascending: false })
      .order('name', { ascending: true })
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      return
    }
    
    console.log(`✅ Found ${items.length} items in database`)
    
    // Show summary by rarity
    const rarityCount = items.reduce((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📊 Items by rarity:')
    Object.entries(rarityCount).forEach(([rarity, count]) => {
      console.log(`  ${rarity}: ${count} items`)
    })
    
    console.log('\n🎉 Database update completed successfully!')
    
  } catch (error) {
    console.error('❌ Error updating database:', error)
  }
}

executeSQLUpdate()
