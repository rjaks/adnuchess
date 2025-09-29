# Implementation Plan C: Fix Current Nuxt Setup

## Add Missing Production Dependencies

```bash
# Database & Storage
npm install prisma @prisma/client
npm install redis ioredis
npm install uuid date-fns

# Better WebSocket (alternative to Nuxt's experimental one)
npm install ws @types/ws
npm install socket.io socket.io-client

# Chess & Game Logic
npm install chess.js@latest
npm install stockfish@latest

# Development Tools
npm install -D prisma
```

## Database Setup
```bash
# Initialize Prisma
npx prisma init

# Create database schema
# prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  # Start simple
  url      = "file:./dev.db"
}

model Game {
  id          String   @id @default(cuid())
  player1Id   String
  player2Id   String
  gameMode    String
  fen         String   @default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  moves       Json     @default("[]")
  status      String   @default("active")
  winner      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model User {
  id       String @id @default(cuid())
  email    String @unique
  name     String
  rating   Int    @default(1200)
  wins     Int    @default(0)
  losses   Int    @default(0)
  draws    Int    @default(0)
}

# Generate database
npx prisma db push
npx prisma generate
```

## Replace Experimental WebSocket Handler
```typescript
// server/api/game/socket.ts (NEW FILE)
import { Server } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  socket.on('join_game', (gameId) => {
    socket.join(gameId)
    socket.to(gameId).emit('player_joined')
  })
  
  socket.on('make_move', (data) => {
    socket.to(data.gameId).emit('opponent_move', {
      move: data.move,
      fen: data.fen
    })
  })
})

httpServer.listen(3001)
```

## Update Nuxt Config
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // ... existing config
  
  // Remove experimental WebSocket - use Socket.IO instead
  nitro: {
    externals: {
      inline: ['google-auth-library']
    },
    // Don't use experimental WebSocket
    experimental: {
      wasm: false
    }
  },
  
  // Add runtime config for Socket.IO
  runtimeConfig: {
    socketPort: 3001,
    public: {
      socketUrl: 'http://localhost:3001'
    }
  }
})
```

## Pros
✅ **Keep current Nuxt setup**
✅ **Production-ready database**
✅ **Reliable WebSockets via Socket.IO**
✅ **Persistent game state**

## Cons
❌ **More complexity** in single app
❌ **Socket.IO adds 500KB** to bundle
❌ **Still fighting Nuxt's limitations**

## Implementation Time
- **2-3 days** for database setup
- **1-2 days** for Socket.IO integration
- **1 day** for testing