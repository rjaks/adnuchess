import { createError, defineEventHandler, getCookie } from 'h3'
import { getUserSession } from '~/server/utils/sessionStore'
import { getMatchDetails } from '~/server/utils/matchmakingStore'

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

  // Get match details from matchmaking store
  const match = await getMatchDetails(matchId)
  if (!match) {
    throw createError({ statusCode: 404, statusMessage: 'Match not found' })
  }

  // Determine player color (first player is white, second is black)
  const isPlayer1 = session.user.id === match.player1.userId
  const isPlayer2 = session.user.id === match.player2.userId
  
  if (!isPlayer1 && !isPlayer2) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized for this match' })
  }

  const playerColor = isPlayer1 ? 'white' : 'black'
  const opponent = isPlayer1 ? match.player2 : match.player1

  return {
    match: {
      id: match.id,
      gameMode: match.gameMode,
      player1: {
        id: match.player1.userId,
        name: match.player1.userName,
        rating: match.player1.rating
      },
      player2: {
        id: match.player2.userId,
        name: match.player2.userName,
        rating: match.player2.rating
      },
      currentTurn: 'white' as const
    },
    playerColor,
    opponent: {
      id: opponent.userId,
      name: opponent.userName,
      rating: opponent.rating
    }
  }
})