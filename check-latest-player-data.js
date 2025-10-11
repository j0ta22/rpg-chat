const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPlayerData() {
  console.log('🔍 Checking latest player data in Supabase...')
  console.log('📅 Current time:', new Date().toISOString())
  
  try {
    // Get all players with their stats
    const { data: players, error } = await supabase
      .from('players')
      .select(`
        id,
        name,
        user_id,
        stats,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching players:', error)
      return
    }

    console.log(`\n📊 Found ${players.length} players:`)
    console.log('=' .repeat(80))
    
    players.forEach((player, index) => {
      console.log(`\n${index + 1}. Player: ${player.name}`)
      console.log(`   ID: ${player.id}`)
      console.log(`   User ID: ${player.user_id}`)
      console.log(`   Created: ${player.created_at}`)
      console.log(`   Updated: ${player.updated_at}`)
      
      if (player.stats) {
        console.log(`   Stats:`)
        console.log(`     Level: ${player.stats.level || 'N/A'}`)
        console.log(`     Experience: ${player.stats.experience || 'N/A'}`)
        console.log(`     Health: ${player.stats.health || 'N/A'}`)
        console.log(`     Max Health: ${player.stats.maxHealth || 'N/A'}`)
        console.log(`     Attack: ${player.stats.attack || 'N/A'}`)
        console.log(`     Defense: ${player.stats.defense || 'N/A'}`)
        console.log(`     Speed: ${player.stats.speed || 'N/A'}`)
      } else {
        console.log(`   Stats: NULL`)
      }
    })

    // Check specifically for "Jota" player
    console.log('\n🔍 Looking specifically for "Jota" player...')
    const { data: jotaPlayer, error: jotaError } = await supabase
      .from('players')
      .select('*')
      .eq('name', 'Jota')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (jotaError) {
      console.error('❌ Error fetching Jota player:', jotaError)
    } else if (jotaPlayer) {
      console.log('\n✅ Found Jota player:')
      console.log('   ID:', jotaPlayer.id)
      console.log('   User ID:', jotaPlayer.user_id)
      console.log('   Created:', jotaPlayer.created_at)
      console.log('   Updated:', jotaPlayer.updated_at)
      console.log('   Stats:', JSON.stringify(jotaPlayer.stats, null, 2))
    } else {
      console.log('❌ No Jota player found')
    }

  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

checkPlayerData()

