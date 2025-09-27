import { useStorage } from '#imports'

export type UserStats = {
  wins: number
  losses: number
  draws: number
}

export type UserRecord = {
  id: string
  email: string
  name: string
  picture?: string
  createdAt: string
  updatedAt: string
  stats: UserStats
  badges: string[]
  achievements: string[]
}

export type UserBadge = {
  id: string
  label: string
}

export type UserProfile = Omit<UserRecord, 'badges' | 'achievements'> & {
  badges: UserBadge[]
  achievements: UserBadge[]
}

const storage = () => useStorage('users')

export const BADGE_CATALOG = [
  { id: 'first-move', label: 'First Move', condition: (stats: UserStats) => stats.wins + stats.losses + stats.draws >= 1 },
  { id: 'first-win', label: 'First Victory', condition: (stats: UserStats) => stats.wins >= 1 },
  { id: 'five-wins', label: 'Winning Streak', condition: (stats: UserStats) => stats.wins >= 5 },
] as const

export const ACHIEVEMENT_CATALOG = [
  { id: 'ten-matches', label: 'Ten Matches', condition: (stats: UserStats) => stats.wins + stats.losses + stats.draws >= 10 },
  { id: 'three-draws', label: 'Tactician', condition: (stats: UserStats) => stats.draws >= 3 },
] as const

const BADGE_LOOKUP = BADGE_CATALOG.reduce<Record<string, string>>((acc, item) => {
  acc[item.id] = item.label
  return acc
}, {})

const ACHIEVEMENT_LOOKUP = ACHIEVEMENT_CATALOG.reduce<Record<string, string>>((acc, item) => {
  acc[item.id] = item.label
  return acc
}, {})

export const getUserById = async (id: string) => {
  return storage().getItem<UserRecord | null>(`user:${id}`)
}

export const upsertGoogleUser = async (payload: {
  id: string
  email: string
  name?: string | null
  picture?: string | null
}) => {
  const now = new Date().toISOString()
  const existing = await getUserById(payload.id)
  if (existing) {
    const updated: UserRecord = {
      ...existing,
      email: payload.email,
      name: payload.name || existing.name,
      picture: payload.picture || existing.picture,
      updatedAt: now,
    }
    await storage().setItem(`user:${payload.id}`, updated)
    return { user: toProfile(updated), isNew: false }
  }

  const user: UserRecord = {
    id: payload.id,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || undefined,
    createdAt: now,
    updatedAt: now,
    stats: { wins: 0, losses: 0, draws: 0 },
    badges: [],
    achievements: [],
  }

  await storage().setItem(`user:${payload.id}`, user)
  return { user: toProfile(user), isNew: true }
}

const collectRewards = (user: UserRecord) => {
  const stats = user.stats
  const badgeIds = new Set(user.badges)
  for (const badge of BADGE_CATALOG) {
    if (badge.condition(stats)) {
      badgeIds.add(badge.id)
    }
  }

  const achievementIds = new Set(user.achievements)
  for (const achievement of ACHIEVEMENT_CATALOG) {
    if (achievement.condition(stats)) {
      achievementIds.add(achievement.id)
    }
  }

  return {
    badges: Array.from(badgeIds),
    achievements: Array.from(achievementIds),
  }
}

export const recordMatchResult = async (userId: string, result: 'white' | 'black' | 'draw') => {
  const user = await getUserById(userId)
  if (!user) {
    return null
  }

  switch (result) {
    case 'white':
      user.stats.wins += 1
      break
    case 'black':
      user.stats.losses += 1
      break
    default:
      user.stats.draws += 1
      break
  }

  const rewards = collectRewards(user)
  user.badges = rewards.badges
  user.achievements = rewards.achievements
  user.updatedAt = new Date().toISOString()

  await storage().setItem(`user:${userId}`, user)
  return toProfile(user)
}

export const toProfile = (user: UserRecord): UserProfile => {
  return {
    ...user,
    badges: user.badges.map((id) => ({ id, label: BADGE_LOOKUP[id] || id })),
    achievements: user.achievements.map((id) => ({ id, label: ACHIEVEMENT_LOOKUP[id] || id })),
  }
}
