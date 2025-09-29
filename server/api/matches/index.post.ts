import { createError, defineEventHandler, getCookie, readBody } from 'h3'
import { saveMatch, type MatchRecord } from '~/server/utils/chessStore'
import { getUserSession } from '~/server/utils/sessionStore'
import { recordMatchResult } from '~/server/utils/userStore'

type SaveMatchPayload = {
  moves: string[]
  result: MatchRecord['result']
  startedAt: string
  completedAt: string
  meta?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'adnu_session')
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const session = await getUserSession(sessionId)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }

  const body = await readBody<SaveMatchPayload>(event)

  if (!body || !Array.isArray(body.moves) || body.moves.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid match payload' })
  }

  const requiredFields: Array<keyof SaveMatchPayload> = ['result', 'startedAt', 'completedAt']
  for (const field of requiredFields) {
    if (!body[field]) {
      throw createError({ statusCode: 400, statusMessage: `Missing field: ${field}` })
    }
  }

  const saved = await saveMatch({
    moves: body.moves,
    result: body.result,
    startedAt: body.startedAt,
    completedAt: body.completedAt,
    meta: { ...body.meta, playerId: session.user.id },
  })

  const user = await recordMatchResult(session.user.id, body.result)

  return { match: saved, user }
})

