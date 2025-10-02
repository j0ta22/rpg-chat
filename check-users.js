require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUsers() {
  try {
    console.log('👥 Checking users and players...')
    
    // Get users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`📊 Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.id}) - ${user.created_at}`)
    })
    
    // Get players for each user
    for (const user of users) {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, user_id, stats, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (playersError) {
        console.error(`❌ Error fetching players for ${user.username}:`, playersError)
        continue
      }
      
      console.log(`\n👤 Players for ${user.username}:`)
      players.forEach((player, index) => {
        const level = player.stats?.level || 'unknown'
        console.log(`  ${index + 1}. ${player.name} - Level ${level} (${player.id})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error)
  }
}

checkUsers()
