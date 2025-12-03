import { defineEventHandler, getCookie } from 'h3'
import { refreshSession } from '~/server/utils/sessionStore'
import { getUserById, toProfile } from '~/server/utils/userStore'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '~/convex/_generated/api'

// Create Convex client for fetching ELO
const convex = new ConvexHttpClient(process.env.CONVEX_URL || '')

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'adnu_session')
  if (!sessionId) {
    return { user: null }
  }

  const session = await refreshSession(sessionId) // Use refresh instead of getSession
  if (!session) {
    return { user: null }
  }

  const record = await getUserById(session.user.id)
  if (!record) {
    return { user: null }
  }

  // Fetch ELO rating and game stats from Convex profile
  let eloRating = 1500
  let gamesPlayed = 0
  let wins = 0
  let losses = 0
  let draws = 0
  
  try {
    const convexProfile = await convex.query(api.profiles.getByUserId, { 
      userId: session.user.id 
    })
    if (convexProfile) {
      eloRating = convexProfile.eloRating ?? convexProfile.elo ?? 1500
      gamesPlayed = convexProfile.gamesPlayed ?? 0
      wins = convexProfile.wins ?? 0
      losses = convexProfile.losses ?? 0
      draws = convexProfile.draws ?? 0
    }
  } catch (error) {
    console.error('Failed to fetch ELO from Convex:', error)
  }

  const profile = toProfile(record)
  
  return { 
    user: {
      ...profile,
      eloRating,
      gamesPlayed,
      stats: {
        wins,
        losses,
        draws
      }
    }
  }
})
