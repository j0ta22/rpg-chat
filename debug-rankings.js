const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugRankings() {
  console.log('🔍 Debugging Rankings System...\n')

  try {
    // 1. Verificar usuarios en la tabla users
    console.log('1. 📊 Usuarios en la tabla users:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, total_wins, total_losses, win_rate, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    } else {
      console.log(`✅ Found ${users?.length || 0} users:`)
      users?.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username}`)
        console.log(`      - ID: ${user.id}`)
        console.log(`      - Wins: ${user.total_wins || 0}`)
        console.log(`      - Losses: ${user.total_losses || 0}`)
        console.log(`      - Win Rate: ${user.win_rate || 0}%`)
        console.log(`      - Created: ${user.created_at}`)
        console.log('')
      })
    }

    // 2. Verificar combates en la tabla combats
    console.log('2. ⚔️ Combates en la tabla combats:')
    const { data: combats, error: combatsError } = await supabase
      .from('combats')
      .select('id, player1_id, player2_id, winner_id, combat_date, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (combatsError) {
      console.error('❌ Error fetching combats:', combatsError)
    } else {
      console.log(`✅ Found ${combats?.length || 0} combats:`)
      combats?.forEach((combat, index) => {
        console.log(`   ${index + 1}. Combat ID: ${combat.id}`)
        console.log(`      - Player 1: ${combat.player1_id}`)
        console.log(`      - Player 2: ${combat.player2_id}`)
        console.log(`      - Winner: ${combat.winner_id}`)
        console.log(`      - Date: ${combat.combat_date}`)
        console.log('')
      })
    }

    // 3. Verificar la función getPlayerRanking
    console.log('3. 🏆 Probando función getPlayerRanking:')
    const { data: rankings, error: rankingsError } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .order('win_rate', { ascending: false })
      .order('total_wins', { ascending: false })

    if (rankingsError) {
      console.error('❌ Error fetching rankings:', rankingsError)
    } else {
      console.log(`✅ Rankings query result:`)
      rankings?.forEach((player, index) => {
        const totalCombats = (player.total_wins || 0) + (player.total_losses || 0)
        console.log(`   ${index + 1}. ${player.username}`)
        console.log(`      - Wins: ${player.total_wins || 0}`)
        console.log(`      - Losses: ${player.total_losses || 0}`)
        console.log(`      - Win Rate: ${player.win_rate || 0}%`)
        console.log(`      - Total Combats: ${totalCombats}`)
        console.log('')
      })
    }

    // 4. Verificar si hay datos de combate por usuario
    console.log('4. 🔍 Verificando estadísticas de combate por usuario:')
    for (const user of users || []) {
      const { data: userCombats, error: userCombatsError } = await supabase
        .from('combats')
        .select('id, player1_id, player2_id, winner_id')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

      if (!userCombatsError) {
        const wins = userCombats?.filter(c => c.winner_id === user.id).length || 0
        const losses = userCombats?.filter(c => c.winner_id !== user.id && (c.player1_id === user.id || c.player2_id === user.id)).length || 0
        const totalCombats = userCombats?.length || 0
        const winRate = totalCombats > 0 ? (wins / totalCombats * 100).toFixed(1) : 0

        console.log(`   ${user.username}:`)
        console.log(`      - Combates reales: ${totalCombats}`)
        console.log(`      - Victorias reales: ${wins}`)
        console.log(`      - Derrotas reales: ${losses}`)
        console.log(`      - Win rate real: ${winRate}%`)
        console.log(`      - Wins en users: ${user.total_wins || 0}`)
        console.log(`      - Losses en users: ${user.total_losses || 0}`)
        console.log('')
      }
    }

    // 5. Verificar estructura de la tabla users
    console.log('5. 🗃️ Estructura de la tabla users:')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .single()

    if (tableError) {
      console.log('❌ No se pudo obtener info de la tabla, pero continuamos...')
    } else {
      console.log('✅ Estructura de tabla users:', tableInfo)
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el debug
debugRankings()
