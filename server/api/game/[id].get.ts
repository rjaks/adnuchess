import { createError, defineEventHandler, getCookie } from 'h3'
import { getUserSession } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  const matchId = getRouterParam(event, 'id')
  const sessionId = getCookie(event, 'adnu_session')
  
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const session = await getUserSession(sessionId)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }

  if (!matchId) {
    throw createError({ statusCode: 400, statusMessage: 'Match ID required' })
  }

  // In a real implementation, you'd fetch this from your database
  // For now, we'll return mock data
  const mockMatch = {
    id: matchId,
    gameMode: 'blitz',
    player1: {
      id: 'player1',
      name: 'Maria Santos',
      rating: 1250
    },
    player2: {
      id: 'player2', 
      name: 'Juan Cruz',
      rating: 1180
    },
    currentTurn: 'white' as const
  }

  // Determine player color (first player is white, second is black)
  const playerColor = session.user.id === mockMatch.player1.id ? 'white' : 'black'

  return {
    match: mockMatch,
    playerColor
  }
})