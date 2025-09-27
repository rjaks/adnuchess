import { defineEventHandler, deleteCookie, getCookie } from 'h3'
import { deleteSession } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'adnu_session')
  if (sessionId) {
    await deleteSession(sessionId)
  }

  deleteCookie(event, 'adnu_session', { path: '/' })

  return { success: true }
})
