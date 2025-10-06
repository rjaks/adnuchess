import { defineEventHandler, getRouterParam, readBody, getCookie } from 'h3'
import { useStorage } from '#imports'
import { getUserSession } from '~/server/utils/sessionStore'
import { Chess } from 'chess.js'

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
  const { move, fen } = await readBody(event)
  
  // Authenticate user
  const sessionId = getCookie(event, 'adnu_session')
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  
  const session = await getUserSession(sessionId)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }

  if (!gameId || !move) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Game ID and move are required'
    })
  }

  try {
    const storage = useStorage('chess-games')
    
    // Get current game state
    const gameState = await storage.getItem<GameState>(`game:${gameId}`)
    
    if (!gameState) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Game not found'
      })
    }

    // Verify it's the player's turn
    const isPlayer1 = gameState.player1.id === session.user.id
    const isPlayer2 = gameState.player2.id === session.user.id
    
    if (!isPlayer1 && !isPlayer2) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not a player in this game'
      })
    }

    const playerColor = isPlayer1 ? gameState.player1.color : gameState.player2.color
    
    if (gameState.currentTurn !== playerColor) {
      throw createError({
        statusCode: 400,
        statusMessage: 'It is not your turn'
      })
    }

    // Validate move using chess.js
    const chess = new Chess(gameState.fen)
    const moveResult = chess.move(move)
    
    if (!moveResult) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid move'
      })
    }

    // Update game state
    const updatedGameState: GameState = {
      ...gameState,
      fen: chess.fen(),
      lastMove: move,
      lastMoveTime: Date.now(),
      currentTurn: gameState.currentTurn === 'white' ? 'black' : 'white',
      moveHistory: [...gameState.moveHistory, move]
    }

    // Check for game end
    if (chess.isGameOver()) {
      updatedGameState.status = 'finished'
      
      if (chess.isCheckmate()) {
        // Current player (who just moved) wins
        updatedGameState.winner = session.user.id
      } else {
        // Draw
        updatedGameState.winner = 'draw'
      }
    }

    // Save updated state
    await storage.setItem(`game:${gameId}`, updatedGameState)

    return {
      success: true,
      gameState: updatedGameState
    }
  } catch (error) {
    console.error('Failed to make move:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process move'
    })
  }
})