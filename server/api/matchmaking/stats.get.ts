import { defineEventHandler, getCookie } from 'h3'
import { useStorage } from '#imports'
import { getUserSession } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'adnu_session')
  
  try {
    const storage = useStorage('matchmaking')
    const queueKeys = await storage.getKeys('queue:')
    
    // Calculate queue stats
    const queueCount = queueKeys.length
    const onlineCount = Math.floor(Math.random() * 50) + queueCount + 10
    const avgWaitTime = Math.floor(Math.random() * 60) + 20

    // Mock recent matches
    const mockRecentMatches = sessionId ? [
      {
        id: '1',
        opponent: 'Maria Santos',
        result: 'win' as const,
        timeAgo: '2 hours ago'
      },
      {
        id: '2',
        opponent: 'Juan Cruz',
        result: 'loss' as const,
        timeAgo: '1 day ago'
      },
      {
        id: '3',
        opponent: 'Ana Rodriguez',
        result: 'draw' as const,
        timeAgo: '2 days ago'
      }
    ] : []

    return {
      onlineCount,
      queueCount,
      avgWaitTime,
      recentMatches: mockRecentMatches
    }
  } catch (error) {
    console.error('Failed to get queue stats:', error)
    return {
      onlineCount: 25,
      queueCount: 3,
      avgWaitTime: 45,
      recentMatches: []
    }
  }
})