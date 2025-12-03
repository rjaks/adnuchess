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
      
      // Get stats directly from profile (stored stats)
      const wins = profile.wins ?? 0
      const losses = profile.losses ?? 0
      const draws = profile.draws ?? 0
      const gamesPlayed = profile.gamesPlayed ?? 0
      
      // Calculate streak from matches (if available) - this is still dynamic
      const playerMatches = matches.filter(m => 
        (m.meta?.whitePlayerId === profile.userId || m.meta?.blackPlayerId === profile.userId) &&
        m.completedAt
      )
      
      // Calculate streak (consecutive wins/losses)
      let streak = 0
      const recentMatches = playerMatches
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 10)

      if (recentMatches.length > 0) {
        const firstMatch = recentMatches[0]
        const isWhitePlayer = firstMatch.meta?.whitePlayerId === profile.userId
        const isBlackPlayer = firstMatch.meta?.blackPlayerId === profile.userId
        
        // Determine if player won/lost the first match
        let firstResult: 'win' | 'loss' | 'draw' = 'draw'
        if (firstMatch.result === 'white' && isWhitePlayer) firstResult = 'win'
        else if (firstMatch.result === 'black' && isBlackPlayer) firstResult = 'win'
        else if ((firstMatch.result === 'white' && isBlackPlayer) || 
                 (firstMatch.result === 'black' && isWhitePlayer)) firstResult = 'loss'
        
        let consecutiveCount = 0
        
        for (const match of recentMatches) {
          const isWhite = match.meta?.whitePlayerId === profile.userId
          const isBlack = match.meta?.blackPlayerId === profile.userId
          
          let matchResult: 'win' | 'loss' | 'draw' = 'draw'
          if (match.result === 'white' && isWhite) matchResult = 'win'
          else if (match.result === 'black' && isBlack) matchResult = 'win'
          else if ((match.result === 'white' && isBlack) || 
                   (match.result === 'black' && isWhite)) matchResult = 'loss'
          
          if (matchResult === firstResult && firstResult !== 'draw') {
            consecutiveCount++
          } else {
            break
          }
        }
        
        if (firstResult === 'win') {
          streak = consecutiveCount
        } else if (firstResult === 'loss') {
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

      // Use stored stats, or fallback to placeholder for demo users
      let finalWins = wins
      let finalLosses = losses
      let finalDraws = draws
      
      if (gamesPlayed === 0 && profile.userId.startsWith('u_demo')) {
        finalWins = Math.floor(Math.random() * 30)
        finalLosses = Math.floor(Math.random() * 20)
        finalDraws = Math.floor(Math.random() * 10)
      }
      
      const totalMatches = finalWins + finalLosses + finalDraws
      const winRate = totalMatches > 0 
        ? Math.round((finalWins / totalMatches) * 100) || 0
        : 0

      players.push({
        id: profile.userId,
        name: displayName,
        email: profile.email,
        picture: profile.picture,
        department,
        userType,
        yearLevel,
        rating: profile.eloRating ?? profile.elo ?? 1500, // Use eloRating first, fallback to elo, then default
        ratingChange: Math.floor(Math.random() * 40) - 20, // Mock data
        stats: { wins: finalWins, losses: finalLosses, draws: finalDraws },
        streak,
        lastActive: new Date(profile.updatedAt).toISOString(),
        totalMatches: profile.gamesPlayed ?? totalMatches,
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
