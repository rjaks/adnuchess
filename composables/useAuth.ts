import { useState, nextTick } from '#imports'

export type AuthStats = {
  wins: number
  losses: number
  draws: number
}

export type AuthBadge = {
  id: string
  label: string
}

export type AuthUser = {
  id: string
  email: string
  name: string
  picture?: string
  createdAt: string
  updatedAt: string
  stats: AuthStats
  badges: AuthBadge[]
  achievements: AuthBadge[]
}

type SessionResponse = {
  user: AuthUser | null
}

type LoginResponse = SessionResponse & {
  isNew?: boolean
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const isInitialized = useState<boolean>('auth-initialized', () => false)

  const refresh = async () => {
    try {
      const response = await $fetch<SessionResponse>('/api/auth/session')
      user.value = response.user
      isInitialized.value = true
      return response.user
    } catch (error) {
      console.error('Failed to refresh session', error)
      user.value = null
      isInitialized.value = true
      throw error
    }
  }

  const loginWithCredential = async (credential: string) => {
    const response = await $fetch<LoginResponse>('/api/auth/google', {
      method: 'POST',
      body: { credential },
    })
    user.value = response.user
    isInitialized.value = true
    return response
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    isInitialized.value = true
  }

  // Auto-initialize auth state on first access (only on client side)
  if (process.client && !isInitialized.value) {
    // Use nextTick to avoid initialization during SSR hydration mismatch
    nextTick(() => {
      if (!isInitialized.value) {
        refresh().catch(() => {
          // Silently fail on initialization - the middleware will handle redirects if needed
        })
      }
    })
  }

  return { user, isInitialized, refresh, loginWithCredential, logout }
}
