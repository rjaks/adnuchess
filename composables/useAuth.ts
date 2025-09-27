import { useState } from '#imports'

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

  const refresh = async () => {
    try {
      const response = await $fetch<SessionResponse>('/api/auth/session')
      user.value = response.user
    } catch (error) {
      console.error('Failed to refresh session', error)
      user.value = null
    }
  }

  const loginWithCredential = async (credential: string) => {
    const response = await $fetch<LoginResponse>('/api/auth/google', {
      method: 'POST',
      body: { credential },
    })
    user.value = response.user
    return response
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  return { user, refresh, loginWithCredential, logout }
}
