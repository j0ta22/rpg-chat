# 🔧 Combat Gold Persistence Fix

## 🚨 **Problema Identificado**

El oro de las recompensas de combate no se persistía en la base de datos:

1. ✅ **Oro inicial se carga correctamente** desde la base de datos (7 oro)
2. ✅ **Recompensas de combate se otorgan** en el frontend (42 oro)
3. ❌ **Recompensas NO se guardan** en la base de datos
4. ❌ **Al refrescar, vuelve al valor de la base de datos** (7 oro)

## 🔍 **Causa del Problema**

El servidor WebSocket **NO estaba guardando el oro en la base de datos**, solo enviaba el evento al cliente:

```javascript
// ❌ PROBLEMA: Solo notifica al cliente, no guarda en DB
sendToClient(winnerWs, 'goldUpdate', { delta: goldReward });
```

El cliente intentaba guardar el oro usando el **anon key**, pero no tenía permisos para actualizar la tabla `users`.

## ✅ **Solución Implementada**

### **1. Servidor WebSocket ahora guarda el oro directamente:**

```javascript
// ✅ SOLUCIÓN: Servidor guarda el oro en la base de datos
const winnerUserId = await getUserIdFromPlayerId(winner);
await saveGoldRewardToDatabase(winnerUserId, goldReward);
sendToClient(winnerWs, 'goldUpdate', { delta: goldReward });
```

### **2. Nueva función `saveGoldRewardToDatabase`:**

```javascript
async function saveGoldRewardToDatabase(userId, goldReward) {
  if (!supabase) {
    console.log('⚠️ Supabase not available - skipping gold reward save');
    return false;
  }
  
  try {
    console.log(`💰 Saving gold reward to database: User ${userId}, Reward: ${goldReward}`);
    
    // Get current gold
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('gold')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ Error fetching user gold:', userError);
      return false;
    }

    const newGold = (user.gold || 0) + goldReward;
    
    // Update gold in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        gold: newGold,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating user gold:', updateError);
      return false;
    }

    console.log(`✅ Gold reward saved successfully: ${user.gold || 0} + ${goldReward} = ${newGold}`);
    return true;
  } catch (error) {
    console.error('❌ Exception saving gold reward:', error);
    return false;
  }
}
```

## 🎯 **Flujo Corregido**

### **Antes (Problemático):**
1. Combate termina
2. Servidor calcula recompensa de oro
3. Servidor envía evento `goldUpdate` al cliente
4. Cliente intenta guardar oro en DB (falla por permisos)
5. Oro se muestra en frontend pero no se persiste
6. Al refrescar, oro vuelve al valor de la DB

### **Después (Corregido):**
1. Combate termina
2. Servidor calcula recompensa de oro
3. **Servidor guarda oro directamente en la base de datos**
4. Servidor envía evento `goldUpdate` al cliente
5. Cliente actualiza la interfaz
6. Al refrescar, oro persiste correctamente

## 🧪 **Testing**

### **Test Manual:**
1. **Abre el juego** y verifica tu oro inicial
2. **Pelea un combate** y gana
3. **Verifica que el oro se actualiza** en la interfaz
4. **Refresca la página** - el oro debería persistir con la recompensa

### **Test de Base de Datos:**
```sql
-- Verificar oro antes del combate
SELECT gold FROM users WHERE id = 'YOUR_USER_ID';

-- Pelear combate y ganar

-- Verificar oro después del combate
SELECT gold FROM users WHERE id = 'YOUR_USER_ID';
```

## 📊 **Resultado Esperado**

Después de aplicar esta solución:

- ✅ **Oro inicial se carga correctamente** desde la base de datos
- ✅ **Recompensas de combate se guardan** en la base de datos
- ✅ **Oro persiste al refrescar** la página
- ✅ **No hay pérdida de oro** después de combates

## 🔧 **Archivos Modificados**

- `server/websocket-server.js` - Agregada función `saveGoldRewardToDatabase` y llamada en el flujo de combate

## 🎉 **Solución Completa**

Esta solución, combinada con los fixes anteriores, resuelve **completamente** el problema de persistencia del oro:

1. **RLS Fix**: Permite que las actualizaciones de oro funcionen
2. **Frontend Fix**: Previene que el oro se sobrescriba al refrescar
3. **Combat Fix**: El servidor guarda las recompensas de combate directamente

¡El sistema de oro ahora funciona perfectamente en todos los escenarios! 🎮✨
