// Script para verificar el winrate en el navegador
// Ejecutar en la consola del navegador cuando estés en la aplicación

console.log('🔍 Verificando el almacenamiento del winrate...\n');

async function verifyWinrateStorage() {
    try {
        // 1. Verificar estructura de la tabla users
        console.log('📊 1. Verificando estructura de la tabla users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, total_wins, total_losses, win_rate, created_at')
            .order('win_rate', { ascending: false });

        if (usersError) {
            console.error('❌ Error al obtener usuarios:', usersError);
            return;
        }

        console.log(`✅ Encontrados ${users.length} usuarios:`);
        users.slice(0, 10).forEach(user => {
            const totalCombats = (user.total_wins || 0) + (user.total_losses || 0);
            console.log(`   - ${user.username}: ${user.total_wins}W/${user.total_losses}L (${user.win_rate}%) - Total: ${totalCombats}`);
        });

        // 2. Verificar combates registrados
        console.log('\n⚔️ 2. Verificando combates registrados...');
        const { data: combats, error: combatsError } = await supabase
            .from('combats')
            .select('id, player1_id, player2_id, winner_id, combat_date')
            .order('created_at', { ascending: false })
            .limit(20);

        if (combatsError) {
            console.error('❌ Error al obtener combates:', combatsError);
        } else {
            console.log(`✅ Últimos ${combats.length} combates:`);
            combats.forEach(combat => {
                console.log(`   - Combate ${combat.id}: P1(${combat.player1_id}) vs P2(${combat.player2_id}) - Ganador: ${combat.winner_id}`);
            });
        }

        // 3. Verificar consistencia de datos
        console.log('\n🔍 3. Verificando consistencia de datos...');
        
        for (const user of users.slice(0, 5)) { // Verificar solo los primeros 5 usuarios
            // Obtener combates donde el usuario participó
            const { data: userCombats, error: userCombatsError } = await supabase
                .from('combats')
                .select('id, player1_id, player2_id, winner_id')
                .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`);

            if (userCombatsError) {
                console.error(`❌ Error al obtener combates de ${user.username}:`, userCombatsError);
                continue;
            }

            const actualWins = userCombats.filter(combat => combat.winner_id === user.id).length;
            const actualLosses = userCombats.filter(combat => 
                combat.winner_id !== user.id && 
                (combat.player1_id === user.id || combat.player2_id === user.id)
            ).length;
            const actualTotal = actualWins + actualLosses;
            const actualWinRate = actualTotal > 0 ? Math.round((actualWins / actualTotal) * 100 * 100) / 100 : 0;

            const storedWins = user.total_wins || 0;
            const storedLosses = user.total_losses || 0;
            const storedWinRate = user.win_rate || 0;

            const isConsistent = storedWins === actualWins && storedLosses === actualLosses;

            console.log(`\n👤 ${user.username}:`);
            console.log(`   Almacenado: ${storedWins}W/${storedLosses}L (${storedWinRate}%)`);
            console.log(`   Calculado:  ${actualWins}W/${actualLosses}L (${actualWinRate}%)`);
            console.log(`   Estado: ${isConsistent ? '✅ CONSISTENTE' : '⚠️ INCONSISTENTE'}`);
            
            if (!isConsistent) {
                console.log(`   📝 Necesita actualización: wins=${actualWins}, losses=${actualLosses}, win_rate=${actualWinRate}`);
                
                // Función para actualizar las estadísticas
                console.log(`   🔧 Para actualizar, ejecuta:`);
                console.log(`   updateUserStats('${user.id}', ${actualWins}, ${actualLosses}, ${actualWinRate});`);
            }
        }

        // 4. Estadísticas generales
        console.log('\n📊 4. Estadísticas generales...');
        const { data: totalCombats, error: totalCombatsError } = await supabase
            .from('combats')
            .select('id', { count: 'exact' });

        const { data: activeUsers, error: activeUsersError } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .or('total_wins.gt.0,total_losses.gt.0');

        if (!totalCombatsError && !activeUsersError) {
            console.log(`✅ Total de combates: ${totalCombats.length}`);
            console.log(`✅ Usuarios activos: ${activeUsers.length}`);
        }

        console.log('\n🎯 Verificación completada!');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Función para actualizar estadísticas de un usuario
async function updateUserStats(userId, wins, losses, winRate) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                total_wins: wins,
                total_losses: losses,
                win_rate: winRate
            })
            .eq('id', userId);

        if (error) {
            console.error('❌ Error al actualizar:', error);
        } else {
            console.log(`✅ Estadísticas actualizadas para usuario ${userId}`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Función para actualizar todas las estadísticas inconsistentes
async function fixAllInconsistentStats() {
    console.log('🔧 Actualizando todas las estadísticas inconsistentes...');
    
    try {
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, total_wins, total_losses, win_rate');

        if (usersError) {
            console.error('❌ Error al obtener usuarios:', usersError);
            return;
        }

        let updatedCount = 0;

        for (const user of users) {
            const { data: userCombats, error: userCombatsError } = await supabase
                .from('combats')
                .select('id, player1_id, player2_id, winner_id')
                .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`);

            if (userCombatsError) continue;

            const actualWins = userCombats.filter(combat => combat.winner_id === user.id).length;
            const actualLosses = userCombats.filter(combat => 
                combat.winner_id !== user.id && 
                (combat.player1_id === user.id || combat.player2_id === user.id)
            ).length;
            const actualTotal = actualWins + actualLosses;
            const actualWinRate = actualTotal > 0 ? Math.round((actualWins / actualTotal) * 100 * 100) / 100 : 0;

            const storedWins = user.total_wins || 0;
            const storedLosses = user.total_losses || 0;

            if (storedWins !== actualWins || storedLosses !== actualLosses) {
                await updateUserStats(user.id, actualWins, actualLosses, actualWinRate);
                updatedCount++;
            }
        }

        console.log(`✅ Actualizados ${updatedCount} usuarios`);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar verificación
verifyWinrateStorage();

// Exportar funciones para uso manual
window.verifyWinrateStorage = verifyWinrateStorage;
window.updateUserStats = updateUserStats;
window.fixAllInconsistentStats = fixAllInconsistentStats;

console.log('\n📝 Funciones disponibles:');
console.log('   - verifyWinrateStorage() - Verificar estadísticas');
console.log('   - updateUserStats(userId, wins, losses, winRate) - Actualizar usuario específico');
console.log('   - fixAllInconsistentStats() - Actualizar todos los inconsistentes');
