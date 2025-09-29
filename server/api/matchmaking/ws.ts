import { defineWebSocketHandler } from 'h3'
import { randomUUID } from 'node:crypto'

type Player = {
  id: string
  userId: string
  rating: number
  gameMode: string
  joinedAt: number
  ws: any
}

type ActiveMatch = {
  id: string
  player1: Player
  player2: Player
  gameMode: string
  createdAt: number
}

// In-memory storage for the demo (use Redis in production)
const playersInQueue = new Map<string, Player>()
const activePlayers = new Map<string, Player>()
const activeMatches = new Map<string, ActiveMatch>()

const RATING_RANGE = 200 // Match players within ±200 rating points
const MAX_QUEUE_TIME = 60000 // 60 seconds max queue time

export default defineWebSocketHandler({
  open(peer) {
    console.log('WebSocket connection opened:', peer.id)
  },

  close(peer) {
    console.log('WebSocket connection closed:', peer.id)
    
    // Remove player from queue and active players
    const player = activePlayers.get(peer.id)
    if (player) {
      playersInQueue.delete(player.userId)
      activePlayers.delete(peer.id)
      broadcastStats()
    }
  },

  error(peer, error) {
    console.error('WebSocket error:', error)
  },

  message(peer, message) {
    try {
      const data = JSON.parse(message.text())
      handleMessage(peer, data)
    } catch (error) {
      console.error('Invalid WebSocket message:', error)
      peer.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  }
})

function handleMessage(peer: any, data: any) {
  switch (data.type) {
    case 'auth':
      handleAuth(peer, data)
      break
      
    case 'join_queue':
      handleJoinQueue(peer, data)
      break
      
    case 'leave_queue':
      handleLeaveQueue(peer, data)
      break
      
    default:
      peer.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }))
  }
}

function handleAuth(peer: any, data: any) {
  if (!data.userId) {
    peer.send(JSON.stringify({
      type: 'error',
      message: 'User ID required'
    }))
    return
  }

  // Store player connection
  const player: Player = {
    id: peer.id,
    userId: data.userId,
    rating: 1200, // Default rating
    gameMode: '',
    joinedAt: 0,
    ws: peer
  }
  
  activePlayers.set(peer.id, player)
  
  peer.send(JSON.stringify({
    type: 'auth_success'
  }))
  
  broadcastStats()
}

function handleJoinQueue(peer: any, data: any) {
  const player = activePlayers.get(peer.id)
  if (!player) {
    peer.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required'
    }))
    return
  }

  // Update player with queue info
  player.rating = data.rating || 1200
  player.gameMode = data.gameMode || 'blitz'
  player.joinedAt = Date.now()
  
  playersInQueue.set(player.userId, player)
  
  peer.send(JSON.stringify({
    type: 'queue_joined'
  }))
  
  // Try to find a match immediately
  findMatch(player)
  broadcastStats()
}

function handleLeaveQueue(peer: any, data: any) {
  const player = activePlayers.get(peer.id)
  if (player) {
    playersInQueue.delete(player.userId)
    
    peer.send(JSON.stringify({
      type: 'queue_left'
    }))
    
    broadcastStats()
  }
}

function findMatch(newPlayer: Player) {
  // Look for suitable opponents
  for (const [userId, opponent] of playersInQueue.entries()) {
    if (userId === newPlayer.userId) continue
    if (opponent.gameMode !== newPlayer.gameMode) continue
    
    // Check rating compatibility
    const ratingDiff = Math.abs(newPlayer.rating - opponent.rating)
    const queueTime = Date.now() - Math.min(newPlayer.joinedAt, opponent.joinedAt)
    
    // Expand rating range over time
    const expandedRange = RATING_RANGE + (queueTime / 1000) * 10
    
    if (ratingDiff <= expandedRange) {
      createMatch(newPlayer, opponent)
      return
    }
  }
  
  // Set timeout to expand search after max queue time
  setTimeout(() => {
    if (playersInQueue.has(newPlayer.userId)) {
      // Force match with anyone in same game mode
      for (const [userId, opponent] of playersInQueue.entries()) {
        if (userId !== newPlayer.userId && opponent.gameMode === newPlayer.gameMode) {
          createMatch(newPlayer, opponent)
          return
        }
      }
    }
  }, MAX_QUEUE_TIME)
}

function createMatch(player1: Player, player2: Player) {
  const matchId = randomUUID()
  const match: ActiveMatch = {
    id: matchId,
    player1,
    player2,
    gameMode: player1.gameMode,
    createdAt: Date.now()
  }
  
  activeMatches.set(matchId, match)
  
  // Remove players from queue
  playersInQueue.delete(player1.userId)
  playersInQueue.delete(player2.userId)
  
  // Notify both players
  player1.ws.send(JSON.stringify({
    type: 'match_found',
    matchId,
    opponent: {
      id: player2.userId,
      rating: player2.rating
    },
    color: 'white' // Player 1 is white
  }))
  
  player2.ws.send(JSON.stringify({
    type: 'match_found',
    matchId,
    opponent: {
      id: player1.userId,
      rating: player1.rating
    },
    color: 'black' // Player 2 is black
  }))
  
  console.log(`Match created: ${matchId} between ${player1.userId} and ${player2.userId}`)
  broadcastStats()
}

function broadcastStats() {
  const stats = {
    type: 'stats_update',
    onlineCount: activePlayers.size,
    queueCount: playersInQueue.size,
    avgWaitTime: calculateAvgWaitTime()
  }
  
  // Broadcast to all connected players
  for (const player of activePlayers.values()) {
    try {
      player.ws.send(JSON.stringify(stats))
    } catch (error) {
      console.error('Failed to send stats to player:', error)
    }
  }
}

function calculateAvgWaitTime(): number {
  if (playersInQueue.size === 0) return 30
  
  const now = Date.now()
  const totalWaitTime = Array.from(playersInQueue.values())
    .reduce((sum, player) => sum + (now - player.joinedAt), 0)
  
  return Math.round(totalWaitTime / playersInQueue.size / 1000) // Convert to seconds
}