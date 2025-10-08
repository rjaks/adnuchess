import { defineEventHandler, getRouterParam, readBody, getCookie, createError } from 'h3'
import { getUserSession } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  const gameId = getRouterParam(event, 'id')
  const { move } = await readBody(event)
  
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
  }  try {
    const { $convex } = event.context
    
    // Log the move details for debugging
    console.log(`[Server] Processing move: Game ID=${gameId}, Player ID=${session.user.id}, Move=${move}`)
    
    // Make move through Convex with fallbacks
    try {
      console.log(`[Server] Attempting to make move in Convex - Game ID: ${gameId}, Player ID: ${session.user.id}, Move: ${move}`);
      
      let result;
      
      try {
        // Try with new chess_games module first
        result = await $convex.mutation('chess_games:makeMove', {
          gameId,
          move,
          playerId: session.user.id
        });
        console.log('[Server] Successfully made move with chess_games module');
      } 
      catch (chessGamesError) {
        console.warn(`[Server] chess_games path failed, trying fallback:`, chessGamesError);
        
        try {
          // Try the old games module as fallback
          result = await $convex.mutation('games:makeMove', {
            gameId,
            move,
            playerId: session.user.id
          });
          console.log('[Server] Successfully made move with games fallback');
        } 
        catch (gamesError) {
          console.error(`[Server] Both approaches failed:`, gamesError);
          throw gamesError;
        }
      }
      
      console.log(`[Server] Move processed successfully:`, result);
      
      // Get updated game state with retry
      let updatedGame;
      let retryCount = 0;
      
      while (!updatedGame && retryCount < 3) {
        try {
          try {
            // Try the new chess_games module first
            updatedGame = await $convex.query('chess_games:getGameById', { gameId });
            console.log('[Server] Successfully queried game state with chess_games module');
          } 
          catch (chessGamesQueryError) {
            console.warn(`[Server] Failed to query chess_games, trying games fallback:`, chessGamesQueryError);
            updatedGame = await $convex.query('games:getGameById', { gameId });
            console.log('[Server] Successfully queried game state with games fallback');
          }
          
          // Verify that the game state reflects our move
          // by checking that the lastMoveTime is recent
          const moveTimeThreshold = Date.now() - 10000; // 10 seconds ago
          if (updatedGame && (!updatedGame.lastMoveTime || updatedGame.lastMoveTime < moveTimeThreshold)) {
            console.warn(`[Server] Game state may be stale, retrying... (lastMoveTime: ${updatedGame.lastMoveTime})`);
            updatedGame = null; // Force retry
          }
        } catch (queryError) {
          console.error(`[Server] Failed to get updated game state (attempt ${retryCount + 1}/3):`, queryError);
        }
        
        if (!updatedGame && retryCount < 3) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500));
          retryCount++;
        }
      }
      
      if (!updatedGame) {
        throw new Error('Failed to retrieve updated game state after multiple attempts');
      }
      
      return {
        success: true,
        gameState: {
          id: updatedGame.gameId,
          fen: updatedGame.fen,
          lastMove: updatedGame.lastMove,
          lastMoveTime: updatedGame.lastMoveTime,
          currentTurn: updatedGame.currentTurn,
          player1: updatedGame.player1,
          player2: updatedGame.player2,
          status: updatedGame.status,
          winner: updatedGame.winner,
          gameMode: updatedGame.gameMode || 'standard',
          createdAt: updatedGame.createdAt,
          moveHistory: updatedGame.moveHistory || []
        }
      }
    } catch (convexError: any) {
      console.error('[Server] Convex error making move:', convexError)
      throw createError({
        statusCode: 400,
        statusMessage: convexError.message || 'Failed to process move in Convex'
      })
    }
  } catch (error: any) {
    console.error('[Server] Failed to make move:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to process move'
    })
  }
})
