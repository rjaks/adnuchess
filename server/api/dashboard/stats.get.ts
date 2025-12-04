import { defineEventHandler } from 'h3'
import { useStorage } from '#imports'
import { listMatches } from '~/server/utils/chessStore'
import { refreshSession } from '~/server/utils/sessionStore'

export default defineEventHandler(async () => {
  const sessionStore = useStorage('auth-sessions')

  // Gather valid, non-expired sessions
  const keys = typeof sessionStore.getKeys === 'function' ? await sessionStore.getKeys() : []
  let playersOnline = 0

  for (const key of keys) {
    if (!key.startsWith('session:')) continue
    const id = key.split(':')[1]
    const session = await refreshSession(id)
    if (session) {
      playersOnline++
    }
  }

  // Count matches completed today
  const matches = await listMatches()
  const today = new Date().toISOString().slice(0, 10)
  const dailyMatches = matches.filter((m) => m.completedAt?.startsWith(today)).length

  return {
    playersOnline,
    dailyMatches,
    tournamentSlots: 0,
  }
})
