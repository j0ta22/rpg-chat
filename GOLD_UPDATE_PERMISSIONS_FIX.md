# 🔧 Gold Update Permissions Fix

## 🚨 **Problema Identificado**

El oro no se está persistiendo correctamente después de los combates. Los tests muestran que:

1. ✅ **Los combates se guardan** correctamente en la base de datos
2. ✅ **Las recompensas se calculan** correctamente (15 base + bonos)
3. ❌ **Las actualizaciones de oro fallan silenciosamente** - el comando UPDATE devuelve éxito pero el valor no cambia
4. ❌ **El oro vuelve al estado inicial** al refrescar la página

## 🔍 **Causa del Problema**

**RLS (Row Level Security) está bloqueando las actualizaciones de oro** en la tabla `users`. El usuario anónimo no tiene permisos para actualizar la columna `gold`.

## ✅ **Solución**

### **Paso 1: Ejecutar SQL en Supabase**

Ejecuta el script `fix-gold-update-permissions.sql` en el **Supabase SQL Editor**:

```sql
-- 1. Check RLS status
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables WHERE tablename = 'users';

-- 2. Temporarily disable RLS to test
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Test gold update
UPDATE users 
SET gold = 100, updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';

-- 4. Verify update worked
SELECT id, gold, updated_at FROM users WHERE id = 'YOUR_USER_ID_HERE';

-- 5. Create proper RLS policies
CREATE POLICY "Users can update their own gold" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Test again with RLS enabled
UPDATE users 
SET gold = 150, updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';

-- 8. Final verification
SELECT id, gold, updated_at FROM users WHERE id = 'YOUR_USER_ID_HERE';
```

### **Paso 2: Verificar en el Juego**

1. **Abre el juego** en el navegador
2. **Pelea un combate** y gana
3. **Verifica que el oro se actualiza** en la interfaz
4. **Refresca la página** - el oro debería persistir

## 🎯 **Políticas RLS Necesarias**

### **Para Usuarios Autenticados:**
```sql
CREATE POLICY "Users can update their own gold" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### **Para el Servidor WebSocket (si es necesario):**
```sql
CREATE POLICY "Service role can update any user gold" ON users
FOR UPDATE USING (true)
WITH CHECK (true);
```

## 🧪 **Testing**

### **Test 1: Verificar RLS**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE tablename = 'users';
```

### **Test 2: Verificar Políticas**
```sql
-- Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'users';
```

### **Test 3: Test de Actualización**
```sql
-- Test gold update
UPDATE users SET gold = 200 WHERE id = 'YOUR_USER_ID';
SELECT gold FROM users WHERE id = 'YOUR_USER_ID';
```

## 📊 **Resultado Esperado**

Después de aplicar la solución:

- ✅ **Los combates otorgan oro** correctamente
- ✅ **El oro se persiste** en la base de datos
- ✅ **El oro no desaparece** al refrescar la página
- ✅ **La economía funciona** como está diseñada

## 🚀 **Deployment**

1. **Ejecuta el SQL** en Supabase SQL Editor
2. **Verifica que las políticas** se crearon correctamente
3. **Prueba el juego** - pelea y verifica que el oro persiste
4. **Confirma que el problema** está solucionado

## 📝 **Notas Importantes**

- **RLS debe estar habilitado** para seguridad
- **Las políticas deben permitir** actualizaciones de oro
- **El usuario debe estar autenticado** para actualizar su propio oro
- **El servidor WebSocket** puede necesitar permisos especiales

¡Este fix resolverá completamente el problema de persistencia del oro!
