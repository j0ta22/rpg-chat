// Check if there are any combats in the database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xxdnqqgwqetwgayqjlrm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZG5xcWd3cWV0d2dheXFqbHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTgzMzksImV4cCI6MjA3NDY3NDMzOX0.GNok2n1dhEvJ3xiHT6sS0-HY34WTmQzWJN1gO7-BrLo'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCombats() {
  try {
    console.log('🔍 Checking combats in database...')
    
    // Check total combats
    const { count: totalCombats, error: countError } = await supabase
      .from('combats')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting combats:', countError)
    } else {
      console.log('📊 Total combats:', totalCombats)
    }
    
    // Check recent combats
    const { data: combats, error: combatsError } = await supabase
      .from('combats')
      .select(`
        id,
        player1_id,
        player2_id,
        winner_id,
        combat_date,
        player1_stats,
        player2_stats
      `)
      .order('combat_date', { ascending: false })
      .limit(10)
    
    if (combatsError) {
      console.error('❌ Error fetching combats:', combatsError)
    } else {
      console.log('⚔️ Recent combats:', combats?.length || 0)
      if (combats && combats.length > 0) {
        combats.forEach((combat, index) => {
          console.log(`  ${index + 1}. Combat ${combat.id}: ${combat.player1_id} vs ${combat.player2_id} - Winner: ${combat.winner_id || 'None'} (${combat.combat_date})`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error)
  }
}

checkCombats()
