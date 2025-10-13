// Script para debuggear el guardado de combates
// Ejecutar en la consola del navegador cuando estés en la aplicación

console.log('🔍 Debug: Verificando el guardado de combates...\n');

async function debugCombatSave() {
    try {
        // 1. Verificar conexión a Supabase
        console.log('1. Verificando conexión a Supabase...');
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('id, username')
            .limit(1);
        
        if (testError) {
            console.error('❌ Error de conexión a Supabase:', testError);
            return;
        }
        console.log('✅ Conexión a Supabase OK');

        // 2. Verificar si hay combates
        console.log('\n2. Verificando combates existentes...');
        const { data: combats, error: combatsError } = await supabase
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
            }
        }

        // 3. Verificar usuarios
        console.log('\n3. Verificando usuarios...');
        const { data: users, error: usersError } = await supabase
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

        // 4. Simular inserción de combate (solo para test)
        console.log('\n4. Test de inserción de combate...');
        const testCombat = {
            player1_id: users[0]?.id,
            player2_id: users[1]?.id,
            winner_id: users[0]?.id,
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

        if (users.length >= 2) {
            const { data: newCombat, error: insertError } = await supabase
                .from('combats')
                .insert(testCombat)
                .select()
                .single();
            
            if (insertError) {
                console.error('❌ Error al insertar combate de prueba:', insertError);
            } else {
                console.log('✅ Combate de prueba insertado:', newCombat.id);
                
                // Eliminar el combate de prueba
                await supabase
                    .from('combats')
                    .delete()
                    .eq('id', newCombat.id);
                console.log('✅ Combate de prueba eliminado');
            }
        } else {
            console.log('⚠️ No hay suficientes usuarios para el test');
        }

        // 5. Verificar WebSocket
        console.log('\n5. Verificando WebSocket...');
        if (window.socket) {
            console.log('✅ WebSocket conectado:', window.socket.readyState);
        } else {
            console.log('⚠️ WebSocket no encontrado');
        }

        console.log('\n🎯 Debug completado!');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Función para simular un combate completo
async function simulateCombat() {
    console.log('⚔️ Simulando combate...');
    
    try {
        const { data: users, error: usersError } = await supabase
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

        // Insertar combate
        const { data: combat, error: combatError } = await supabase
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
        const { error: winnerError } = await supabase
            .from('users')
            .update({ 
                total_wins: supabase.raw('total_wins + 1'),
                updated_at: new Date().toISOString()
            })
            .eq('id', winner.id);

        if (winnerError) {
            console.error('❌ Error al actualizar estadísticas del ganador:', winnerError);
        } else {
            console.log('✅ Estadísticas del ganador actualizadas');
        }

        // Actualizar estadísticas del perdedor
        const { error: loserError } = await supabase
            .from('users')
            .update({ 
                total_losses: supabase.raw('total_losses + 1'),
                updated_at: new Date().toISOString()
            })
            .eq('id', player2.id);

        if (loserError) {
            console.error('❌ Error al actualizar estadísticas del perdedor:', loserError);
        } else {
            console.log('✅ Estadísticas del perdedor actualizadas');
        }

        // Actualizar win rates
        await updateWinRate(winner.id);
        await updateWinRate(player2.id);

        console.log('✅ Combate simulado completado!');

    } catch (error) {
        console.error('❌ Error en simulación:', error);
    }
}

// Función para actualizar win rate
async function updateWinRate(userId) {
    try {
        const { data: user, error: userError } = await supabase
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

        const { error: updateError } = await supabase
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
debugCombatSave();

// Exportar funciones
window.debugCombatSave = debugCombatSave;
window.simulateCombat = simulateCombat;
window.updateWinRate = updateWinRate;

console.log('\n📝 Funciones disponibles:');
console.log('   - debugCombatSave() - Debug completo');
console.log('   - simulateCombat() - Simular combate completo');
console.log('   - updateWinRate(userId) - Actualizar win rate de usuario');
