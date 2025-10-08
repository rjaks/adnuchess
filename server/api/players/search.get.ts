import { defineEventHandler, getQuery, createError } from 'h3'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '~/convex/_generated/api'

// Create a Convex client to interact with the API
const convex = new ConvexHttpClient(process.env.CONVEX_URL || '')

type SearchResult = {
  id: string
  name: string
  email: string
  picture?: string
  rating: number
  department?: string
  userType?: 'student' | 'staff' | 'faculty' | 'alumni'
  yearLevel?: string
  stats: {
    wins: number
    losses: number
    draws: number
  }
  totalMatches: number
  winRate: number
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchTerm = (query.q as string)?.trim()
  const limit = parseInt(query.limit as string) || 10

  if (!searchTerm) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search term is required'
    })
  }

  if (searchTerm.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search term must be at least 2 characters long'
    })
  }

  try {
    // Get all profiles from Convex
    const profiles = await convex.query(api.profiles.getAllProfiles)

    // Filter profiles based on search term
    const searchResults: SearchResult[] = []
    const searchLower = searchTerm.toLowerCase()

    for (const profile of profiles) {
      const displayName = profile.displayName || profile.name
      const nameMatch = displayName.toLowerCase().includes(searchLower)
      const emailMatch = profile.email.toLowerCase().includes(searchLower)

      if (nameMatch || emailMatch) {
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
        const wins = Math.floor(Math.random() * 30)
        const losses = Math.floor(Math.random() * 20)
        const draws = Math.floor(Math.random() * 10)
        const totalMatches = wins + losses + draws
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

        searchResults.push({
          id: profile.userId,
          name: displayName,
          email: profile.email,
          picture: profile.picture,
          rating: profile.elo,
          department,
          userType,
          yearLevel,
          stats: { wins, losses, draws },
          totalMatches,
          winRate
        })
      }
    }

    // Sort by rating (descending) and limit results
    const sortedResults = searchResults
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)

    return {
      results: sortedResults,
      totalResults: searchResults.length,
      searchTerm
    }
  } catch (error) {
    console.error('Failed to search players:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search players'
    })
  }
})