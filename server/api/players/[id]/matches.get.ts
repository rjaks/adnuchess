import { defineEventHandler, getRouterParam, createError } from 'h3'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '~/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.CONVEX_URL || '')

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  
  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  try {
    const matchHistory = await convex.query(api.games.getMatchHistory, { userId })
    return { matches: matchHistory }
  } catch (error: any) {
    console.error('Error fetching match history:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch match history'
    })
  }
})
