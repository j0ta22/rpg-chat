# RPG Chat - Multiplayer Game

Un juego de rol multijugador en tiempo real desarrollado con Next.js y Socket.IO.

## Características

- 🎮 **Multijugador en tiempo real** - Conecta jugadores de diferentes navegadores
- 🎨 **Sistema de sprites animados** - Personajes con animaciones fluidas
- 💬 **Chat en tiempo real** - Comunicación entre jugadores
- 🌍 **Sincronización global** - Estado compartido entre todos los jugadores
- 🎯 **4 clases de personajes** - Warrior, Archer, Lancer, Monk
- 🎨 **4 colores disponibles** - Personalización visual

## Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Comunicación**: WebSockets en tiempo real

## Instalación y Uso

### Opción 1: Ejecutar todo junto (Recomendado)

```bash
# Instalar dependencias
npm install

# Ejecutar servidor backend y frontend
npm run dev:full
```

Esto iniciará:
- Servidor backend en `http://localhost:3001`
- Frontend en `http://localhost:3000`

### Opción 2: Ejecutar por separado

```bash
# Terminal 1 - Servidor backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## Cómo Jugar

1. **Abre el juego** en `http://localhost:3000`
2. **Crea tu personaje**:
   - Elige un nombre
   - Selecciona una clase (Warrior, Archer, Lancer, Monk)
   - Elige un color
3. **¡Comienza a jugar!**:
   - Usa WASD o flechas para moverte
   - Escribe mensajes en el chat
   - Ve a otros jugadores en tiempo real

## Pruebas Multiplayer

Para probar el multiplayer:

1. **Abre múltiples pestañas** del mismo navegador
2. **Abre diferentes navegadores** (Chrome, Firefox, Safari)
3. **Crea personajes diferentes** en cada pestaña/navegador
4. **Verifica** que todos aparezcan en el mismo mundo

## Estructura del Proyecto

```
rpg-chat/
├── components/          # Componentes React
│   ├── game-world.tsx   # Mundo del juego principal
│   ├── character-creation.tsx
│   └── player-list.tsx
├── lib/                 # Utilidades y clientes
│   ├── socket-multiplayer.ts  # Cliente Socket.IO
│   └── hybrid-multiplayer.ts  # Cliente híbrido (legacy)
├── server/              # Servidor backend
│   ├── index.js         # Servidor principal
│   └── package.json
└── public/              # Assets estáticos
    └── sprites/         # Sprites del juego
```

## API del Servidor

### WebSocket Events

- `joinGame` - Unirse al juego
- `updatePosition` - Actualizar posición del jugador
- `chatMessage` - Enviar mensaje de chat
- `heartbeat` - Mantener conexión activa

### REST Endpoints

- `GET /api/state` - Obtener estado actual del juego
- `POST /api/state` - Actualizar estado del juego
- `DELETE /api/players` - Limpiar todos los jugadores

## Desarrollo

### Agregar Nuevas Características

1. **Frontend**: Modifica los componentes en `components/`
2. **Backend**: Agrega eventos en `server/index.js`
3. **Comunicación**: Actualiza `lib/socket-multiplayer.ts`

### Debugging

- Usa el botón "Debug State" en el juego
- Revisa la consola del navegador
- Revisa los logs del servidor

## Solución de Problemas

### El servidor no inicia
```bash
cd server
npm install
npm run dev
```

### Los jugadores no se ven
1. Verifica que el servidor esté corriendo
2. Revisa la consola del navegador
3. Usa el botón "Debug State"

### Error de conexión
1. Verifica que el puerto 3001 esté libre
2. Revisa el firewall
3. Verifica la URL del servidor en `lib/socket-multiplayer.ts`

## Licencia

MIT License - Libre para uso personal y comercial.

