import { defineEventHandler, getRouterParam } from 'h3'
import { useStorage } from '#imports'

type GameState = {
  id: string
  fen: string
  lastMove: string | null
  lastMoveTime: number
  currentTurn: 'white' | 'black'
  player1: { id: string; name: string; color: 'white' | 'black' }
  player2: { id: string; name: string; color: 'white' | 'black' }
  status: 'waiting' | 'active' | 'finished'
  winner?: string
  gameMode: string
  createdAt: number
}

export default defineEventHandler(async (event) => {
  const gameId = getRouterParam(event, 'id')
  
  if (!gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Game ID is required'
    })
  }

  try {
    const storage = useStorage('chess-games')
    const gameState = await storage.getItem<GameState>(`game:${gameId}`)
    
    if (!gameState) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Game not found'
      })
    }

    return gameState
  } catch (error) {
    console.error('Failed to get game state:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve game state'
    })
  }
})