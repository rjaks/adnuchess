import { defineEventHandler, getRouterParam, createError } from 'h3'

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
  moveHistory: string[]
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
    const { $convex } = event.context
    const game = await $convex.query('games:getGameById', { gameId })
    
    if (!game) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Game not found'
      })
    }

    // Check if game has expired (30 minutes)
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000
    const gameAge = now - game.createdAt
    
    if (game.status === 'active' && gameAge > thirtyMinutes) {
      // Game has expired, mark it as finished
      await $convex.mutation('games:updateGameStatus', {
        gameId: game.gameId,
        status: 'finished',
        winner: 'expired'
      })
      
      // Return the updated game state
      const updatedGame = await $convex.query('games:getGameById', { gameId })
      if (updatedGame) {
        game.status = updatedGame.status
        game.winner = updatedGame.winner
      }
    }

    // Format the response to match our expected GameState type
    const gameState: GameState = {
      id: game.gameId,
      fen: game.fen,
      lastMove: game.lastMove || null,
      lastMoveTime: game.lastMoveTime,
      currentTurn: game.currentTurn,
      player1: game.player1,
      player2: game.player2,
      status: game.status,
      winner: game.winner,
      gameMode: game.gameMode,
      createdAt: game.createdAt,
      moveHistory: game.moveHistory
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