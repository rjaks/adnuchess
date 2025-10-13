import type { H3Event } from 'h3'
import { createError, getCookie } from 'h3'
import { api } from '~/convex/_generated/api'
import { log } from '~/server/utils/logger'

export default defineEventHandler(async (event: H3Event) => {  try {
    // Only allow in development for now
    if (process.env.NODE_ENV === 'production') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Debug endpoint only available in development'
      })
    }

    const { $convex } = event.context
    if (!$convex) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Convex unavailable'
      })
    }

    // Try to get some basic profile info for debugging
    try {
      // Test if we can create a simple profile query
      const testUserId = 'test-debug-query'
      const testProfile = await $convex.query(api.profiles.getByUserId, { userId: testUserId })
      
      log.info('Profile conflict debug endpoint accessed', {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        convexResponse: testProfile === null ? 'working' : 'unexpected_result'
      })

      return {
        success: true,
        message: 'Profile conflict analysis endpoint is working',
        data: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          convexAvailable: true,
          status: 'Convex queries working normally',
          recommendation: 'Monitor server logs for write conflict errors during user registration'
        }
      }
      
    } catch (convexError: any) {
      return {
        success: false,
        error: 'Convex query failed',
        details: convexError.message || 'Unknown Convex error',
        timestamp: new Date().toISOString()
      }
    }
    
  } catch (error) {
    log.error('Profile conflict debug failed', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
})

async function getServerSession(event: H3Event) {
  // Simple session check - adapt to your auth system
  try {
    const { getUserSession } = await import('~/server/utils/sessionStore')
    const sessionId = getCookie(event, 'session-id')
    if (!sessionId) return null
    
    return await getUserSession(sessionId)
  } catch {
    return null
  }
}
