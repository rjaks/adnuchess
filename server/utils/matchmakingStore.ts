import { useStorage } from '#imports'
import { randomUUID } from 'node:crypto'

export type QueuePlayer = {
  userId: string
  userName: string
  rating: number
  gameMode: string
  joinedAt: number
}

export type MatchmakingMatch = {
  id: string
  player1: QueuePlayer
  player2: QueuePlayer
  gameMode: string
  createdAt: number
  status: 'pending' | 'active' | 'completed'
}

const storage = () => useStorage('matchmaking')

const RATING_RANGE = 200 // Match players within ±200 rating points
const MAX_QUEUE_TIME = 60000 // 60 seconds max queue time

export const joinMatchmakingQueue = async (player: Omit<QueuePlayer, 'joinedAt'>) => {
  const queuePlayer: QueuePlayer = {
    ...player,
    joinedAt: Date.now()
  }
  
  await storage().setItem(`queue:${player.userId}`, queuePlayer)
  
  // Try to find a match immediately
  await findMatch(queuePlayer)
}

export const leaveMatchmakingQueue = async (userId: string) => {
  await storage().removeItem(`queue:${userId}`)
  await storage().removeItem(`match:${userId}`)
}

export const checkMatchmakingStatus = async (userId: string) => {
  // First check if player has a match
  const match = await storage().getItem<MatchmakingMatch>(`match:${userId}`)
  if (match) {
    return {
      status: 'matched',
      matchId: match.id
    }
  }
  
  // Check if player is still in queue
  const queueEntry = await storage().getItem<QueuePlayer>(`queue:${userId}`)
  if (queueEntry) {
    return { status: 'waiting' }
  }
  
  return { status: 'error', message: 'Not in queue' }
}

const findMatch = async (newPlayer: QueuePlayer) => {
  // Get all players in queue
  const queueKeys = await storage().getKeys('queue:')
  
  for (const key of queueKeys) {
    if (key === `queue:${newPlayer.userId}`) continue
    
    const opponent = await storage().getItem<QueuePlayer>(key)
    if (!opponent || opponent.gameMode !== newPlayer.gameMode) continue
    
    // Check rating compatibility
    const ratingDiff = Math.abs(newPlayer.rating - opponent.rating)
    const queueTime = Date.now() - Math.min(newPlayer.joinedAt, opponent.joinedAt)
    
    // Expand rating range over time
    const expandedRange = RATING_RANGE + (queueTime / 1000) * 10
    
    if (ratingDiff <= expandedRange || queueTime > MAX_QUEUE_TIME) {
      await createMatch(newPlayer, opponent)
      return
    }
  }
}

const createMatch = async (player1: QueuePlayer, player2: QueuePlayer) => {
  const matchId = randomUUID()
  const match: MatchmakingMatch = {
    id: matchId,
    player1,
    player2,
    gameMode: player1.gameMode,
    createdAt: Date.now(),
    status: 'pending'
  }
  
  // Store match for both players
  await storage().setItem(`match:${player1.userId}`, match)
  await storage().setItem(`match:${player2.userId}`, match)
  await storage().setItem(`game:${matchId}`, match)
  
  // Remove players from queue
  await storage().removeItem(`queue:${player1.userId}`)
  await storage().removeItem(`queue:${player2.userId}`)
  
  console.log(`Match created: ${matchId} between ${player1.userName} and ${player2.userName}`)
}

export const getMatchDetails = async (matchId: string) => {
  return await storage().getItem<MatchmakingMatch>(`game:${matchId}`)
}

export const getQueueStats = async () => {
  const queueKeys = await storage().getKeys('queue:')
  const players: QueuePlayer[] = []
  
  for (const key of queueKeys) {
    const player = await storage().getItem<QueuePlayer>(key)
    if (player) players.push(player)
  }
  
  const now = Date.now()
  const avgWaitTime = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + (now - p.joinedAt), 0) / players.length / 1000)
    : 30
  
  return {
    onlineCount: Math.floor(Math.random() * 50) + players.length + 10,
    queueCount: players.length,
    avgWaitTime
  }
}