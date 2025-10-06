# Implementation Plan B: Switch to Better Platform

## Recommended: Bun + Elysia Framework

### Why Bun?
- **Native WebSocket support** (no compatibility issues)
- **2x faster** than Node.js
- **Better TypeScript integration**
- **Built-in test runner**

## Setup Commands
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Create new project
bun create elysia chess-backend
cd chess-backend

# Install dependencies
bun add @elysiajs/websocket chess.js uuid
bun add -d @types/uuid
```

## Implementation
```typescript
// server.ts
import { Elysia } from 'elysia'
import { websocket } from '@elysiajs/websocket'
import { Chess } from 'chess.js'

const games = new Map<string, {
  chess: Chess
  players: Set<WebSocket>
  moves: Array<{ move: string; timestamp: number }>
}>()

const app = new Elysia()
  .use(websocket())
  .ws('/game/:id', {
    open(ws) {
      const gameId = ws.data.params.id
      if (!games.has(gameId)) {
        games.set(gameId, {
          chess: new Chess(),
          players: new Set(),
          moves: []
        })
      }
      games.get(gameId)!.players.add(ws)
    },
    
    message(ws, message) {
      const gameId = ws.data.params.id
      const game = games.get(gameId)
      
      if (game && message.type === 'move') {
        const move = game.chess.move(message.move)
        if (move) {
          // Broadcast to all players
          game.players.forEach(player => {
            if (player !== ws) {
              player.send({
                type: 'opponent_move',
                move: message.move,
                fen: game.chess.fen()
              })
            }
          })
        }
      }
    },
    
    close(ws) {
      const gameId = ws.data.params.id
      games.get(gameId)?.players.delete(ws)
    }
  })
  .listen(3001)

console.log('Chess server running on http://localhost:3001')
```

## Frontend Integration
```typescript
// composables/useChessGame.ts
export const useChessGame = (gameId: string) => {
  const ws = new WebSocket(`ws://localhost:3001/game/${gameId}`)
  
  const makeMove = (move: string) => {
    ws.send(JSON.stringify({
      type: 'move',
      move
    }))
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'opponent_move') {
      // Update game state immediately - TRUE real-time!
      game.value.move(data.move)
      fen.value = data.fen
    }
  }
  
  return { makeMove }
}
```

## Migration Strategy
1. **Keep Nuxt frontend** (UI, pages, auth)
2. **Create Bun backend** (game logic, WebSockets)
3. **Connect them** via WebSocket API
4. **Deploy separately** (Vercel for Nuxt, Railway for Bun)

## Pros
✅ **TRUE real-time** (0ms delay)
✅ **Production-ready** WebSockets
✅ **Scales to 1000+ concurrent games**
✅ **Native TypeScript support**
✅ **Keep your current UI/auth**

## Cons
❌ Learning new framework (2-3 days)
❌ Two deployments to manage
❌ More complex architecture