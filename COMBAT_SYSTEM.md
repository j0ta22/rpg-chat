# Sistema de Combate por Turnos

## Descripción General

El sistema de combate permite a los jugadores desafiar a otros jugadores cercanos y participar en combates por turnos. Cada jugador comienza con 100 puntos de vida y el objetivo es reducir la vida del oponente a 0.

## Flujo del Sistema

### 1. Desafío
- Un jugador se acerca a otro (dentro de 80 píxeles de distancia)
- Aparece el texto "Press E to challenge" sobre el jugador cercano
- Al presionar E, se envía un desafío al otro jugador
- El jugador desafiado tiene 30 segundos para aceptar o declinar

### 2. Aceptación del Desafío
- Si acepta: Se inicia el combate
- Si declina: El desafío se cancela
- Si expira: El desafío se cancela automáticamente

### 3. Combate por Turnos
- Ambos jugadores comienzan con 100 puntos de vida
- El jugador que desafió comienza el primer turno
- Cada turno tiene 30 segundos de tiempo límite
- Si no se elige una acción, se ejecuta un ataque automático

## Acciones Disponibles

### ⚔️ Atacar
- Inflige daño aleatorio entre 15-25 puntos
- No puede ser bloqueado ni esquivado por el atacante

### 🛡️ Bloquear
- Reduce el daño recibido a la mitad
- Solo funciona si el oponente ataca en el mismo turno

### 💨 Esquivar
- 30% de probabilidad de evitar completamente el daño
- Si falla, recibe el daño completo

## Mecánicas del Combate

### Cálculo de Daño
```typescript
// Daño base del ataque
const baseDamage = Math.random() * (25 - 15 + 1) + 15

// Si el oponente bloqueó
const finalDamage = isBlocked ? baseDamage * 0.5 : baseDamage

// Si el oponente esquivó (30% de probabilidad)
const isDodged = Math.random() < 0.3
```

### Condiciones de Victoria
- El primer jugador en llegar a 0 puntos de vida pierde
- El combate termina automáticamente
- Se muestra la pantalla de victoria/derrota

## Interfaz de Usuario

### Durante el Desafío
- Modal con información del desafío
- Botones para aceptar/declinar
- Timer de 30 segundos
- Explicación de las reglas del combate

### Durante el Combate
- Barras de vida de ambos jugadores
- Indicador de turno actual
- Botones para las tres acciones
- Timer de 30 segundos por turno
- Historial de la última acción

### Al Finalizar
- Pantalla de victoria/derrota
- Estadísticas del combate (duración, turnos)
- Botón para continuar

## Implementación Técnica

### Archivos Principales
- `lib/combat-system.ts` - Lógica del sistema de combate
- `components/combat-interface.tsx` - Interfaz del combate
- `components/combat-challenge.tsx` - Interfaz del desafío
- `lib/socket-multiplayer.ts` - Comunicación con el servidor

### Estados del Combate
```typescript
interface CombatState {
  id: string
  challenger: CombatPlayer
  challenged: CombatPlayer
  currentTurn: string
  turns: CombatTurn[]
  status: 'waiting' | 'active' | 'finished'
  winner?: string
  startTime: number
  endTime?: number
}
```

### Eventos del Servidor
- `challengePlayer` - Enviar desafío
- `respondToChallenge` - Responder al desafío
- `combatAction` - Enviar acción de combate
- `combatChallenge` - Recibir desafío
- `combatStateUpdate` - Actualización del estado

## Constantes Configurables

```typescript
const COMBAT_CONSTANTS = {
  MAX_HEALTH: 100,
  ATTACK_DAMAGE_MIN: 15,
  ATTACK_DAMAGE_MAX: 25,
  BLOCK_DAMAGE_REDUCTION: 0.5,
  DODGE_CHANCE: 0.3,
  CHALLENGE_RANGE: 80,
  CHALLENGE_TIMEOUT: 30000,
  TURN_TIMEOUT: 30000,
}
```

## Controles

- **E** - Desafiar jugador cercano o interactuar con NPC
- **WASD / Flechas** - Movimiento (deshabilitado durante combate)
- **Enter / T** - Chat (deshabilitado durante combate)

## Notas de Implementación

- El sistema está completamente integrado con el sistema de multiplayer existente
- Los combates son síncronos y requieren conexión al servidor
- La detección de proximidad se actualiza en tiempo real
- Los timers son manejados tanto en cliente como servidor para sincronización
- El sistema es extensible para futuras mejoras (armas, habilidades especiales, etc.)
