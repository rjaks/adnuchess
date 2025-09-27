import { useStorage } from '#imports'
import { randomUUID } from 'node:crypto'

export type MatchRecord = {
  id: string
  moves: string[]
  result: 'white' | 'black' | 'draw'
  startedAt: string
  completedAt: string
  meta?: Record<string, unknown>
}

const storage = () => useStorage('chess-matches')

export const saveMatch = async (record: Omit<MatchRecord, 'id'>) => {
  const id = randomUUID()
  const value: MatchRecord = { id, ...record }
  await storage().setItem(`matches:${id}`, value)
  await appendMatchIndex(id)
  return value
}

export const listMatches = async () => {
  const ids = (await storage().getItem<string[]>('matches:index')) ?? []
  const entries = await Promise.all(
    ids.map((matchId) => storage().getItem<MatchRecord | null>(`matches:${matchId}`)),
  )
  return entries.filter(Boolean) as MatchRecord[]
}

const appendMatchIndex = async (id: string) => {
  const current = (await storage().getItem<string[]>('matches:index')) ?? []
  await storage().setItem('matches:index', [id, ...current].slice(0, 100))
}
