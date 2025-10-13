import { defineEventHandler, getCookie } from 'h3'
import { getUserSession } from '~/server/utils/sessionStore'
import { log } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'adnu_session')
  
  const debug = {
    timestamp: new Date().toISOString(),
    sessionId: sessionId ? `***${sessionId.slice(-4)}` : null,
    hasSession: !!sessionId,
    userAgent: event.node.req.headers['user-agent'],
    url: event.node.req.url,
    method: event.node.req.method
  }

  log.info('Debug auth endpoint called', debug)

  if (!sessionId) {
    return {
      authenticated: false,
      error: 'No session cookie found',
      debug
    }
  }

  try {
    const session = await getUserSession(sessionId)
    
    if (!session) {
      return {
        authenticated: false,
        error: 'Session not found in store',
        debug
      }
    }

    // Check Convex profile
    const { $convex } = event.context
    let profile = null
    let convexError = null
    
    if ($convex) {
      try {
        const { api } = await import('~/convex/_generated/api')
        profile = await $convex.query(api.profiles.getByUserId, {
          userId: session.user.id
        })
      } catch (error) {
        convexError = error instanceof Error ? error.message : 'Unknown Convex error'
        log.error('Convex query failed in debug endpoint', error)
      }
    }

    return {
      authenticated: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        hasProfile: !!profile,
        profileRole: profile?.role || null,
        profileComplete: !!(profile?.role)
      },
      convexAvailable: !!$convex,
      convexError,
      debug
    }
    
  } catch (error) {
    log.error('Debug auth endpoint error', error, debug)
    
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug
    }
  }
})
