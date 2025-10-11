// Script simple para verificar estadísticas de combates
// Ejecutar en la consola del navegador

console.log('⚔️ Verificando estadísticas de combates...')

// Función simple que usa las variables de entorno del proyecto
async function simpleCombatCheck() {
  try {
    // Crear cliente de Supabase con las variables de entorno
    const { createClient } = await import('@supabase/supabase-js')
    
    // Usar las variables de entorno de Next.js
    const supabaseUrl = 'https://your-project.supabase.co' // Reemplaza con tu URL real
    const supabaseKey = 'your-anon-key' // Reemplaza con tu key real
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 Verificando usuarios...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, total_wins, total_losses, win_rate')
      .limit(5)

    if (usersError) {
      console.error('❌ Error:', usersError)
      return
    }

    console.log('✅ Usuarios encontrados:')
    users?.forEach((user, i) => {
      console.log(`${i+1}. ${user.username}: ${user.total_wins || 0}W/${user.total_losses || 0}L (${user.win_rate || 0}%)`)
    })

    console.log('\\n🔍 Verificando combates...')
    const { data: combats, error: combatsError } = await supabase
      .from('combats')
      .select('id, player1_id, player2_id, winner_id, combat_date')
      .limit(5)

    if (combatsError) {
      console.error('❌ Error:', combatsError)
      return
    }

    console.log(`✅ Combates encontrados: ${combats?.length || 0}`)
    combats?.forEach((combat, i) => {
      console.log(`${i+1}. Combat ${combat.id}: Winner ${combat.winner_id} on ${combat.combat_date}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('💡 Asegúrate de reemplazar las URLs y keys con las reales de tu proyecto')
  }
}

// Ejecutar
simpleCombatCheck()
