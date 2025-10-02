import { useStorage, useRuntimeConfig } from '#imports'

// Simple UUID v4 generator for compatibility
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

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

export const createSession = async (user: SessionUser) => {
  const config = useRuntimeConfig()
  const ttlDays = config.sessionTtlDays || 7
  const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * ttlDays
  
  const id = generateUUID()
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

export const getUserSession = async (id: string) => {
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

export const refreshSession = async (id: string) => {
  const config = useRuntimeConfig()
  const ttlDays = config.sessionTtlDays || 7
  const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * ttlDays
  const REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 // Refresh if less than 1 day remaining
  
  const record = await storage().getItem<SessionRecord | null>(`session:${id}`)
  if (!record) {
    return null
  }
  
  const now = Date.now()
  const expiresAt = new Date(record.expiresAt).getTime()
  
  // Only refresh if session is still valid and needs refreshing
  if (expiresAt < now) {
    await storage().removeItem(`session:${id}`)
    return null
  }
  
  // Refresh if less than 1 day remaining
  if (expiresAt - now < REFRESH_THRESHOLD_MS) {
    const refreshedRecord: SessionRecord = {
      ...record,
      expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    }
    await storage().setItem(`session:${id}`, refreshedRecord)
    return refreshedRecord
  }
  
  return record
}

export const deleteSession = async (id: string) => {
  await storage().removeItem(`session:${id}`)
}
