import { createError, defineEventHandler, getCookie } from 'h3'
import { useStorage } from '#imports'
import { getUserSession } from '~/server/utils/sessionStore'

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

  try {
    const storage = useStorage('matchmaking')
    const gameStorage = useStorage('chess-games')
    
    // First check if player has an active game
    const gameKeys = await gameStorage.getKeys('game:')
    
    for (const key of gameKeys) {
      const game = await gameStorage.getItem<GameState>(key)
      if (game && 
          (game.player1?.id === session.user.id || game.player2?.id === session.user.id) &&
          game.status === 'active') {
        return {
          inQueue: false,
          matchFound: true,
          gameId: game.id,
          playerColor: game.player1.id === session.user.id ? game.player1.color : game.player2.color
        }
      }
    }
    
    // Check if player is in queue
    const queueEntry = await storage.getItem<QueuePlayer>(`queue:${session.user.id}`)
    
    if (!queueEntry) {
      return { inQueue: false }
    }

    return {
      inQueue: true,
      gameMode: queueEntry.gameMode,
      queueTime: Date.now() - queueEntry.joinedAt
    }
  } catch (error) {
    console.error('Failed to get queue status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get queue status'
    })
  }
})