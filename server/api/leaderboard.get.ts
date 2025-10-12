import { defineEventHandler, getQuery } from 'h3'
import { getUserById } from '~/server/utils/userStore'
import { listMatches } from '~/server/utils/chessStore'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '~/convex/_generated/api'

// Create a Convex client to interact with the API
const convex = new ConvexHttpClient(process.env.CONVEX_URL || '')

type LeaderboardPlayer = {
  id: string
  name: string
  email: string
  picture?: string
  department: string
  userType: 'student' | 'staff' | 'faculty' | 'alumni'
  yearLevel?: string
  rating: number
  ratingChange: number
  stats: {
    wins: number
    losses: number
    draws: number
  }
  streak: number
  lastActive: string
  totalMatches: number
  winRate: number
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const period = (query.period as string) || 'all'
  const limit = parseInt(query.limit as string) || 50

  try {
    // Get all profiles from Convex
    const profiles = await convex.query(api.profiles.getAllProfiles)

    // Get all matches to calculate additional stats
    const matches = await listMatches()
    
    // Map Convex profiles to leaderboard players
    const players: LeaderboardPlayer[] = []
    
    for (const profile of profiles) {
      // For display, use displayName if available
      const displayName = profile.displayName || profile.name
      
      // Calculate streak and other stats from matches (if available)
      const playerMatches = matches.filter(m => 
        (m.meta?.whitePlayerId === profile.userId || m.meta?.blackPlayerId === profile.userId) &&
        m.completedAt
      )
      
      // Initialize wins, losses, draws from match history
      let wins = 0
      let losses = 0
      let draws = 0
      
      // Calculate actual stats from match history
      playerMatches.forEach(match => {
        const isWhitePlayer = match.meta?.whitePlayerId === profile.userId
        const isBlackPlayer = match.meta?.blackPlayerId === profile.userId
        
        if (match.result === 'white' && isWhitePlayer) wins++
        else if (match.result === 'black' && isBlackPlayer) wins++
        else if ((match.result === 'white' && isBlackPlayer) || 
                 (match.result === 'black' && isWhitePlayer)) losses++
        else if (match.result === 'draw') draws++
      })
      
      // Calculate streak (consecutive wins/losses)
      let streak = 0
      const recentMatches = playerMatches
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 10)

      if (recentMatches.length > 0) {
        const lastResult = recentMatches[0].result
        let consecutiveCount = 0
        
        for (const match of recentMatches) {
          if (match.result === lastResult) {
            consecutiveCount++
          } else {
            break
          }
        }
        
        if (lastResult === 'white') {
          streak = consecutiveCount
        } else if (lastResult === 'black') {
          streak = -consecutiveCount
        }
      }

      // Use department from profile, or fallback to default
      let department = profile.department || 'College of Computer Studies' // Default fallback

      // Use role from profile or default to student
      let userType: 'student' | 'staff' | 'faculty' | 'alumni' = 'student'
      let yearLevel: string | undefined = undefined
      
      if (profile.role) {
        userType = profile.role as any // Convert to the expected type
      } else {
        // Guess from name patterns
        if (profile.name.toLowerCase().includes('prof') || profile.name.toLowerCase().includes('dr.')) {
          userType = 'faculty'
        } else if (profile.name.toLowerCase().includes('ms.') || profile.name.toLowerCase().includes('mr.')) {
          userType = 'staff'
        } else {
          userType = 'student'
          const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year']
          yearLevel = yearLevels[Math.floor(Math.random() * yearLevels.length)]
        }
      }

      // If no real match data yet, use placeholder data only for demo users
      if (playerMatches.length === 0 && profile.userId.startsWith('u_demo')) {
        wins = Math.floor(Math.random() * 30)
        losses = Math.floor(Math.random() * 20)
        draws = Math.floor(Math.random() * 10)
      }
      
      const totalMatches = wins + losses + draws
      const winRate = totalMatches > 0 
        ? Math.round((wins / totalMatches) * 100) || 0 // Include draws in total for percentage calculation
        : 0

      players.push({
        id: profile.userId,
        name: displayName,
        email: profile.email,
        picture: profile.picture,
        department,
        userType,
        yearLevel,
        rating: profile.elo, // Use actual ELO from Convex profile
        ratingChange: Math.floor(Math.random() * 40) - 20, // Mock data
        stats: { wins, losses, draws },
        streak,
        lastActive: new Date(profile.updatedAt).toISOString(),
        totalMatches,
        winRate
      })
    }

    // Sort by rating (descending)
    const sortedPlayers = players
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)

    return {
      players: sortedPlayers,
      totalPlayers: players.length,
      period
    }
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
    return {
      players: [],
      totalPlayers: 0,
      period
    }
  }
})
