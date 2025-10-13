import { defineEventHandler, getCookie } from 'h3'
import { getUserSession } from '~/server/utils/sessionStore'
import { log } from '~/server/utils/logger'
import { rateLimitHelpers } from '~/server/utils/rateLimit'
import { handleError, errors } from '~/server/utils/errorHandler'
import { validateRequest, commonValidations, z } from '~/server/utils/requestValidation'

// Enhanced move validation schema
const moveSchema = z.object({
  move: z.string().regex(
    /^[a-h][1-8][a-h][1-8][qrbn]?$/,
    'Invalid chess move format (expected: e2e4, e7e5, etc.)'
  ),
  fen: z.string().regex(
    /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[bw]\s(-|[KQkq]+)\s(-|[a-h][3-6])\s\d+\s\d+$/,
    'Invalid FEN string'
  ).optional(), // FEN might be optional depending on implementation
  timestamp: z.number().optional()
})

const paramsSchema = z.object({
  id: z.string().min(1, 'Game ID is required').max(100, 'Game ID too long')
})

export default defineEventHandler(async (event) => {
  try {
    // Authentication
    const sessionId = getCookie(event, 'adnu_session')
    if (!sessionId) {
      throw errors.unauthorized()
    }

    const session = await getUserSession(sessionId)
    if (!session) {
      throw errors.sessionExpired()
    }

    // Validate request
    const { body, params } = await validateRequest(event, {
      body: moveSchema,
      params: paramsSchema,
      logValidation: process.env.NODE_ENV === 'development'
    })

    const { move, fen, timestamp } = body
    const { id: gameId } = params

    // Rate limiting - specific to game moves
    await rateLimitHelpers.gameMove(event, gameId, session.user.id)

    log.gameAction('move_attempt', gameId, session.user.id, {
      move,
      hasFen: !!fen,
      timestamp: timestamp || Date.now()
    })

    // Validate game exists and player is authorized
    const { $convex } = event.context
    if (!$convex) {
      throw errors.serviceUnavailable('Convex')
    }

    let game
    try {
      // Get current game state
      game = await $convex.query('games:getGame', { gameId })
      
      if (!game) {
        throw errors.gameNotFound(gameId)
      }

      // Check if game is active
      if (game.status !== 'active') {
        if (game.status === 'finished') {
          throw errors.gameFinished(gameId)
        }
        throw errors.conflict(`Game is not active (status: ${game.status})`)
      }

      // Check if player is in the game
      const isPlayer1 = game.player1?.id === session.user.id
      const isPlayer2 = game.player2?.id === session.user.id
      
      if (!isPlayer1 && !isPlayer2) {
        throw errors.forbidden('You are not a player in this game')
      }

      // Check if it's the player's turn
      const playerColor = isPlayer1 ? game.player1.color : game.player2.color
      if (game.currentTurn !== playerColor) {
        throw errors.notPlayerTurn(gameId, session.user.id)
      }

      // Check for move timeout (optional - for time controls)
      const moveTimeLimit = 30 * 60 * 1000 // 30 minutes max per move
      const timeSinceLastMove = Date.now() - game.lastMoveTime
      
      if (timeSinceLastMove > moveTimeLimit) {
        log.gameAction('move_timeout', gameId, session.user.id, {
          timeSinceLastMove,
          moveTimeLimit
        })
        // Could auto-forfeit here, but let's just log for now
      }

    } catch (convexError) {
      if (convexError instanceof Error && convexError.message.includes('not found')) {
        throw errors.gameNotFound(gameId)
      }
      throw errors.convexError(convexError as Error, 'get_game')
    }

    // Process the move
    try {
      const moveResult = await $convex.mutation('games:makeMove', {
        gameId,
        playerId: session.user.id,
        move,
        fen: fen || game.fen, // Use provided FEN or current game FEN
        timestamp: timestamp || Date.now()
      })

      log.gameAction('move_success', gameId, session.user.id, {
        move,
        newFen: moveResult.fen,
        gameStatus: moveResult.status,
        isCheckmate: moveResult.isCheckmate,
        isCheck: moveResult.isCheck,
        isDraw: moveResult.isDraw
      })

      // Log game end if applicable
      if (moveResult.status === 'finished') {
        log.gameAction('game_finished', gameId, session.user.id, {
          winner: moveResult.winner,
          endReason: moveResult.endReason,
          finalFen: moveResult.fen,
          totalMoves: moveResult.moveHistory?.length || 0
        })
      }

      return {
        success: true,
        gameState: {
          fen: moveResult.fen,
          currentTurn: moveResult.currentTurn,
          status: moveResult.status,
          lastMove: move,
          lastMoveTime: moveResult.lastMoveTime,
          moveHistory: moveResult.moveHistory,
          isCheck: moveResult.isCheck,
          isCheckmate: moveResult.isCheckmate,
          isDraw: moveResult.isDraw,
          winner: moveResult.winner,
          endReason: moveResult.endReason
        }
      }

    } catch (moveError) {
      // Handle specific move errors
      if (moveError instanceof Error) {
        if (moveError.message.includes('invalid move') || moveError.message.includes('illegal')) {
          log.gameAction('invalid_move', gameId, session.user.id, {
            move,
            error: moveError.message
          })
          throw errors.invalidMove(move, gameId)
        }
        
        if (moveError.message.includes('not your turn')) {
          throw errors.notPlayerTurn(gameId, session.user.id)
        }
      }

      log.error('Move processing failed', moveError, {
        gameId,
        playerId: session.user.id,
        move,
        operation: 'make_move'
      })

      throw errors.convexError(moveError as Error, 'make_move')
    }

  } catch (error) {
    handleError(error, event, {
      operation: 'game_move',
      gameId: (event.context.params as any)?.id,
      userId: getCookie(event, 'adnu_session')
    })
  }
})
