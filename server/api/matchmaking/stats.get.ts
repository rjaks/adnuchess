import { defineEventHandler, getCookie } from 'h3'
import { getUserSession } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'adnu_session')
  if (!sessionId) {
    return {
      onlineCount: Math.floor(Math.random() * 50) + 10,
      queueCount: Math.floor(Math.random() * 10) + 1,
      avgWaitTime: Math.floor(Math.random() * 60) + 15,
      recentMatches: []
    }
  }

  const session = await getUserSession(sessionId)
  if (!session) {
    return {
      onlineCount: Math.floor(Math.random() * 50) + 10,
      queueCount: Math.floor(Math.random() * 10) + 1,
      avgWaitTime: Math.floor(Math.random() * 60) + 15,
      recentMatches: []
    }
  }

  // Mock data for now - in production, this would come from your database
  const mockRecentMatches = [
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
  ]

  return {
    onlineCount: Math.floor(Math.random() * 50) + 10,
    queueCount: Math.floor(Math.random() * 10) + 1,
    avgWaitTime: Math.floor(Math.random() * 60) + 15,
    recentMatches: mockRecentMatches
  }
})