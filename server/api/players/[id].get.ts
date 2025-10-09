import { defineEventHandler, getRouterParam, createError } from 'h3'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '~/convex/_generated/api'

// Create a Convex client to interact with the API
const convex = new ConvexHttpClient(process.env.CONVEX_URL || '')

type PlayerProfile = {
  id: string
  name: string
  email: string
  picture?: string
  rating: number
  department?: string
  userType?: 'student' | 'staff' | 'faculty' | 'alumni'
  yearLevel?: string
  displayName?: string
  stats: {
    wins: number
    losses: number
    draws: number
  }
  totalMatches: number
  winRate: number
}

export default defineEventHandler(async (event) => {
  const playerId = getRouterParam(event, 'id')

  if (!playerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Player ID is required'
    })
  }

  try {
    // Get the specific profile from Convex
    const profile = await convex.query(api.profiles.getByUserId, {
      userId: playerId
    })

    if (!profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Player not found'
      })
    }

    // Get department from email pattern or use placeholder
    const departments = [
      'College of Humanities and Social Sciences',
      'College of Business and Accountancy',
      'College of Computer Studies',
      'College of Education',
      'College of Science, Engineering, and Architecture',
      'College of Nursing',
      'College of Law'
    ]
    
    const emailDomain = profile.email.split('@')[1] || ''
    let department = departments[0]
    
    if (emailDomain.includes('ccs')) {
      department = departments[2] // Computer Studies
    } else if (emailDomain.includes('cba')) {
      department = departments[1] // Business
    } else {
      // Assign a random department for demo purposes
      department = departments[Math.floor(Math.random() * departments.length)]
    }

    // Use role from profile or default to student
    let userType: 'student' | 'staff' | 'faculty' | 'alumni' = 'student'
    let yearLevel: string | undefined = undefined
    
    if (profile.role) {
      userType = profile.role as any
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

    // Mock stats for now (in a real app, you'd calculate from matches)
    // Use consistent random seed based on userId for reproducible results
    const seed = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const random = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    
    const wins = Math.floor(random(seed) * 30)
    const losses = Math.floor(random(seed + 1) * 20)
    const draws = Math.floor(random(seed + 2) * 10)
    const totalMatches = wins + losses + draws
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

    const playerProfile: PlayerProfile = {
      id: profile.userId,
      name: profile.displayName || profile.name,
      email: profile.email,
      picture: profile.picture,
      rating: profile.elo,
      department,
      userType,
      yearLevel,
      displayName: profile.displayName,
      stats: { wins, losses, draws },
      totalMatches,
      winRate
    }

    return playerProfile
  } catch (error: any) {
    console.error('Failed to fetch player profile:', error)
    
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch player profile'
    })
  }
})