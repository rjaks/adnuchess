import { createError, defineEventHandler, getCookie, readBody } from 'h3'
import { useStorage } from '#imports'
import { getUserSession } from '~/server/utils/sessionStore'
import { randomUUID } from 'crypto'

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
    
    // Check if player is already in queue
    const existingQueue = await storage.getItem(`queue:${session.user.id}`)
    if (existingQueue) {
      return { success: true, message: 'Already in queue' }
    }

    // Look for existing players in queue with same game mode
    const queueKeys = await storage.getKeys('queue:')
    
    for (const key of queueKeys) {
      const opponent = await storage.getItem<QueuePlayer>(key)
      if (opponent && opponent.gameMode === body.gameMode && opponent.userId !== session.user.id) {
        // Found a match! Create game
        const gameId = randomUUID()
        
        // Randomly assign colors
        const isCurrentPlayerWhite = Math.random() > 0.5
        
        const gameState: GameState = {
          id: gameId,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
          lastMove: null,
          lastMoveTime: Date.now(),
          currentTurn: 'white',
          player1: {
            id: isCurrentPlayerWhite ? session.user.id : opponent.userId,
            name: isCurrentPlayerWhite ? session.user.name : opponent.userName,
            color: 'white'
          },
          player2: {
            id: isCurrentPlayerWhite ? opponent.userId : session.user.id,
            name: isCurrentPlayerWhite ? opponent.userName : session.user.name,
            color: 'black'
          },
          status: 'active',
          gameMode: body.gameMode,
          createdAt: Date.now(),
          moveHistory: []
        }
        
        // Save game
        const gameStorage = useStorage('chess-games')
        await gameStorage.setItem(`game:${gameId}`, gameState)
        
        // Remove both players from queue
        await storage.removeItem(`queue:${session.user.id}`)
        await storage.removeItem(key)
        
        return { 
          success: true, 
          matchFound: true,
          gameId,
          playerColor: isCurrentPlayerWhite ? 'white' : 'black'
        }
      }
    }
    
    // No match found, add to queue
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
    return { success: false, message: 'Failed to join matchmaking queue' }
  }
})