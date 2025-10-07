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
    await $convex.mutation('games:createGame', {
      gameId,
      player1,
      player2,
      gameMode
    })
    
    return { success: true, gameId }
  } catch (error) {
    console.error('Failed to create game:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create game'
    })
  }
})
