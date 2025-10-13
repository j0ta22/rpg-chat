// Script corregido para debuggear el guardado de combates
// Ejecutar en la consola del navegador cuando estés en la aplicación

console.log('🔍 Debug: Verificando el guardado de combates (VERSIÓN CORREGIDA)...\n');

async function debugCombatSaveFixed() {
    try {
        // 1. Verificar si supabase está disponible
        console.log('1. Verificando cliente de Supabase...');
        
        // Buscar el cliente de Supabase en diferentes ubicaciones
        let supabaseClient = null;
        
        if (typeof window.supabase !== 'undefined') {
            supabaseClient = window.supabase;
            console.log('✅ Supabase encontrado en window.supabase');
        } else if (typeof window.__NEXT_DATA__ !== 'undefined') {
            // Intentar importar desde el módulo
            try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                
                if (supabaseUrl && supabaseKey) {
                    supabaseClient = createClient(supabaseUrl, supabaseKey);
                    console.log('✅ Supabase creado desde variables de entorno');
                }
            } catch (e) {
                console.log('⚠️ No se pudo crear cliente desde variables de entorno');
            }
        }
        
        if (!supabaseClient) {
            console.error('❌ No se pudo encontrar o crear cliente de Supabase');
            console.log('💡 Intenta ejecutar este script desde la página principal de la aplicación');
            return;
        }

        // 2. Verificar conexión a Supabase
        console.log('\n2. Verificando conexión a Supabase...');
        const { data: testData, error: testError } = await supabaseClient
            .from('users')
            .select('id, username')
            .limit(1);
        
        if (testError) {
            console.error('❌ Error de conexión a Supabase:', testError);
            return;
        }
        console.log('✅ Conexión a Supabase OK');

        // 3. Verificar si hay combates
        console.log('\n3. Verificando combates existentes...');
        const { data: combats, error: combatsError } = await supabaseClient
            .from('combats')
            .select('*')
            .limit(5);
        
        if (combatsError) {
            console.error('❌ Error al obtener combates:', combatsError);
        } else {
            console.log(`✅ Combates encontrados: ${combats.length}`);
            if (combats.length > 0) {
                console.log('Últimos combates:');
                combats.forEach(combat => {
                    console.log(`   - ID: ${combat.id}, P1: ${combat.player1_id}, P2: ${combat.player2_id}, Winner: ${combat.winner_id}`);
                });
            } else {
                console.log('⚠️ No hay combates en la base de datos');
            }
        }

        // 4. Verificar usuarios
        console.log('\n4. Verificando usuarios...');
        const { data: users, error: usersError } = await supabaseClient
            .from('users')
            .select('id, username, total_wins, total_losses, win_rate');
        
        if (usersError) {
            console.error('❌ Error al obtener usuarios:', usersError);
        } else {
            console.log(`✅ Usuarios encontrados: ${users.length}`);
            users.forEach(user => {
                console.log(`   - ${user.username}: ${user.total_wins}W/${user.total_losses}L (${user.win_rate}%)`);
            });
        }

        // 5. Verificar WebSocket
        console.log('\n5. Verificando WebSocket...');
        if (window.socket) {
            console.log('✅ WebSocket encontrado, estado:', window.socket.readyState);
            console.log('   - READY_STATE_CONNECTING (0): Conectando');
            console.log('   - READY_STATE_OPEN (1): Conectado');
            console.log('   - READY_STATE_CLOSING (2): Cerrando');
            console.log('   - READY_STATE_CLOSED (3): Cerrado');
        } else {
            console.log('⚠️ WebSocket no encontrado');
        }

        // 6. Verificar jugadores en el juego
        console.log('\n6. Verificando jugadores en el juego...');
        if (window.allPlayers) {
            console.log(`✅ Jugadores en el juego: ${Object.keys(window.allPlayers).length}`);
            Object.keys(window.allPlayers).forEach(playerId => {
                const player = window.allPlayers[playerId];
                console.log(`   - ${playerId}: ${player.name || 'Sin nombre'}`);
            });
        } else {
            console.log('⚠️ No se encontró window.allPlayers');
        }

        // 7. Test de inserción de combate (solo si hay usuarios)
        if (users.length >= 2) {
            console.log('\n7. Test de inserción de combate...');
            const testCombat = {
                player1_id: users[0].id,
                player2_id: users[1].id,
                winner_id: users[0].id,
                player1_stats: { level: 1, health: 100 },
                player2_stats: { level: 1, health: 100 },
                combat_duration: 30,
                player1_level: 1,
                player2_level: 1,
                damage_dealt: 0,
                critical_hits: 0,
                gold_reward: 20,
                xp_reward: 50,
                xp_loss: 0,
                level_difference: 0,
                no_rewards: false
            };

            const { data: newCombat, error: insertError } = await supabaseClient
                .from('combats')
                .insert(testCombat)
                .select()
                .single();
            
            if (insertError) {
                console.error('❌ Error al insertar combate de prueba:', insertError);
            } else {
                console.log('✅ Combate de prueba insertado:', newCombat.id);
                
                // Eliminar el combate de prueba
                await supabaseClient
                    .from('combats')
                    .delete()
                    .eq('id', newCombat.id);
                console.log('✅ Combate de prueba eliminado');
            }
        } else {
            console.log('\n7. ⚠️ No hay suficientes usuarios para el test de inserción');
        }

        console.log('\n🎯 Debug completado!');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Función para simular un combate completo
async function simulateCombatFixed() {
    console.log('⚔️ Simulando combate...');
    
    try {
        // Buscar cliente de Supabase
        let supabaseClient = window.supabase;
        if (!supabaseClient) {
            console.error('❌ Cliente de Supabase no disponible');
            return;
        }

        const { data: users, error: usersError } = await supabaseClient
            .from('users')
            .select('id, username')
            .limit(2);
        
        if (usersError || users.length < 2) {
            console.error('❌ No hay suficientes usuarios para simular combate');
            return;
        }

        const player1 = users[0];
        const player2 = users[1];
        const winner = player1; // Simular que player1 gana

        console.log(`⚔️ Simulando combate: ${player1.username} vs ${player2.username}`);

        // Insertar combate
        const { data: combat, error: combatError } = await supabaseClient
            .from('combats')
            .insert({
                player1_id: player1.id,
                player2_id: player2.id,
                winner_id: winner.id,
                player1_stats: { level: 1, health: 100, attack: 10 },
                player2_stats: { level: 1, health: 100, attack: 10 },
                combat_duration: 45,
                player1_level: 1,
                player2_level: 1,
                damage_dealt: 50,
                critical_hits: 1,
                gold_reward: 20,
                xp_reward: 50,
                xp_loss: 0,
                level_difference: 0,
                no_rewards: false
            })
            .select()
            .single();

        if (combatError) {
            console.error('❌ Error al insertar combate:', combatError);
            return;
        }

        console.log('✅ Combate insertado:', combat.id);

        // Actualizar estadísticas del ganador
        const { error: winnerError } = await supabaseClient
            .from('users')
            .update({ 
                total_wins: supabaseClient.raw('total_wins + 1'),
                updated_at: new Date().toISOString()
            })
            .eq('id', winner.id);

        if (winnerError) {
            console.error('❌ Error al actualizar estadísticas del ganador:', winnerError);
        } else {
            console.log('✅ Estadísticas del ganador actualizadas');
        }

        // Actualizar estadísticas del perdedor
        const { error: loserError } = await supabaseClient
            .from('users')
            .update({ 
                total_losses: supabaseClient.raw('total_losses + 1'),
                updated_at: new Date().toISOString()
            })
            .eq('id', player2.id);

        if (loserError) {
            console.error('❌ Error al actualizar estadísticas del perdedor:', loserError);
        } else {
            console.log('✅ Estadísticas del perdedor actualizadas');
        }

        // Actualizar win rates
        await updateWinRateFixed(winner.id);
        await updateWinRateFixed(player2.id);

        console.log('✅ Combate simulado completado!');
        console.log('🔄 Recarga la página para ver los cambios en el ranking');

    } catch (error) {
        console.error('❌ Error en simulación:', error);
    }
}

// Función para actualizar win rate
async function updateWinRateFixed(userId) {
    try {
        let supabaseClient = window.supabase;
        if (!supabaseClient) {
            console.error('❌ Cliente de Supabase no disponible');
            return;
        }

        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('total_wins, total_losses')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('❌ Error al obtener usuario:', userError);
            return;
        }

        const totalCombats = (user.total_wins || 0) + (user.total_losses || 0);
        const winRate = totalCombats > 0 ? Math.round((user.total_wins / totalCombats) * 100 * 100) / 100 : 0;

        const { error: updateError } = await supabaseClient
            .from('users')
            .update({ win_rate: winRate })
            .eq('id', userId);

        if (updateError) {
            console.error('❌ Error al actualizar win rate:', updateError);
        } else {
            console.log(`✅ Win rate actualizado para usuario ${userId}: ${winRate}%`);
        }
    } catch (error) {
        console.error('❌ Error en updateWinRate:', error);
    }
}

// Ejecutar debug
debugCombatSaveFixed();

// Exportar funciones
window.debugCombatSaveFixed = debugCombatSaveFixed;
window.simulateCombatFixed = simulateCombatFixed;
window.updateWinRateFixed = updateWinRateFixed;

console.log('\n📝 Funciones disponibles:');
console.log('   - debugCombatSaveFixed() - Debug completo');
console.log('   - simulateCombatFixed() - Simular combate completo');
console.log('   - updateWinRateFixed(userId) - Actualizar win rate de usuario');
