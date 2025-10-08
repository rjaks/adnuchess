import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Chess } from "chess.js";

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
  },
  handler: async (ctx, { gameId, player1, player2, gameMode }) => {
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
    
    const gameDoc = {
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
    
    // Update game state
    const now = Date.now();
    
    // Determine next turn
    const nextTurn = game.currentTurn === "white" ? "black" : "white";
    console.log(`Switching turn from ${game.currentTurn} to ${nextTurn}`);
    
    // Build update object
    const patch = {
      fen: chess.fen(),
      lastMove: move,
      lastMoveTime: now,
      currentTurn: nextTurn,
      moveHistory: [...game.moveHistory, move]
    };
    
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
        console.log(`[Convex] Player ${playerId} wins by checkmate`);
      } else {
        // Stalemate - draw
        // @ts-ignore
        patch.winner = "draw";
        console.log("[Convex] Game ended in stalemate (draw)");
      }
    }
    
    // Update the game in database
    await ctx.db.patch(game._id, patch);
    
    console.log("Game updated successfully");
    
    return {
      success: true,
      gameId,
      nextTurn
    };
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
