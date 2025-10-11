// Script para consultar estadísticas de combates en el navegador
// Ejecutar en la consola del navegador DESPUÉS de cargar la aplicación

console.log('⚔️ Consultando estadísticas de combates...')

// Función para esperar a que supabase esté disponible
async function waitForSupabase() {
  let attempts = 0
  const maxAttempts = 50
  
  while (attempts < maxAttempts) {
    if (typeof window !== 'undefined' && window.supabase) {
      return window.supabase
    }
    
    // También intentar acceder desde el contexto de la aplicación
    if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
      // Buscar en el contexto de Next.js
      const app = document.querySelector('#__next')
      if (app && app.__reactInternalInstance) {
        // Intentar acceder a través de React DevTools
        console.log('Buscando supabase en el contexto de React...')
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  throw new Error('No se pudo encontrar supabase después de 5 segundos')
}

async function checkCombatStats() {
  try {
    // Intentar obtener supabase del contexto global
    let supabaseClient
    
    if (typeof window !== 'undefined') {
      // Buscar en diferentes ubicaciones posibles
      if (window.supabase) {
        supabaseClient = window.supabase
      } else if (window.__supabase) {
        supabaseClient = window.__supabase
      } else {
        // Intentar importar desde el módulo
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
          supabaseClient = createClient(supabaseUrl, supabaseKey)
        } catch (importError) {
          console.error('❌ No se pudo importar supabase:', importError)
          console.log('💡 Intenta ejecutar este script desde la consola del navegador mientras la aplicación está cargada')
          return
        }
      }
    }
    
    if (!supabaseClient) {
      console.error('❌ No se pudo encontrar supabase')
      console.log('💡 Asegúrate de que la aplicación esté cargada y ejecuta este script desde la consola')
      return
    }

    // 1. Verificar usuarios y sus estadísticas actuales
    console.log('1. 👥 Usuarios y estadísticas actuales:')
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, username, total_wins, total_losses, win_rate, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    } else {
      console.log(`✅ Found ${users?.length || 0} users:`)
      users?.forEach((user, index) => {
        const totalCombats = (user.total_wins || 0) + (user.total_losses || 0)
        console.log(`   ${index + 1}. ${user.username}`)
        console.log(`      - ID: ${user.id}`)
        console.log(`      - Wins: ${user.total_wins || 0}`)
        console.log(`      - Losses: ${user.total_losses || 0}`)
        console.log(`      - Win Rate: ${user.win_rate || 0}%`)
        console.log(`      - Total Combats: ${totalCombats}`)
        console.log(`      - Created: ${user.created_at}`)
        console.log('')
      })
    }

    // 2. Verificar combates en la tabla combats
    console.log('2. ⚔️ Combates registrados:')
    const { data: combats, error: combatsError } = await supabaseClient
      .from('combats')
      .select(`
        id, 
        player1_id, 
        player2_id, 
        winner_id, 
        combat_date, 
        created_at,
        player1_stats,
        player2_stats,
        combat_duration
      `)
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
        console.log(`      - Duration: ${combat.combat_duration || 'N/A'} seconds`)
        console.log('')
      })
    }

    // 3. Estadísticas generales de combates
    console.log('3. 📊 Estadísticas generales:')
    
    // Total de combates
    const { count: totalCombats, error: countError } = await supabaseClient
      .from('combats')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting combats:', countError)
    } else {
      console.log(`   - Total de combates: ${totalCombats}`)
    }

    // 4. Verificar estadísticas reales vs almacenadas
    console.log('4. 🔍 Verificando consistencia de datos:')
    for (const user of users || []) {
      const { data: userCombats, error: userCombatsError } = await supabaseClient
        .from('combats')
        .select('id, player1_id, player2_id, winner_id')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

      if (!userCombatsError) {
        const actualWins = userCombats?.filter(c => c.winner_id === user.id).length || 0
        const actualLosses = userCombats?.filter(c => c.winner_id !== user.id && (c.player1_id === user.id || c.player2_id === user.id)).length || 0
        const actualTotal = userCombats?.length || 0
        const actualWinRate = actualTotal > 0 ? (actualWins / actualTotal * 100).toFixed(1) : 0

        const storedWins = user.total_wins || 0
        const storedLosses = user.total_losses || 0
        const storedWinRate = user.win_rate || 0

        console.log(`   ${user.username}:`)
        console.log(`      - Combates reales: ${actualTotal} | Almacenados: ${storedWins + storedLosses}`)
        console.log(`      - Victorias reales: ${actualWins} | Almacenadas: ${storedWins}`)
        console.log(`      - Derrotas reales: ${actualLosses} | Almacenadas: ${storedLosses}`)
        console.log(`      - Win rate real: ${actualWinRate}% | Almacenado: ${storedWinRate}%`)
        
        if (actualWins !== storedWins || actualLosses !== storedLosses) {
          console.log(`      ⚠️  INCONSISTENCIA DETECTADA!`)
        } else {
          console.log(`      ✅ Datos consistentes`)
        }
        console.log('')
      }
    }

    // 5. Probar la función de ranking
    console.log('5. 🏆 Probando función de ranking:')
    const { data: rankings, error: rankingsError } = await supabaseClient
      .rpc('get_player_rankings')

    if (rankingsError) {
      console.error('❌ Error fetching rankings via RPC:', rankingsError)
      
      // Fallback a consulta directa
      const { data: fallbackRankings, error: fallbackError } = await supabaseClient
        .from('users')
        .select('username, total_wins, total_losses, win_rate')
        .order('win_rate', { ascending: false })
        .order('total_wins', { ascending: false })

      if (fallbackError) {
        console.error('❌ Error with fallback query:', fallbackError)
      } else {
        console.log('✅ Rankings (fallback):')
        fallbackRankings?.forEach((player, index) => {
          const totalCombats = (player.total_wins || 0) + (player.total_losses || 0)
          console.log(`   ${index + 1}. ${player.username} - ${player.win_rate || 0}% WR (${totalCombats} fights)`)
        })
      }
    } else {
      console.log('✅ Rankings (RPC):')
      rankings?.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.username} - ${player.win_rate || 0}% WR (${player.total_combats || 0} fights)`)
      })
    }

  } catch (error) {
    console.error('❌ Error general:', error)
    console.log('💡 Asegúrate de que la aplicación esté cargada y ejecuta este script desde la consola del navegador')
  }
}

// Ejecutar la consulta
checkCombatStats()
