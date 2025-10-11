// Simple script to check Supabase data
// This will be run in the browser console instead

console.log('🔍 Supabase Data Check Script')
console.log('Copy and paste this into your browser console:')

const script = `
// Check latest player data
async function checkPlayerData() {
  console.log('🔍 Checking player data in Supabase...')
  
  try {
    // Get all players
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('📊 Players found:', players.length)
    players.forEach((player, i) => {
      console.log(\`\${i+1}. \${player.name} (ID: \${player.id})\`)
      console.log('   User ID:', player.user_id)
      console.log('   Updated:', player.updated_at)
      console.log('   Stats:', player.stats)
      console.log('---')
    })

    // Check specifically for Jota
    const { data: jota, error: jotaError } = await supabase
      .from('players')
      .select('*')
      .eq('name', 'Jota')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (jotaError) {
      console.error('❌ Jota error:', jotaError)
    } else {
      console.log('✅ Jota player found:')
      console.log('   Stats:', jota.stats)
      console.log('   Updated:', jota.updated_at)
    }

  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

checkPlayerData()
`

console.log(script)

