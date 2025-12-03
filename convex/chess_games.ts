import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Chess } from "chess.js";
import { 
  initializeTimers, 
  parseTimeControl, 
  updateTimersOnMove,
  checkForTimeout,
  type TimeControl 
} from "./utils/timerHelpers";

export const getGameById = query({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    return await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();
  },
});

export const getGamesByPlayerId = query({
  args: { playerId: v.string() },
  handler: async (ctx, { playerId }) => {
    const player1Games = await ctx.db
      .query("games")
      .withIndex("by_player", (q) => q.eq("player1.id", playerId))
      .collect();

    const player2Games = await ctx.db
      .query("games")
      .withIndex("by_player2", (q) => q.eq("player2.id", playerId))
      .collect();

    return [...player1Games, ...player2Games];
  },
});

export const createGame = mutation({
  args: {
    gameId: v.string(),
    player1: v.object({
      id: v.string(),
      name: v.string(),
      color: v.union(v.literal("white"), v.literal("black"))
    }),
    player2: v.object({
      id: v.string(),
      name: v.string(),
      color: v.union(v.literal("white"), v.literal("black"))
    }),
    gameMode: v.string(),
    timeControlString: v.optional(v.string()), // e.g., "5+0", "10+5", "15+10"
  },
  handler: async (ctx, { gameId, player1, player2, gameMode, timeControlString }) => {
    console.log(`Creating game ${gameId} with players ${player1.id} and ${player2.id}`);
    
    const now = Date.now();
    
    // Check if a game with this ID already exists
    const existingGame = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();
    
    if (existingGame) {
      console.log(`Game with ID ${gameId} already exists`);
      return existingGame._id; // Return existing game ID
    }
    
    // Always ensure player1 is white and player2 is black to avoid confusion
    const fixedPlayer1 = {
      id: player1.id,
      name: player1.name,
      color: "white" as const
    };
    
    const fixedPlayer2 = {
      id: player2.id,
      name: player2.name,
      color: "black" as const
    };
    
    console.log(`Player 1 (${fixedPlayer1.name}): white, Player 2 (${fixedPlayer2.name}): black`);
    
    // Initialize a new chess game
    const chess = new Chess();
    const initialFen = chess.fen();
    console.log(`Initial FEN: ${initialFen}`);
    
    // Parse time control if provided
    let timeControl: TimeControl | null = null;
    let timerState = null;
    
    if (timeControlString) {
      try {
        timeControl = parseTimeControl(timeControlString);
        timerState = initializeTimers(timeControl, now);
        console.log(`Time control initialized: ${timeControlString} -> Base: ${timeControl.baseTimeMs}ms, Increment: ${timeControl.incrementMs}ms`);
      } catch (error) {
        console.error(`Failed to parse time control: ${timeControlString}`, error);
        // Continue without time control rather than failing
      }
    }
    
    const gameDoc: any = {
      gameId,
      fen: initialFen,
      lastMove: "",  // Use empty string instead of null for consistency
      lastMoveTime: now,
      currentTurn: "white" as const, // White always starts
      player1: fixedPlayer1,
      player2: fixedPlayer2,
      status: "active" as const,
      gameMode,
      createdAt: now,
      moveHistory: []
    };
    
    // Add timer fields if time control is enabled
    if (timeControl && timerState) {
      gameDoc.timeControl = timeControl;
      gameDoc.whiteTimeMs = timerState.whiteTimeMs;
      gameDoc.blackTimeMs = timerState.blackTimeMs;
      gameDoc.lastMoveTimestamp = timerState.lastMoveTimestamp;
      gameDoc.gameStartTimestamp = timerState.gameStartTimestamp;
    }
    
    console.log(`Creating new game with current turn: ${gameDoc.currentTurn}`);
    
    return await ctx.db.insert("games", gameDoc);
  },
});

export const makeMove = mutation({
  args: {
    gameId: v.string(),
    move: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, { gameId, move, playerId }) => {
    console.log(`[Convex] Making move: ${move} by player ${playerId} in game ${gameId}`);
    
    // Validate inputs
    if (!move || !move.trim()) {
      console.error(`[Convex] Invalid move provided: ${move}`);
      throw new Error('Invalid move format');
    }
      
    // Find the game
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();
    
    if (!game) {
      console.error(`[Convex] Game not found: ${gameId}`);
      throw new Error(`Game not found: ${gameId}`);
    }
    
    console.log(`[Convex] Game found: ${gameId}`);
    console.log(`[Convex] Player1: ${game.player1.id}, Player2: ${game.player2.id}, Current player: ${playerId}`);
    
    // Check if it's the player's turn
    const isPlayer1 = game.player1.id === playerId;
    const isPlayer2 = game.player2.id === playerId;
    
    if (!isPlayer1 && !isPlayer2) {
      console.error(`[Convex] Player ${playerId} is not a player in game ${gameId}`);
      throw new Error(`You are not a player in this game. Players are: ${game.player1.id} and ${game.player2.id}`);
    }
    
    const playerColor = isPlayer1 ? game.player1.color : game.player2.color;
    
    console.log(`Player color: ${playerColor}, Current turn: ${game.currentTurn}`);
      if (game.currentTurn !== playerColor) {
      throw new Error(`It is not your turn. Current turn is ${game.currentTurn}, your color is ${playerColor}`);
    }
      // Check for timeout BEFORE validating move (if time control is enabled)
    const now = Date.now();
    
    if (game.timeControl && game.timeControl.type !== 'none') {
      const timerState = {
        whiteTimeMs: game.whiteTimeMs || game.timeControl.baseTimeMs,
        blackTimeMs: game.blackTimeMs || game.timeControl.baseTimeMs,
        lastMoveTimestamp: game.lastMoveTimestamp || 0,
        gameStartTimestamp: game.gameStartTimestamp || 0
      };
      
      const timerUpdate = updateTimersOnMove(
        timerState,
        game.timeControl,
        playerColor,
        now
      );      if (timerUpdate.timedOut && timerUpdate.timeoutWinner) {
        console.log(`[Convex] Player ${playerColor} timed out! Winner: ${timerUpdate.timeoutWinner}`);
        
        // Player ran out of time before making move
        await ctx.db.patch(game._id, {
          status: "finished" as const,
          winner: timerUpdate.timeoutWinner === 'white' ? game.player1.id : game.player2.id,
          endReason: `timeout_${playerColor}`,
          result: "timeout" as const,
          timeoutWinner: timerUpdate.timeoutWinner,
          whiteTimeMs: timerUpdate.whiteTimeMs,
          blackTimeMs: timerUpdate.blackTimeMs,
          lastMoveTimestamp: now
        });
        
        throw new Error(`Time expired! ${timerUpdate.timeoutWinner} wins by timeout`);
      }
    }
    
    // Validate and apply move
    const chess = new Chess(game.fen);
    
    // Debug info before making move
    console.log(`Current FEN: ${game.fen}`);
    console.log(`Current turn in chess.js: ${chess.turn() === 'w' ? 'white' : 'black'}`);
    
    const moveResult = chess.move(move);
    
    if (!moveResult) {
      throw new Error(`Invalid move: ${move}`);
    }
      // Debug info after making move
    console.log(`New FEN after move: ${chess.fen()}`);
    console.log(`New turn in chess.js: ${chess.turn() === 'w' ? 'white' : 'black'}`);
    
    // Determine next turn
    const nextTurn: 'white' | 'black' = game.currentTurn === "white" ? "black" : "white";
    console.log(`Switching turn from ${game.currentTurn} to ${nextTurn}`);
      // Build update object
    const patch: any = {
      fen: chess.fen(),
      lastMove: move,
      lastMoveTime: now,
      currentTurn: nextTurn,
      moveHistory: [...game.moveHistory, move]
    };
    
    // Log game time control state
    console.log(`[Convex] Game time control check:`, {
      hasTimeControl: !!game.timeControl,
      timeControlType: game.timeControl?.type,
      whiteTimeMs: game.whiteTimeMs,
      blackTimeMs: game.blackTimeMs,
      lastMoveTimestamp: game.lastMoveTimestamp
    });
      // Update timer fields if time control is enabled
    if (game.timeControl && game.timeControl.type !== 'none') {
      const timerState = {
        whiteTimeMs: game.whiteTimeMs || game.timeControl.baseTimeMs,
        blackTimeMs: game.blackTimeMs || game.timeControl.baseTimeMs,
        lastMoveTimestamp: game.lastMoveTimestamp || 0,
        gameStartTimestamp: game.gameStartTimestamp || 0
      };
      
      const timerUpdate = updateTimersOnMove(
        timerState,
        game.timeControl,
        playerColor,
        now
      );
        // This should not happen as we already checked, but be defensive
      if (timerUpdate.timedOut) {
        console.error('[Convex] Unexpected timeout after move validation');
      }
      
      // Update timer fields in patch
      patch.whiteTimeMs = timerUpdate.whiteTimeMs;
      patch.blackTimeMs = timerUpdate.blackTimeMs;
      patch.lastMoveTimestamp = timerUpdate.lastMoveTimestamp;
      
      // Set gameStartTimestamp on White's first move (when it was 0)
      if (timerState.gameStartTimestamp === 0 && playerColor === 'white') {
        patch.gameStartTimestamp = now;
        console.log(`[Convex] Starting game clock on White's first move at ${now}`);
      }
      
      console.log(`[Convex] Timer update after move:`, {
        whiteTimeMs: patch.whiteTimeMs,
        blackTimeMs: patch.blackTimeMs,
        lastMoveTimestamp: patch.lastMoveTimestamp,
        gameStartTimestamp: patch.gameStartTimestamp,
        movingPlayer: playerColor
      });
    }
    
    // Check if there are any legal moves for the opponent
    // IMPORTANT: Avoiding any reference to game_over() which causes issues
    const legalMoves = chess.moves();
    console.log(`[Convex] Legal moves after this move: ${legalMoves.length}`);
      if (legalMoves.length === 0) {
      console.log("[Convex] No legal moves available, game is over");
      // @ts-ignore
      patch.status = "finished";
      
      // Check if the king is in check to determine checkmate vs stalemate
      // A simpler approach that avoids compatibility issues
      let inCheck = false;
      
      try {
        // Manually checking for check state to avoid compatibility issues
        const kingSquare = findKingSquare(chess);
        if (kingSquare) {
          inCheck = isSquareAttacked(chess, kingSquare, chess.turn() === 'w' ? 'b' : 'w');
        }
      } catch (error) {
        console.error("[Convex] Error checking if king is in check:", error);
      }
      
      if (inCheck) {
        // Checkmate - current player wins
        // @ts-ignore
        patch.winner = playerId;
        // @ts-ignore
        patch.result = "checkmate";
        // @ts-ignore
        patch.endReason = "checkmate";
        console.log(`[Convex] Player ${playerId} wins by checkmate`);
      } else {
        // Stalemate - draw
        // @ts-ignore
        patch.winner = "draw";
        // @ts-ignore
        patch.result = "stalemate";
        // @ts-ignore
        patch.endReason = "stalemate";
        console.log("[Convex] Game ended in stalemate (draw)");
      }
    }
    
    // Update the game in database
    console.log(`[Convex] About to patch game with:`, patch);
    await ctx.db.patch(game._id, patch);
    
    console.log("Game updated successfully");
    
    return {
      success: true,
      gameId,
      nextTurn
    };
  },
});

export const checkTimeout = mutation({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();
    
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
      // Only check timeout for active games with time control
    if (game.status !== 'active' || !game.timeControl || game.timeControl.type === 'none') {
      return { timedOut: false };
    }
    
    const timerState = {
      whiteTimeMs: game.whiteTimeMs || game.timeControl.baseTimeMs,
      blackTimeMs: game.blackTimeMs || game.timeControl.baseTimeMs,
      lastMoveTimestamp: game.lastMoveTimestamp || 0,
      gameStartTimestamp: game.gameStartTimestamp || 0
    };
    
    const timeoutWinner = checkForTimeout(timerState, game.currentTurn, Date.now());
      if (timeoutWinner) {
      console.log(`[Convex Heartbeat] Timeout detected! Winner: ${timeoutWinner}`);
      
      // Update game to finished state
      await ctx.db.patch(game._id, {
        status: "finished" as const,
        winner: timeoutWinner === 'white' ? game.player1.id : game.player2.id,
        endReason: `timeout_${game.currentTurn}`,
        result: "timeout" as const,
        timeoutWinner: timeoutWinner,
        whiteTimeMs: game.currentTurn === 'white' ? 0 : (game.whiteTimeMs || game.timeControl.baseTimeMs),
        blackTimeMs: game.currentTurn === 'black' ? 0 : (game.blackTimeMs || game.timeControl.baseTimeMs),
        lastMoveTimestamp: Date.now()
      });
      
      return { timedOut: true, winner: timeoutWinner };
    }
    
    return { timedOut: false };
  },
});

// Helper function to find the king's square
function findKingSquare(chess: Chess) {
  const board = chess.board();
  const color = chess.turn();
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'k' && piece.color === color) {
        // Convert row/col to square notation (e.g. "e4")
        const file = String.fromCharCode('a'.charCodeAt(0) + col);
        const rank = 8 - row;
        return `${file}${rank}`;
      }
    }
  }
  
  return null;
}

// Helper function to check if a square is under attack
function isSquareAttacked(chess: Chess, square: string, byColor: 'w' | 'b') {
  try {
    // First approach - try to use built-in method if available
    // @ts-ignore - different versions of chess.js have different method names
    if (typeof chess.isAttacked === 'function') {
      // @ts-ignore
      return chess.isAttacked(square, byColor);
    }
    
    // @ts-ignore - different versions of chess.js have different method names
    if (typeof chess.isSquareAttacked === 'function') {
      // @ts-ignore
      return chess.isSquareAttacked(square, byColor);
    }
    
    // Fallback - check if any piece of the opposite color can move to this square
    // This is a simplification and might not be 100% accurate for all chess rules
    // but should work for basic check detection
    const moves = chess.moves({ verbose: true });
    return moves.some((move: any) => move.to === square);
  } catch (error) {
    console.error("[Convex] Error checking if square is attacked:", error);
    return false;
  }
}
