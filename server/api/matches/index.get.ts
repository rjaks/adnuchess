import { createError, defineEventHandler, getCookie } from 'h3'
import { listMatches } from '~/server/utils/chessStore'
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

  const matches = await listMatches()
  const playerMatches = matches.filter((match) => match.meta && (match.meta as Record<string, unknown>).playerId === session.user.id)

  return { matches: playerMatches }
})
