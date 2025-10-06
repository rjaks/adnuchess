# Implementation Plan A: Polling-Based Multiplayer

## Why This Works
- No WebSocket dependencies
- Works with current Nuxt setup
- Can be implemented immediately

## What to Add
```bash
npm install uuid date-fns
```

## Implementation Steps

### 1. Replace WebSocket with HTTP Polling
```typescript
// pages/game/[id].vue
const pollGameState = async () => {
  try {
    const response = await $fetch(`/api/game/${matchId}/state`)
    if (response.lastMove !== lastMoveTimestamp.value) {
      // Update game state
      game.value.move(response.lastMove.move)
      fen.value = response.fen
      lastMoveTimestamp.value = response.lastMove.timestamp
    }
  } catch (error) {
    console.error('Failed to poll game state:', error)
  }
}

// Poll every 1 second
const gameInterval = setInterval(pollGameState, 1000)
```

### 2. Add API Endpoints
```typescript
// server/api/game/[id]/state.get.ts
export default defineEventHandler(async (event) => {
  const gameId = getRouterParam(event, 'id')
  const gameState = await getGameState(gameId)
  return {
    fen: gameState.fen,
    lastMove: gameState.lastMove,
    turn: gameState.turn,
    status: gameState.status
  }
})

// server/api/game/[id]/move.post.ts
export default defineEventHandler(async (event) => {
  const gameId = getRouterParam(event, 'id')
  const { move, fen } = await readBody(event)
  
  await updateGameState(gameId, { move, fen, timestamp: Date.now() })
  return { success: true }
})
```

### 3. Persist Game State
```typescript
// server/utils/gameStore.ts
import { storage } from 'nitro/storage'

export const updateGameState = async (gameId: string, moveData: any) => {
  await storage.setItem(`game:${gameId}`, {
    fen: moveData.fen,
    lastMove: {
      move: moveData.move,
      timestamp: moveData.timestamp
    },
    updatedAt: Date.now()
  })
}
```

## Pros
✅ Works immediately with your current setup
✅ No complex WebSocket debugging
✅ Can handle 10-20 concurrent games easily
✅ Simple to test and deploy

## Cons
❌ 1-second delay between moves
❌ More server requests
❌ Not "real-time" feeling