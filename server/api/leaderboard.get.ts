import { defineEventHandler, getQuery } from 'h3'
import { getUserById } from '~/server/utils/userStore'
import { listMatches } from '~/server/utils/chessStore'

type LeaderboardPlayer = {
  id: string
  name: string
  email: string
  picture?: string
  department: string
  userType: 'student' | 'staff' | 'faculty'
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
    // Get all matches to calculate ratings and streaks
    const matches = await listMatches()
    
    // Get unique player IDs from matches
    const playerIds = new Set<string>()
    matches.forEach(match => {
      if (match.meta?.playerId) {
        playerIds.add(match.meta.playerId as string)
      }
    })

    // Fetch player data and calculate stats
    const players: LeaderboardPlayer[] = []
    
    for (const playerId of playerIds) {
      const user = await getUserById(playerId)
      if (!user) continue

      // Calculate rating (simple ELO-like system)
      const playerMatches = matches.filter(m => m.meta?.playerId === playerId)
      const baseRating = 1200
      let rating = baseRating
      
      // Simple rating calculation: +20 for win, -15 for loss, +5 for draw
      playerMatches.forEach(match => {
        switch (match.result) {
          case 'white':
            rating += 20
            break
          case 'black':
            rating -= 15
            break
          case 'draw':
            rating += 5
            break
        }
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

      // Calculate rating change (mock - in real app, track previous rating)
      const ratingChange = Math.floor(Math.random() * 40) - 20

      // Extract department from email domain or use default
      const emailParts = user.email.split('@')
      const departments = [
        'College of Humanities and Social Sciences',
        'College of Business and Accountancy',
        'College of Computer Studies',
        'College of Education',
        'College of Science, Engineering, and Architecture',
        'College of Nursing',
        'College of Law'
      ]
      const department = departments[Math.floor(Math.random() * departments.length)]

      // Determine user type based on email patterns or random for demo
      let userType: 'student' | 'staff' | 'faculty' = 'student'
      let yearLevel: string | undefined = undefined
      
      if (user.name.toLowerCase().includes('prof') || user.name.toLowerCase().includes('dr.')) {
        userType = 'faculty'
      } else if (user.name.toLowerCase().includes('ms.') || user.name.toLowerCase().includes('mr.')) {
        userType = 'staff'
      } else {
        userType = 'student'
        const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year']
        yearLevel = yearLevels[Math.floor(Math.random() * yearLevels.length)]
      }

      const totalMatches = user.stats.wins + user.stats.losses + user.stats.draws
      const winRate = totalMatches > 0 
        ? Math.round((user.stats.wins / (user.stats.wins + user.stats.losses)) * 100) || 0
        : 0

      players.push({
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        department,
        userType,
        yearLevel,
        rating: Math.max(800, Math.min(2400, rating)), // Clamp rating between 800-2400
        ratingChange,
        stats: user.stats,
        streak,
        lastActive: playerMatches.length > 0 
          ? playerMatches[0].completedAt 
          : user.updatedAt,
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