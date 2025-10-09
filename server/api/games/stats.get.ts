import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const { $convex } = event.context
    
    if (!$convex) {
      throw createError({ statusCode: 500, statusMessage: 'Convex not available' })
    }
    
    // Get all games
    const allGames = await $convex.query('games:getAllGames')
    
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000
    
    let active = 0
    let finished = 0
    let expired = 0
    
    for (const game of allGames) {
      const gameAge = now - game.createdAt
      
      if (game.status === 'active') {
        if (gameAge > thirtyMinutes) {
          expired++
        } else {
          active++
        }
      } else if (game.status === 'finished') {
        if (game.winner === 'expired') {
          expired++
        } else {
          finished++
        }
      }
    }
    
    return {
      success: true,
      stats: {
        total: allGames.length,
        active,
        finished,
        expired
      }
    }
  } catch (error) {
    console.error('Failed to get game stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get game statistics'
    })
  }
})