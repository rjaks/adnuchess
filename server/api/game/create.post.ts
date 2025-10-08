import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { getUserSession } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  // Get session
  const sessionId = getCookie(event, 'adnu_session')
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  
  const session = await getUserSession(sessionId)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }

  try {
    const body = await readBody(event)
    const { gameId, player1, player2, gameMode } = body
      const { $convex } = event.context
    
    // Create the game in Convex
    try {
      // Try with new chess_games module first
      await $convex.mutation('chess_games:createGame', {
        gameId,
        player1,
        player2,
        gameMode
      });
      console.log('[Server] Successfully created game with chess_games module');
    } catch (chessGamesError) {
      console.warn(`[Server] chess_games path failed, trying fallback:`, chessGamesError);
      
      // Fallback to old games module
      await $convex.mutation('games:createGame', {
        gameId,
        player1,
        player2,
        gameMode
      });
      console.log('[Server] Successfully created game with games fallback');
    }
    
    return { success: true, gameId }
  } catch (error) {
    console.error('Failed to create game:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create game'
    })
  }
})
