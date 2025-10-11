// Script para debuggear la función de ranking
// Ejecutar en la consola del navegador

console.log('🔍 Debugging ranking function...')

async function debugRankingFunction() {
  try {
    // Crear cliente de Supabase
    const { createClient } = await import('@supabase/supabase-js')
    
    // Usar las variables de entorno (reemplaza con las reales)
    const supabaseUrl = 'https://your-project.supabase.co'
    const supabaseKey = 'your-anon-key'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('1. 🔍 Probando consulta directa a users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .order('win_rate', { ascending: false })
      .order('total_wins', { ascending: false })

    if (usersError) {
      console.error('❌ Error en consulta directa:', usersError)
    } else {
      console.log('✅ Consulta directa exitosa:')
      console.log(`   - Usuarios encontrados: ${users?.length || 0}`)
      users?.forEach((user, index) => {
        const totalCombats = (user.total_wins || 0) + (user.total_losses || 0)
        console.log(`   ${index + 1}. ${user.username}: ${user.total_wins || 0}W/${user.total_losses || 0}L (${user.win_rate || 0}%)`)
      })
    }

    console.log('\\n2. 🔍 Probando función RPC...')
    const { data: rpcRankings, error: rpcError } = await supabase
      .rpc('get_player_rankings')

    if (rpcError) {
      console.error('❌ Error en función RPC:', rpcError)
    } else {
      console.log('✅ Función RPC exitosa:')
      console.log(`   - Rankings encontrados: ${rpcRankings?.length || 0}`)
      rpcRankings?.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.username}: ${player.wins || 0}W/${player.losses || 0}L (${player.win_rate || 0}%)`)
      })
    }

    console.log('\\n3. 🔍 Verificando usuarios con combates...')
    const { data: usersWithCombats, error: combatsError } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .or('total_wins.gt.0,total_losses.gt.0')
      .order('win_rate', { ascending: false })

    if (combatsError) {
      console.error('❌ Error en usuarios con combates:', combatsError)
    } else {
      console.log('✅ Usuarios con combates:')
      console.log(`   - Usuarios con combates: ${usersWithCombats?.length || 0}`)
      usersWithCombats?.forEach((user, index) => {
        const totalCombats = (user.total_wins || 0) + (user.total_losses || 0)
        console.log(`   ${index + 1}. ${user.username}: ${user.total_wins || 0}W/${user.total_losses || 0}L (${user.win_rate || 0}%)`)
      })
    }

    console.log('\\n4. 🔍 Verificando combates en la base de datos...')
    const { data: combats, error: combatsCountError } = await supabase
      .from('combats')
      .select('id, player1_id, player2_id, winner_id')
      .limit(5)

    if (combatsCountError) {
      console.error('❌ Error en combates:', combatsCountError)
    } else {
      console.log(`✅ Combates encontrados: ${combats?.length || 0}`)
      combats?.forEach((combat, index) => {
        console.log(`   ${index + 1}. Combat ${combat.id}: Winner ${combat.winner_id}`)
      })
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar
debugRankingFunction()
