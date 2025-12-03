import { createError, defineEventHandler, getCookie, readBody } from 'h3'
import { useStorage } from '#imports'
import { getUserSession } from '~/server/utils/sessionStore'
import { randomUUID } from 'crypto'

// Map game modes to time control strings
const gameModeToTimeControl: Record<string, string> = {
  'bullet': '1+0',
  'blitz': '5+3',
  'rapid': '10+5',
  'classical': '30+0'
}

type QueuePlayer = {
  userId: string
  userName: string
  userRating: number
  gameMode: string
  joinedAt: number
}

type GameState = {
  id: string
  fen: string
  lastMove: string | null
  lastMoveTime: number
  currentTurn: 'white' | 'black'
  player1: { id: string; name: string; color: 'white' | 'black' }
  player2: { id: string; name: string; color: 'white' | 'black' }
  status: 'waiting' | 'active' | 'finished'
  winner?: string
  gameMode: string
  createdAt: number
  moveHistory: string[]
}

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'adnu_session')
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const session = await getUserSession(sessionId)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }

  const body = await readBody<{
    gameMode: string
    rating: number
  }>(event)

  if (!body.gameMode || !body.rating) {
    throw createError({ statusCode: 400, statusMessage: 'Game mode and rating are required' })
  }

  try {
    const storage = useStorage('matchmaking')
    
    console.log(`[Matchmaking] Player ${session.user.name} (${session.user.id}) joining ${body.gameMode} queue`)
    
    // Check if player is already in queue
    const existingQueue = await storage.getItem(`queue:${session.user.id}`)
    if (existingQueue) {
      console.log(`[Matchmaking] Player ${session.user.name} already in queue`)
      return { 
        success: true, 
        matchFound: false,
        message: 'Already in queue' 
      }
    }

    // Look for existing players in queue with same game mode
    const queueKeys = await storage.getKeys('queue:')
    console.log(`[Matchmaking] Found ${queueKeys.length} players in queue`)
    
    for (const key of queueKeys) {
      const opponent = await storage.getItem<QueuePlayer>(key)
      if (opponent && opponent.gameMode === body.gameMode && opponent.userId !== session.user.id) {
        // Found a match! Create game
        console.log(`[Matchmaking] Match found! ${session.user.name} vs ${opponent.userName}`)
        const gameId = randomUUID()
        
        // Randomly assign colors - but be consistent with our Convex schema:
        // player1 is always white, player2 is always black
        const isCurrentPlayerWhite = Math.random() > 0.5
        
        // Determine which player is player1 (white) and which is player2 (black)
        const whitePlayerId = isCurrentPlayerWhite ? session.user.id : opponent.userId
        const whitePlayerName = isCurrentPlayerWhite ? session.user.name : opponent.userName
        const blackPlayerId = isCurrentPlayerWhite ? opponent.userId : session.user.id
        const blackPlayerName = isCurrentPlayerWhite ? opponent.userName : session.user.name
        
        const gameState: GameState = {
          id: gameId,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
          lastMove: null,
          lastMoveTime: Date.now(),
          currentTurn: 'white',
          player1: {
            id: whitePlayerId,
            name: whitePlayerName,
            color: 'white'
          },
          player2: {
            id: blackPlayerId,
            name: blackPlayerName,
            color: 'black'
          },
          status: 'active',
          gameMode: body.gameMode,
          createdAt: Date.now(),
          moveHistory: []
        }
        
        // Save game to local storage for backward compatibility
        const gameStorage = useStorage('chess-games')
        await gameStorage.setItem(`game:${gameId}`, gameState)
        
        // Save game to Convex
        try {
          const { $convex } = event.context
          
          if (!$convex) {
            console.error('[Matchmaking] Convex client not available')
            throw new Error('Convex client not available')
          }
          
          const timeControlString = gameModeToTimeControl[body.gameMode] || undefined
          
          console.log(`[Matchmaking] Creating game in Convex with timeControl: ${timeControlString}`)
          
          await $convex.mutation('chess_games:createGame', {
            gameId,
            player1: {
              id: gameState.player1.id,
              name: gameState.player1.name,
              color: "white" // Explicitly set to white
            },
            player2: {
              id: gameState.player2.id,
              name: gameState.player2.name,
              color: "black" // Explicitly set to black
            },
            gameMode: body.gameMode,
            timeControlString // Pass the time control string
          })
          
          console.log(`[Matchmaking] Game ${gameId} created in Convex successfully`)
        } catch (convexError) {
          console.error('[Matchmaking] Failed to create game in Convex:', convexError)
          // Continue anyway - game is in local storage
        }
        
        // Remove both players from queue
        await storage.removeItem(`queue:${session.user.id}`)
        await storage.removeItem(key)
        
        console.log(`[Matchmaking] Game ${gameId} created. Removed both players from queue.`)
        
        return { 
          success: true, 
          matchFound: true,
          gameId,
          playerColor: isCurrentPlayerWhite ? 'white' : 'black'
        }
      }
    }
    
    // No match found, add to queue
    console.log(`[Matchmaking] No match found for ${session.user.name}. Adding to queue.`)
    const queuePlayer: QueuePlayer = {
      userId: session.user.id,
      userName: session.user.name,
      userRating: body.rating,
      gameMode: body.gameMode,
      joinedAt: Date.now()
    }
    
    await storage.setItem(`queue:${session.user.id}`, queuePlayer)
    
    return { success: true, matchFound: false }
  } catch (error) {
    console.error('Failed to join queue:', error)
    
    // Return proper error response instead of throwing
    return { 
      success: false, 
      matchFound: false,
      message: error instanceof Error ? error.message : 'Failed to join matchmaking queue' 
    }
  }
})