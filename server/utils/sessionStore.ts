import { useStorage } from '#imports'
import { randomUUID } from 'node:crypto'

export type SessionUser = {
  id: string
  email: string
  name: string
  picture?: string
}

export type SessionRecord = {
  id: string
  user: SessionUser
  createdAt: string
  expiresAt: string
}

const storage = () => useStorage('auth-sessions')

const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

export const createSession = async (user: SessionUser) => {
  const id = randomUUID()
  const now = Date.now()
  const record: SessionRecord = {
    id,
    user,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  }
  await storage().setItem(`session:${id}`, record)
  return record
}

export const getSession = async (id: string) => {
  const record = await storage().getItem<SessionRecord | null>(`session:${id}`)
  if (!record) {
    return null
  }
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    await storage().removeItem(`session:${id}`)
    return null
  }
  return record
}

export const deleteSession = async (id: string) => {
  await storage().removeItem(`session:${id}`)
}
