import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Chess } from "chess.js";

export const getById = query({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    return await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .unique();
  },
});

export const getPlayerGames = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const asPlayer1 = await ctx.db
      .query("games")
      .withIndex("by_player1", (q) => q.eq("player1.id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const asPlayer2 = await ctx.db
      .query("games")
      .withIndex("by_player2", (q) => q.eq("player2.id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    return [...asPlayer1, ...asPlayer2];
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
  handler: async (ctx, args) => {
    const gameId = await ctx.db.insert("games", {
      gameId: args.gameId,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
      lastMove: undefined,
      lastMoveTime: Date.now(),
      currentTurn: "white",
      player1: args.player1,
      player2: args.player2,
      status: "active",
      gameMode: args.gameMode,
      createdAt: Date.now(),
      moveHistory: [],
    });
    
    return gameId;
  },
});

export const makeMove = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
    move: v.string(),
  },
  handler: async (ctx, { gameId, playerId, move }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .unique();

    if (!game) {
      throw new Error("Game not found");
    }

    // Check if it's the player's turn
    const isPlayer1 = game.player1.id === playerId;
    const isPlayer2 = game.player2.id === playerId;
    
    if (!isPlayer1 && !isPlayer2) {
      throw new Error("You are not a player in this game");
    }

    const playerColor = isPlayer1 ? game.player1.color : game.player2.color;
    
    if (game.currentTurn !== playerColor) {
      throw new Error("It is not your turn");
    }

    // Validate move using chess.js
    const chess = new Chess(game.fen);
    const moveResult = chess.move(move);
    
    if (!moveResult) {
      throw new Error("Invalid move");
    }

    // Update game state
    const updatedGame = {
      fen: chess.fen(),
      lastMove: move,
      lastMoveTime: Date.now(),
      currentTurn: game.currentTurn === "white" ? "black" as const : "white" as const,
      moveHistory: [...game.moveHistory, move],
      status: chess.game_over() ? "finished" as const : game.status,
      winner: chess.game_over() 
        ? (chess.in_checkmate() ? playerId : "draw")
        : game.winner,
    };

    await ctx.db.patch(game._id, updatedGame);

    return { success: true, gameState: { ...game, ...updatedGame } };
  },
});

export const getActiveGames = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});