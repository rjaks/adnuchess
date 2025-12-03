import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Chess } from "chess.js";
import { initializeTimers, parseTimeControl } from "./utils/timerHelpers";

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
    timeControlString: v.optional(v.string()), // e.g., "5+3" for 5 min + 3 sec increment
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
    
    console.log(`Player 1 (${fixedPlayer1.name}): white, Player 2 (${fixedPlayer2.name}): black`);    // Initialize a new chess game
    const chess = new Chess();
    const initialFen = chess.fen();
    console.log(`Initial FEN: ${initialFen}`);
    
    // Initialize timer fields if timeControlString is provided
    let timerFields = {};
    if (timeControlString) {
      const timeControl = parseTimeControl(timeControlString);
      const timerState = initializeTimers(timeControl, now);
      timerFields = {
        timeControl: {
          baseTimeMs: timeControl.baseTimeMs,
          incrementMs: timeControl.incrementMs,
          type: timeControl.type
        },
        whiteTimeMs: timerState.whiteTimeMs,
        blackTimeMs: timerState.blackTimeMs,
        lastMoveTimestamp: timerState.lastMoveTimestamp,
        gameStartTimestamp: timerState.gameStartTimestamp,
        timeoutWinner: null
      };
    }
    
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
      moveHistory: [],
      ...timerFields // Add timer fields if present
    };
    
    console.log(`Creating new game with current turn: ${gameDoc.currentTurn}`);
    if (timeControlString) {
      console.log(`Time control: ${timeControlString}`, timerFields);
    }
    
    return await ctx.db.insert("games", gameDoc);
  },
});

export const getAllGames = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("games").collect();
  },
});

export const cleanupExpiredGames = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    // Get all active games
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    let cleanedCount = 0;
    
    for (const game of activeGames) {
      const gameAge = now - game.createdAt;
      
      if (gameAge > thirtyMinutes) {
        // Mark expired games as finished
        await ctx.db.patch(game._id, {
          status: "finished",
          winner: "expired",
          endReason: "30_minute_timeout"
        });
        cleanedCount++;
        console.log(`Expired game ${game.gameId} after ${Math.round(gameAge / 1000 / 60)} minutes`);
      }
    }
    
    return {
      cleanedGames: cleanedCount,
      message: `Cleaned up ${cleanedCount} expired games`
    };
  },
});

export const updateGameStatus = mutation({
  args: {
    gameId: v.string(),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    winner: v.optional(v.string())
  },
  handler: async (ctx, { gameId, status, winner }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();
    
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
    
    const patch: Record<string, any> = { status };
    if (winner !== undefined) {
      patch.winner = winner;
    }
    
    return await ctx.db.patch(game._id, patch);
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
    const patch: Record<string, any> = {
      fen: chess.fen(),
      lastMove: move,
      lastMoveTime: now,
      currentTurn: nextTurn,
      moveHistory: [...game.moveHistory, move]
    };
    
    // Instead of using game_over() which might not be compatible,
    // check if there are any legal moves for the opponent
    const legalMoves = chess.moves();
    console.log(`[Convex] Legal moves after this move: ${legalMoves.length}`);
    
    if (legalMoves.length === 0) {
      console.log("[Convex] No legal moves available, game is over");
      patch.status = "finished";
        // Check if the king is in check to determine checkmate vs stalemate
      let inCheck = false;
      try {
        // Use the correct chess.js method for checking if king is in check
        inCheck = chess.inCheck();
      } catch (error) {
        console.error("[Convex] Error checking if king is in check:", error);
      }
      
      if (inCheck) {
        // Checkmate - current player wins
        patch.winner = playerId;
        console.log(`[Convex] Player ${playerId} wins by checkmate`);
      } else {
        // Stalemate - draw
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

export const getMatchHistory = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Get all games where the user is player1
    const player1Games = await ctx.db
      .query("games")
      .withIndex("by_player", (q) => q.eq("player1.id", userId))
      .collect();

    // Get all games where the user is player2
    const player2Games = await ctx.db
      .query("games")
      .withIndex("by_player2", (q) => q.eq("player2.id", userId))
      .collect();

    // Combine all games
    const allGames = [...player1Games, ...player2Games];

    // Filter only finished games (exclude 'active' and 'waiting' status)
    const finishedGames = allGames.filter(
      (game) => game.status === "finished"
    );

    // Process each game to get match history data
    const matchHistoryPromises = finishedGames.map(async (game) => {
      // Determine if user is player1 or player2
      const isPlayer1 = game.player1.id === userId;
      const userColor = isPlayer1 ? game.player1.color : game.player2.color;
      const opponent = isPlayer1 ? game.player2 : game.player1;
      const opponentId = opponent.id;

      // Fetch opponent's profile for current rating
      const opponentProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", opponentId))
        .unique();

      // Determine result from user's perspective
      let result: "Win" | "Loss" | "Draw";
      
      if (game.winner === "draw" || game.result === "stalemate" || game.result === "agreement") {
        result = "Draw";
      } else if (game.winner === userId) {
        // User won directly by ID
        result = "Win";
      } else if (game.winner === userColor) {
        // User won by color (e.g., "white" or "black")
        result = "Win";
      } else if (game.winner && game.winner !== "expired") {
        // Someone else won
        result = "Loss";
      } else {
        // Edge case: game marked finished but no clear winner (e.g., expired)
        result = "Draw";
      }

      return {
        gameId: game.gameId,
        opponentName: opponentProfile?.name ?? opponent.name,
        opponentId: opponentId,
        opponentRating: opponentProfile?.eloRating ?? 1500, // Default rating if not found
        result,
        datePlayed: game.createdAt,
      };
    });

    // Resolve all promises
    const matchHistory = await Promise.all(matchHistoryPromises);

    // Sort by datePlayed (newest first)
    matchHistory.sort((a, b) => b.datePlayed - a.datePlayed);

    return matchHistory;
  },
});

export const getGameDetails = query({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    // Fetch the game document
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      return null;
    }

    // Determine white and black players based on color
    const whitePlayer = game.player1.color === "white" ? game.player1 : game.player2;
    const blackPlayer = game.player1.color === "black" ? game.player1 : game.player2;

    // Fetch player profiles for enrichment
    const whiteProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", whitePlayer.id))
      .first();

    const blackProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", blackPlayer.id))
      .first();

    // Build enriched response
    return {
      gameId: game.gameId,
      whiteId: whitePlayer.id,
      blackId: blackPlayer.id,
      status: game.status,
      winner: game.winner ?? null,
      result: game.result ?? null,
      endReason: game.endReason ?? null,
      moveHistory: game.moveHistory,
      fen: game.fen,
      currentTurn: game.currentTurn,
      gameMode: game.gameMode,
      gameCreationTime: game.createdAt,
      lastMoveTime: game.lastMoveTime,
      // Time control fields (if present)
      timeControl: game.timeControl ?? null,
      whiteTimeMs: game.whiteTimeMs ?? null,
      blackTimeMs: game.blackTimeMs ?? null,
      // Enriched player data
      white: {
        id: whitePlayer.id,
        name: whiteProfile?.name ?? whitePlayer.name,
        displayName: whiteProfile?.displayName ?? null,
        eloRating: whiteProfile?.eloRating ?? 1500,
        picture: whiteProfile?.picture ?? null,
      },
      black: {
        id: blackPlayer.id,
        name: blackProfile?.name ?? blackPlayer.name,
        displayName: blackProfile?.displayName ?? null,
        eloRating: blackProfile?.eloRating ?? 1500,
        picture: blackProfile?.picture ?? null,
      },
    };
  },
});
