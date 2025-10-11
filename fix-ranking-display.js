// Script para arreglar la visualización de rankings
// Ejecutar en la consola del navegador para probar

console.log('🔧 Testing ranking display fix...')

async function testRankingFix() {
  try {
    // Crear cliente de Supabase
    const { createClient } = await import('@supabase/supabase-js')
    
    // Usar las variables de entorno (reemplaza con las reales)
    const supabaseUrl = 'https://your-project.supabase.co'
    const supabaseKey = 'your-anon-key'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 Probando función de ranking modificada...')
    
    // Simular la función getPlayerRanking modificada
    const { data: rankings, error } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .order('win_rate', { ascending: false })
      .order('total_wins', { ascending: false })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    const formattedRankings = rankings?.map((player, index) => ({
      username: player.username,
      wins: player.total_wins || 0,
      losses: player.total_losses || 0,
      winRate: player.win_rate || 0,
      totalCombats: (player.total_wins || 0) + (player.total_losses || 0),
      rank: index + 1
    })) || []

    console.log('✅ Rankings formateados:')
    console.log(`   - Total usuarios: ${formattedRankings.length}`)
    
    formattedRankings.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.username}`)
      console.log(`      - Wins: ${player.wins}`)
      console.log(`      - Losses: ${player.losses}`)
      console.log(`      - Win Rate: ${player.winRate}%`)
      console.log(`      - Total Combats: ${player.totalCombats}`)
      console.log('')
    })

    // Verificar si esto resolvería el problema
    if (formattedRankings.length > 0) {
      console.log('✅ Esta función devolvería datos para mostrar en el ranking!')
    } else {
      console.log('❌ Aún no hay datos para mostrar')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Ejecutar
testRankingFix()
