import { createError, defineEventHandler, getCookie } from 'h3'
import { useStorage } from '#imports'
import { getUserSession } from '~/server/utils/sessionStore'

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
    await storage.removeItem(`queue:${session.user.id}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to leave queue:', error)
    return { success: false, message: 'Failed to leave matchmaking queue' }
  }
})