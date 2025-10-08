import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const { $convex } = event.context
    
    if (!$convex) {
      throw createError({ statusCode: 500, statusMessage: 'Convex not available' })
    }
    
    // Run the cleanup function
    const result = await $convex.mutation('games:cleanupExpiredGames')
    
    return {
      success: true,
      ...result
    }
  } catch (error) {
    console.error('Failed to cleanup expired games:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to cleanup expired games'
    })
  }
})