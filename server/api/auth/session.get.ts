import { defineEventHandler, getCookie } from 'h3'
import { refreshSession } from '~/server/utils/sessionStore'
import { getUserById, toProfile } from '~/server/utils/userStore'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'adnu_session')
  if (!sessionId) {
    return { user: null }
  }

  const session = await refreshSession(sessionId) // Use refresh instead of getSession
  if (!session) {
    return { user: null }
  }

  const record = await getUserById(session.user.id)
  if (!record) {
    return { user: null }
  }

  return { user: toProfile(record) }
})
