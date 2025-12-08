/**
 * Bot/AI Chess Move Generation
 * 
 * This file contains Convex Actions and Mutations for generating
 * AI chess moves on the server side.
 * 
 * Note: Since Convex doesn't support running native binaries or web workers,
 * we use chess.js for move evaluation. For production Stockfish integration,
 * you can use the Lichess Cloud Stockfish API via getLichessBotMove action.
 */

import { v } from "convex/values";
import { action, mutation, internalMutation, internalAction } from "./_generated/server";
import { Chess } from "chess.js";
import { api } from "./_generated/api";

/**
 * Bot difficulty settings
 * difficultyDepth maps to different evaluation strategies
 */
type BotDifficulty = {
  depth: number;
  randomness: number; // 0-1, higher = more random moves
  evaluateCaptures: boolean;
  evaluateCenterControl: boolean;
  evaluateKingSafety: boolean;
};

const DIFFICULTY_PRESETS: Record<number, BotDifficulty> = {
  // Easy (depth 1-5): Very random, makes mistakes
  1: { depth: 1, randomness: 0.8, evaluateCaptures: false, evaluateCenterControl: false, evaluateKingSafety: false },
  2: { depth: 2, randomness: 0.7, evaluateCaptures: true, evaluateCenterControl: false, evaluateKingSafety: false },
  3: { depth: 3, randomness: 0.6, evaluateCaptures: true, evaluateCenterControl: false, evaluateKingSafety: false },
  5: { depth: 5, randomness: 0.5, evaluateCaptures: true, evaluateCenterControl: true, evaluateKingSafety: false },
  
  // Medium (depth 10): Balanced play
  10: { depth: 10, randomness: 0.3, evaluateCaptures: true, evaluateCenterControl: true, evaluateKingSafety: true },
    // Hard (depth 15+): Minimal randomness, strong evaluation
  15: { depth: 15, randomness: 0.15, evaluateCaptures: true, evaluateCenterControl: true, evaluateKingSafety: true },
  20: { depth: 20, randomness: 0.05, evaluateCaptures: true, evaluateCenterControl: true, evaluateKingSafety: true },
};

/**
 * Get randomness factor based on difficulty depth
 * Lower difficulty = higher chance to pick suboptimal moves
 */
function getRandomnessForDifficulty(difficultyDepth: number): number {
  const difficultyKeys = Object.keys(DIFFICULTY_PRESETS).map(Number).sort((a, b) => a - b);
  let selectedDifficulty = difficultyKeys[0];
  for (const key of difficultyKeys) {
    if (difficultyDepth >= key) {
      selectedDifficulty = key;
    }
  }
  return DIFFICULTY_PRESETS[selectedDifficulty]?.randomness ?? 0.3;
}

/**
 * Apply difficulty-based move selection
 * Instead of always picking the best move, lower difficulties may pick alternative moves
 * 
 * @param fen - Current board position
 * @param bestMove - The objectively best move from engine
 * @param difficultyDepth - The difficulty level (5=beginner, 10=easy, 15=medium, 20=hard)
 * @returns Either the best move or an alternative based on difficulty
 */
function applyDifficultyToMove(fen: string, bestMove: string, difficultyDepth: number): string {
  const randomness = getRandomnessForDifficulty(difficultyDepth);
  
  // Hard difficulty (20): Almost always play the best move
  if (randomness <= 0.1) {
    return bestMove;
  }
  
  // Roll the dice - should we deviate from the best move?
  const roll = Math.random();
  if (roll > randomness) {
    // Play the best move
    return bestMove;
  }
  
  // Try to pick an alternative move
  try {
    const chess = new Chess(fen);
    const allMoves = chess.moves({ verbose: true });
    
    if (allMoves.length <= 1) {
      return bestMove; // Only one legal move
    }
    
    // Filter out obviously bad moves (hanging pieces, etc.) for medium difficulties
    // For very easy difficulties, allow some blunders
    const validAlternatives = allMoves.filter(move => {
      const uciMove = move.from + move.to + (move.promotion || '');
      if (uciMove === bestMove) return false; // Exclude the best move
      
      // For beginner (depth 5), allow any move
      if (difficultyDepth <= 5) return true;
      
      // For easy (depth 10), prefer captures and central moves, but allow others
      if (difficultyDepth <= 10) {
        // Still allow most moves, just with some filtering
        return true;
      }
      
      // For medium (depth 15), be more selective - prefer reasonable moves
      // Avoid obvious blunders like moving into immediate capture without compensation
      chess.move(move.san);
      const inCheck = chess.inCheck();
      chess.undo();
      
      // Captures are usually reasonable alternatives
      if (move.captured) return true;
      
      // Avoid moves that put us in check response situations (unless it's our only option)
      if (!inCheck) return true;
      
      return false;
    });
    
    if (validAlternatives.length === 0) {
      return bestMove;
    }
    
    // Weight selection based on move quality
    // Captures and center moves are more likely to be picked
    const weightedMoves: Array<{ move: typeof allMoves[0]; weight: number }> = [];
    
    for (const move of validAlternatives) {
      let weight = 1;
      
      // Captures are decent alternatives
      if (move.captured) {
        weight += 3;
        // Better captures (taking higher value pieces) get more weight
        const capturedValue = PIECE_VALUES[move.captured] || 100;
        weight += capturedValue / 200;
      }
      
      // Center moves are reasonable
      if (['d4', 'd5', 'e4', 'e5', 'c4', 'c5', 'f4', 'f5'].includes(move.to)) {
        weight += 2;
      }
      
      // Developing moves (knights and bishops in opening)
      if ((move.piece === 'n' || move.piece === 'b') && 
          ['1', '2', '7', '8'].includes(move.from[1])) {
        weight += 1.5;
      }
      
      // Castling is always a reasonable alternative
      if (move.san === 'O-O' || move.san === 'O-O-O') {
        weight += 4;
      }
      
      weightedMoves.push({ move, weight });
    }
    
    // Select based on weights
    const totalWeight = weightedMoves.reduce((sum, m) => sum + m.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { move, weight } of weightedMoves) {
      random -= weight;
      if (random <= 0) {
        const selectedMove = move.from + move.to + (move.promotion || '');
        console.log(`[Difficulty] Picked alternative move ${selectedMove} instead of ${bestMove} (randomness: ${randomness})`);
        return selectedMove;
      }
    }
    
    // Fallback to first alternative
    const fallback = validAlternatives[0];
    return fallback.from + fallback.to + (fallback.promotion || '');
    
  } catch (error) {
    console.error('[Difficulty] Error selecting alternative move:', error);
    return bestMove;
  }
}

/**
 * Piece values for material evaluation
 */
const PIECE_VALUES: Record<string, number> = {
  p: 100,   // Pawn
  n: 320,   // Knight
  b: 330,   // Bishop
  r: 500,   // Rook
  q: 900,   // Queen
  k: 20000, // King
};

/**
 * Center control bonus squares
 */
const CENTER_SQUARES = ['d4', 'd5', 'e4', 'e5'];
const EXTENDED_CENTER = ['c3', 'c4', 'c5', 'c6', 'd3', 'd6', 'e3', 'e6', 'f3', 'f4', 'f5', 'f6'];

/**
 * Evaluate board position for a given color
 */
function evaluatePosition(chess: Chess, color: 'w' | 'b', difficulty: BotDifficulty): number {
  let score = 0;
  const board = chess.board();
  
  // Material evaluation
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        const value = PIECE_VALUES[piece.type] || 0;
        if (piece.color === color) {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  
  // Center control evaluation
  if (difficulty.evaluateCenterControl) {
    for (const square of CENTER_SQUARES) {
      const piece = chess.get(square as any);
      if (piece) {
        if (piece.color === color) {
          score += 30;
        } else {
          score -= 30;
        }
      }
    }
    
    for (const square of EXTENDED_CENTER) {
      const piece = chess.get(square as any);
      if (piece) {
        if (piece.color === color) {
          score += 10;
        } else {
          score -= 10;
        }
      }
    }
  }
  
  // King safety (simplified)
  if (difficulty.evaluateKingSafety) {
    // Penalize early queen moves
    const moves = chess.history({ verbose: true });
    const earlyQueenMoves = moves.slice(0, 10).filter(m => m.piece === 'q').length;
    if (chess.turn() === color) {
      score -= earlyQueenMoves * 20;
    }
  }
  
  return score;
}

/**
 * Score a move based on various heuristics
 */
function scoreMove(chess: Chess, move: any, difficulty: BotDifficulty): number {
  let score = 0;
  
  // Capture bonus
  if (difficulty.evaluateCaptures && move.captured) {
    const capturedValue = PIECE_VALUES[move.captured] || 0;
    const attackerValue = PIECE_VALUES[move.piece] || 0;
    // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
    score += capturedValue * 10 - attackerValue;
  }
  
  // Center control bonus
  if (difficulty.evaluateCenterControl) {
    if (CENTER_SQUARES.includes(move.to)) {
      score += 30;
    } else if (EXTENDED_CENTER.includes(move.to)) {
      score += 15;
    }
  }
  
  // Promotion bonus
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] || 0;
  }
  
  // Check bonus
  if (move.san.includes('+')) {
    score += 50;
  }
  
  // Checkmate bonus
  if (move.san.includes('#')) {
    score += 10000;
  }
  
  return score;
}

/**
 * Minimax with alpha-beta pruning for move evaluation
 */
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botColor: 'w' | 'b',
  difficulty: BotDifficulty
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess, botColor, difficulty);
  }
  
  const moves = chess.moves({ verbose: true });
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move.san);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false, botColor, difficulty);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move.san);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true, botColor, difficulty);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Get the best move for the bot
 * Uses minimax with alpha-beta pruning and various heuristics
 */
function getBestMove(fen: string, difficultyDepth: number): string | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  
  if (moves.length === 0) {
    return null;
  }
  
  // Get difficulty settings
  const difficultyKeys = Object.keys(DIFFICULTY_PRESETS).map(Number).sort((a, b) => a - b);
  let selectedDifficulty = difficultyKeys[0];
  for (const key of difficultyKeys) {
    if (difficultyDepth >= key) {
      selectedDifficulty = key;
    }
  }
  const difficulty = DIFFICULTY_PRESETS[selectedDifficulty] || DIFFICULTY_PRESETS[10];
  
  const botColor = chess.turn();
  
  // Score all moves
  const scoredMoves: Array<{ move: any; score: number }> = [];
  
  // Limit depth for performance in Convex environment
  const effectiveDepth = Math.min(difficulty.depth, 4);
  
  for (const move of moves) {
    chess.move(move.san);
    
    // Use minimax for position evaluation
    const positionScore = minimax(
      chess,
      effectiveDepth - 1,
      -Infinity,
      Infinity,
      false,
      botColor,
      difficulty
    );
    
    chess.undo();
    
    // Add tactical bonuses
    const tacticalScore = scoreMove(chess, move, difficulty);
    
    // Add randomness based on difficulty
    const randomFactor = (Math.random() - 0.5) * 2 * difficulty.randomness * 500;
    
    const totalScore = positionScore + tacticalScore + randomFactor;
    
    scoredMoves.push({ move, score: totalScore });
  }
  
  // Sort by score (descending)
  scoredMoves.sort((a, b) => b.score - a.score);
  
  // Return best move in UCI format (e.g., 'e2e4')
  const bestMove = scoredMoves[0];
  if (bestMove) {
    const uci = bestMove.move.from + bestMove.move.to + (bestMove.move.promotion || '');
    return uci;
  }
  
  return null;
}

/**
 * Convex Action: Get Bot Move
 * 
 * Calculates the best move for the bot based on the current game state.
 * This is an Action (not a mutation) because it performs CPU-intensive
 * calculations without directly modifying the database.
 * 
 * @param gameId - The ID of the game
 * @param fen - Current board state in FEN notation
 * @param difficultyDepth - Search depth (1-20, higher = stronger)
 * @returns The best move in UCI format (e.g., 'e2e4')
 */
export const getBotMove = action({
  args: {
    gameId: v.string(),
    fen: v.string(),
    difficultyDepth: v.number(),
  },
  handler: async (ctx, { gameId, fen, difficultyDepth }): Promise<{
    success: boolean;
    move: string | null;
    error?: string;
  }> => {
    console.log(`[Bot] Calculating move for game ${gameId} with depth ${difficultyDepth}`);
    console.log(`[Bot] Current FEN: ${fen}`);
    
    try {
      // Validate FEN
      const chess = new Chess(fen);
      
      // Check if game is already over
      if (chess.isGameOver()) {
        console.log(`[Bot] Game is already over`);
        return {
          success: false,
          move: null,
          error: 'Game is already over',
        };
      }
      
      // Calculate best move
      const bestMove = getBestMove(fen, difficultyDepth);
      
      if (!bestMove) {
        console.log(`[Bot] No valid moves available`);
        return {
          success: false,
          move: null,
          error: 'No valid moves available',
        };
      }
      
      console.log(`[Bot] Best move calculated: ${bestMove}`);
      
      return {
        success: true,
        move: bestMove,
      };
    } catch (error) {
      console.error(`[Bot] Error calculating move:`, error);
      return {
        success: false,
        move: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Convex Mutation: Make Bot Move
 * 
 * Applies the bot's calculated move to the game state.
 * Updates the FEN, move history, and switches the active player.
 * 
 * @param gameId - The ID of the game
 * @param move - The move in UCI format (e.g., 'e2e4')
 */
export const makeBotMove = mutation({
  args: {
    gameId: v.string(),
    move: v.string(), // UCI format: 'e2e4' or 'e7e8q' (with promotion)
  },
  handler: async (ctx, { gameId, move }) => {
    console.log(`[Bot] Applying move ${move} to game ${gameId}`);
    
    try {
      // Find the game
      const game = await ctx.db
        .query("games")
        .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
        .first();
      
      if (!game) {
        console.error(`[Bot] Game not found: ${gameId}`);
        throw new Error(`Game not found: ${gameId}`);
      }
      
      // Validate game status
      if (game.status !== "active") {
        console.error(`[Bot] Game is not active: ${game.status}`);
        throw new Error(`Game is not active: ${game.status}`);
      }
      
      // Initialize chess with current position
      let chess: Chess;
      try {
        chess = new Chess(game.fen);
      } catch (fenError) {
        console.error(`[Bot] Invalid FEN in database: ${game.fen}`, fenError);
        throw new Error(`Invalid FEN in database: ${game.fen}`);
      }
      
      // Parse UCI move
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      const promotion = move.length > 4 ? move.slice(4, 5) : undefined;
      
      console.log(`[Bot] Parsed move: from=${from}, to=${to}, promotion=${promotion || 'none'}`);
      console.log(`[Bot] Current FEN: ${game.fen}, Turn: ${chess.turn()}`);
      
      // Make the move
      const moveResult = chess.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      });
      
      if (!moveResult) {
        console.error(`[Bot] Invalid move: ${move} for position ${game.fen}`);
        // Log legal moves for debugging
        const debugLegalMoves = chess.moves({ verbose: true });
        console.error(`[Bot] Legal moves:`, debugLegalMoves.map(m => m.from + m.to).join(', '));
        throw new Error(`Invalid move: ${move}`);
      }
    
    console.log(`[Bot] Move applied: ${moveResult.san}`);
    console.log(`[Bot] New FEN: ${chess.fen()}`);
    
    // Determine next turn
    const nextTurn: 'white' | 'black' = game.currentTurn === "white" ? "black" : "white";
    
    // Build update object
    const now = Date.now();
    const patch: Record<string, any> = {
      fen: chess.fen(),
      lastMove: moveResult.san,
      lastMoveTime: now,
      currentTurn: nextTurn,
      moveHistory: [...game.moveHistory, moveResult.san],
    };
    
    // Update timer if time control is enabled
    if (game.timeControl && game.timeControl.type !== 'none' && game.lastMoveTimestamp) {
      const movingColor = game.currentTurn;
      const elapsed = now - game.lastMoveTimestamp;
      
      if (movingColor === 'white') {
        patch.whiteTimeMs = Math.max(0, (game.whiteTimeMs || 0) - elapsed + (game.timeControl.incrementMs || 0));
      } else {
        patch.blackTimeMs = Math.max(0, (game.blackTimeMs || 0) - elapsed + (game.timeControl.incrementMs || 0));
      }
      
      patch.lastMoveTimestamp = now;
    }
    
    // Check for game over
    const legalMoves = chess.moves();
    
    if (legalMoves.length === 0) {
      patch.status = "finished";
      
      // Check if it's checkmate or stalemate
      if (chess.isCheckmate()) {
        // The player who just moved wins
        patch.result = "checkmate";
        patch.winner = game.currentTurn === "white" ? game.player1.id : game.player2.id;
        patch.endReason = `Checkmate by ${game.currentTurn}`;
        console.log(`[Bot] Game ended: Checkmate! Winner: ${game.currentTurn}`);
      } else {
        // Stalemate = draw
        patch.result = "stalemate";
        patch.winner = "draw";
        patch.endReason = "Stalemate";
        console.log(`[Bot] Game ended: Stalemate`);
      }
    }
    
    // Apply updates
    await ctx.db.patch(game._id, patch);
    
    console.log(`[Bot] Game state updated successfully`);
    
    return {
      success: true,
      newFen: chess.fen(),
      moveSan: moveResult.san,
      gameOver: legalMoves.length === 0,
      result: patch.result || null,
      winner: patch.winner || null,
    };
    } catch (error) {
      console.error(`[Bot] Error in makeBotMove:`, error);
      throw error;
    }
  },
});

/**
 * Internal Action: Get Bot Move (for internal use)
 */
export const internalGetBotMove = internalAction({
  args: {
    gameId: v.string(),
    fen: v.string(),
    difficultyDepth: v.number(),
  },
  handler: async (ctx, { gameId, fen, difficultyDepth }): Promise<{
    success: boolean;
    move: string | null;
    error?: string;
  }> => {
    console.log(`[Bot Internal] Calculating move for game ${gameId} with depth ${difficultyDepth}`);
    
    try {
      const bestMove = getBestMove(fen, difficultyDepth);
      
      if (!bestMove) {
        return { success: false, move: null, error: 'No valid moves available' };
      }
      
      return { success: true, move: bestMove };
    } catch (error) {
      return {
        success: false,
        move: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Internal Mutation: Make Bot Move (for internal use)
 */
export const internalMakeBotMove = internalMutation({
  args: {
    gameId: v.string(),
    move: v.string(),
  },
  handler: async (ctx, { gameId, move }) => {
    // Find the game
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();
    
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
    
    if (game.status !== "active") {
      throw new Error(`Game is not active: ${game.status}`);
    }
    
    const chess = new Chess(game.fen);
    
    const from = move.slice(0, 2);
    const to = move.slice(2, 4);
    const promotion = move.length > 4 ? move.slice(4, 5) : undefined;
    
    const moveResult = chess.move({
      from,
      to,
      promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
    });
    
    if (!moveResult) {
      throw new Error(`Invalid move: ${move}`);
    }
    
    const nextTurn: 'white' | 'black' = game.currentTurn === "white" ? "black" : "white";
    const now = Date.now();
    
    const patch: Record<string, any> = {
      fen: chess.fen(),
      lastMove: moveResult.san,
      lastMoveTime: now,
      currentTurn: nextTurn,
      moveHistory: [...game.moveHistory, moveResult.san],
    };
    
    if (game.timeControl && game.timeControl.type !== 'none' && game.lastMoveTimestamp) {
      const movingColor = game.currentTurn;
      const elapsed = now - game.lastMoveTimestamp;
      
      if (movingColor === 'white') {
        patch.whiteTimeMs = Math.max(0, (game.whiteTimeMs || 0) - elapsed + (game.timeControl.incrementMs || 0));
      } else {
        patch.blackTimeMs = Math.max(0, (game.blackTimeMs || 0) - elapsed + (game.timeControl.incrementMs || 0));
      }
      
      patch.lastMoveTimestamp = now;
    }
    
    const legalMoves = chess.moves();
    
    if (legalMoves.length === 0) {
      patch.status = "finished";
      
      if (chess.isCheckmate()) {
        patch.result = "checkmate";
        patch.winner = game.currentTurn === "white" ? game.player1.id : game.player2.id;
        patch.endReason = `Checkmate by ${game.currentTurn}`;
      } else {
        patch.result = "stalemate";
        patch.winner = "draw";
        patch.endReason = "Stalemate";
      }
    }
    
    await ctx.db.patch(game._id, patch);
    
    return {
      success: true,
      newFen: chess.fen(),
      moveSan: moveResult.san,
      gameOver: legalMoves.length === 0,
      result: patch.result || null,
      winner: patch.winner || null,
    };
  },
});

/**
 * Convex Action: Execute Bot Turn
 * 
 * Combines getBotMove and makeBotMove into a single action.
 * This is useful when you want to calculate and apply the move in one call.
 * 
 * Note: This action calculates the move inline and applies it directly.
 * After running `npx convex dev`, the api.bot references will be available.
 * 
 * @param gameId - The ID of the game
 * @param difficultyDepth - Search depth (1-20, higher = stronger)
 */
export const executeBotTurn = action({
  args: {
    gameId: v.string(),
    difficultyDepth: v.optional(v.number()),
  },
  handler: async (ctx, { gameId, difficultyDepth = 10 }): Promise<{
    success: boolean;
    move?: string;
    moveSan?: string;
    newFen?: string;
    gameOver?: boolean;
    result?: string | null;
    winner?: string | null;
    error?: string;
  }> => {
    console.log(`[Bot] Executing bot turn for game ${gameId}`);
    
    // First, get the current game state
    const game: any = await ctx.runQuery(api.games.getGameById, { gameId });
    
    if (!game) {
      return {
        success: false,
        error: 'Game not found',
      };
    }
    
    if (game.status !== 'active') {
      return {
        success: false,
        error: 'Game is not active',
      };
    }
    
    // Calculate the best move inline
    console.log(`[Bot] Calculating best move for FEN: ${game.fen}`);
    const bestMove = getBestMove(game.fen, difficultyDepth);
    
    if (!bestMove) {
      return {
        success: false,
        error: 'No valid moves available',
      };
    }
    
    console.log(`[Bot] Best move calculated: ${bestMove}`);
    
    // Apply the move inline using a helper function
    // We need to use internalMakeBotMove via scheduler or direct call
    // For now, use the public mutation reference that will be available after codegen
    try {
      // Parse the move and apply it
      const chessInstance: Chess = new Chess(game.fen);
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const promotion = bestMove.length > 4 ? bestMove.slice(4, 5) : undefined;
      
      const moveResultObj = chessInstance.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      });
      
      if (!moveResultObj) {
        return {
          success: false,
          error: `Invalid move: ${bestMove}`,
        };
      }
        // Now apply via mutation using the generated API reference
      await ctx.runMutation(api.bot.makeBotMove, {
        gameId,
        move: bestMove,
      });
      
      return {
        success: true,
        move: bestMove,
        moveSan: moveResultObj.san,
        newFen: chessInstance.fen(),
        gameOver: chessInstance.isGameOver(),
        result: chessInstance.isCheckmate() ? 'checkmate' : chessInstance.isStalemate() ? 'stalemate' : null,
        winner: null, // Will be determined by the mutation
      };
    } catch (error) {
      console.error(`[Bot] Error applying move:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply move',
      };
    }
  },
});

/**
 * Lichess Cloud Stockfish API Response Type
 */
interface LichessCloudEvalResponse {
  fen: string;
  knodes: number;
  depth: number;
  pvs: Array<{
    moves: string; // Space-separated UCI moves (e.g., "e2e4 e7e5 g1f3")
    cp?: number;   // Centipawn evaluation
    mate?: number; // Mate in X moves (positive = white winning, negative = black winning)
  }>;
}

/**
 * Stockfish Online API Response Type
 * This API actually computes moves in real-time (unlike Lichess cloud which is just a lookup)
 */
interface StockfishOnlineResponse {
  success: boolean;
  bestmove?: string;
  evaluation?: number;
  mate?: number | null;
  continuation?: string;
}

/**
 * Convex Action: Get Bot Move from Lichess Cloud Stockfish API
 * 
 * Calls the Lichess Cloud Stockfish API to get the best move for the bot.
 * This offloads the CPU-intensive Stockfish computation to Lichess servers.
 * 
 * @param gameId - The ID of the game
 * @param fen - Current board state in FEN notation
 * @param difficultyDepth - Search depth (10-25 recommended)
 * @returns The best move in UCI format (e.g., 'e2e4')
 */
export const getLichessBotMove = action({
  args: {
    gameId: v.string(),
    fen: v.string(),
    difficultyDepth: v.number(),
  },
  handler: async (ctx, { gameId, fen, difficultyDepth }): Promise<{
    success: boolean;
    move: string | null;
    evaluation?: {
      depth: number;
      cp?: number;
      mate?: number;
    };
    error?: string;
  }> => {
    console.log(`[Lichess Bot] Fetching move for game ${gameId} with depth ${difficultyDepth}`);
    console.log(`[Lichess Bot] Current FEN: ${fen}`);
    
    try {
      // Validate FEN first
      const chess = new Chess(fen);
      
      // Check if game is already over
      if (chess.isGameOver()) {
        console.log(`[Lichess Bot] Game is already over`);
        return {
          success: false,
          move: null,
          error: 'Game is already over',
        };
      }
      
      // Ensure depth is within reasonable bounds (Lichess typically supports up to depth 25)
      const clampedDepth = Math.max(1, Math.min(difficultyDepth, 25));
      
      // Encode FEN for URL (replace spaces with underscores as per Lichess API convention)
      const encodedFen = encodeURIComponent(fen);
      
      // Build the Lichess Cloud Stockfish API URL
      const lichessUrl = `https://lichess.org/api/cloud-eval?fen=${encodedFen}&multiPv=1`;
      
      console.log(`[Lichess Bot] Calling Lichess API: ${lichessUrl}`);
      
      // Call Lichess Cloud Stockfish API
      const response = await fetch(lichessUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
        if (!response.ok) {
        // If position not in cloud database, fall back to Stockfish Online API
        if (response.status === 404) {
          console.log(`[Lichess Bot] Position not in cloud database, trying Stockfish Online API`);
          
          // Use stockfish.online API which computes moves in real-time
          // Clamp depth for faster response (10-12 is good balance of speed and strength)
          const onlineDepth = Math.min(difficultyDepth, 12);
          const stockfishOnlineUrl = `https://stockfish.online/api/s/v2.php?fen=${encodedFen}&depth=${onlineDepth}`;
          
          try {
            const stockfishResponse = await fetch(stockfishOnlineUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            });
              if (stockfishResponse.ok) {
              const stockfishData: StockfishOnlineResponse = await stockfishResponse.json();
              
              if (stockfishData.success && stockfishData.bestmove) {
                // Parse bestmove from format "bestmove e2e4 ponder e7e5" to just "e2e4"
                const bestMoveMatch = stockfishData.bestmove.match(/bestmove\s+(\S+)/);
                const bestMove = bestMoveMatch ? bestMoveMatch[1] : stockfishData.bestmove;
                
                console.log(`[Stockfish Online] Best move: ${bestMove}`);
                
                // Apply difficulty-based move selection
                const finalMove = applyDifficultyToMove(fen, bestMove, difficultyDepth);
                
                return {
                  success: true,
                  move: finalMove,
                  evaluation: {
                    depth: onlineDepth,
                    cp: stockfishData.evaluation ? Math.round(stockfishData.evaluation * 100) : undefined,
                    mate: stockfishData.mate ?? undefined,
                  },
                };
              }
            }
          } catch (stockfishError) {
            console.log(`[Stockfish Online] API failed, falling back to local:`, stockfishError);
          }
          
          // Final fallback to local calculation
          console.log(`[Lichess Bot] Stockfish Online also failed, using local calculation`);
          const localMove = getBestMove(fen, difficultyDepth);
          
          if (!localMove) {
            return {
              success: false,
              move: null,
              error: 'No valid moves available',
            };
          }
          
          return {
            success: true,
            move: localMove,
            evaluation: {
              depth: Math.min(difficultyDepth, 4), // Local depth is limited
            },
          };
        }
        
        throw new Error(`Lichess API error: ${response.status} ${response.statusText}`);
      }
      
      const data: LichessCloudEvalResponse = await response.json();
      
      console.log(`[Lichess Bot] API Response:`, JSON.stringify(data, null, 2));
      
      // Extract the best move from the response
      if (!data.pvs || data.pvs.length === 0 || !data.pvs[0].moves) {
        console.log(`[Lichess Bot] No moves in API response, falling back to local calculation`);
        const localMove = getBestMove(fen, difficultyDepth);
        
        return {
          success: localMove !== null,
          move: localMove,
          error: localMove ? undefined : 'No valid moves available',
        };
      }
        // Get the first move from the principal variation
      const bestMove = data.pvs[0].moves.split(' ')[0];
      
      console.log(`[Lichess Bot] Best move from Lichess: ${bestMove}`);
      
      // Apply difficulty-based move selection (lower difficulties may pick alternatives)
      const finalMove = applyDifficultyToMove(fen, bestMove, difficultyDepth);
      
      return {
        success: true,
        move: finalMove,
        evaluation: {
          depth: data.depth,
          cp: data.pvs[0].cp,
          mate: data.pvs[0].mate,
        },
      };
    } catch (error) {
      console.error(`[Lichess Bot] Error fetching move:`, error);
      
      // Fall back to local calculation on any error
      console.log(`[Lichess Bot] Falling back to local calculation`);
      try {
        const localMove = getBestMove(fen, difficultyDepth);
        
        if (localMove) {
          return {
            success: true,
            move: localMove,
            evaluation: {
              depth: Math.min(difficultyDepth, 4),
            },
          };
        }
      } catch (localError) {
        console.error(`[Lichess Bot] Local calculation also failed:`, localError);
      }
      
      return {
        success: false,
        move: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Internal Action: Get Bot Move from Lichess (for internal use/scheduling)
 */
export const internalGetLichessBotMove = internalAction({
  args: {
    gameId: v.string(),
    fen: v.string(),
    difficultyDepth: v.number(),
  },
  handler: async (ctx, { gameId, fen, difficultyDepth }): Promise<{
    success: boolean;
    move: string | null;
    evaluation?: {
      depth: number;
      cp?: number;
      mate?: number;
    };
    error?: string;
  }> => {
    console.log(`[Lichess Bot Internal] Fetching move for game ${gameId}`);
    
    try {
      const chess = new Chess(fen);
      
      if (chess.isGameOver()) {
        return { success: false, move: null, error: 'Game is already over' };
      }
      
      const clampedDepth = Math.max(1, Math.min(difficultyDepth, 25));
      const encodedFen = encodeURIComponent(fen);
      const lichessUrl = `https://lichess.org/api/cloud-eval?fen=${encodedFen}&multiPv=1`;
      
      const response = await fetch(lichessUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
        if (!response.ok) {
        if (response.status === 404) {
          // Position not in cloud, try Stockfish Online API
          console.log(`[Lichess Bot Internal] Position not in cloud, trying Stockfish Online API`);
          
          const onlineDepth = Math.min(difficultyDepth, 12);
          const stockfishOnlineUrl = `https://stockfish.online/api/s/v2.php?fen=${encodedFen}&depth=${onlineDepth}`;
          
          try {
            const stockfishResponse = await fetch(stockfishOnlineUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            });
            
            if (stockfishResponse.ok) {
              const stockfishData: StockfishOnlineResponse = await stockfishResponse.json();
                if (stockfishData.success && stockfishData.bestmove) {
                const bestMoveMatch = stockfishData.bestmove.match(/bestmove\s+(\S+)/);
                const bestMove = bestMoveMatch ? bestMoveMatch[1] : stockfishData.bestmove;
                
                // Apply difficulty-based move selection
                const finalMove = applyDifficultyToMove(fen, bestMove, difficultyDepth);
                
                return {
                  success: true,
                  move: finalMove,
                  evaluation: {
                    depth: onlineDepth,
                    cp: stockfishData.evaluation ? Math.round(stockfishData.evaluation * 100) : undefined,
                    mate: stockfishData.mate ?? undefined,
                  },
                };
              }
            }
          } catch (stockfishError) {
            console.log(`[Lichess Bot Internal] Stockfish Online failed:`, stockfishError);
          }
          
          // Final fallback to local calculation
          const localMove = getBestMove(fen, difficultyDepth);
          return {
            success: localMove !== null,
            move: localMove,
            error: localMove ? undefined : 'No valid moves available',
          };
        }
        throw new Error(`Lichess API error: ${response.status}`);
      }
      
      const data: LichessCloudEvalResponse = await response.json();
      
      if (!data.pvs || data.pvs.length === 0 || !data.pvs[0].moves) {
        const localMove = getBestMove(fen, difficultyDepth);
        return {
          success: localMove !== null,
          move: localMove,
        };
      }
        const bestMove = data.pvs[0].moves.split(' ')[0];
      
      // Apply difficulty-based move selection
      const finalMove = applyDifficultyToMove(fen, bestMove, difficultyDepth);
      
      return {
        success: true,
        move: finalMove,
        evaluation: {
          depth: data.depth,
          cp: data.pvs[0].cp,
          mate: data.pvs[0].mate,
        },
      };
    } catch (error) {
      // Fallback to local calculation
      const localMove = getBestMove(fen, difficultyDepth);
      if (localMove) {
        return { success: true, move: localMove };
      }
      return {
        success: false,
        move: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
