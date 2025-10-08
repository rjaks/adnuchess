import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const joinQueue = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    userRating: v.number(),
    gameMode: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if player is already in queue
    const existing = await ctx.db
      .query("matchmaking")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      return { success: true, alreadyInQueue: true };
    }

    // Look for opponents with same game mode
    const opponents = await ctx.db
      .query("matchmaking")
      .withIndex("by_gameMode", (q) => q.eq("gameMode", args.gameMode))
      .filter((q) => q.neq(q.field("userId"), args.userId))
      .collect();

    if (opponents.length > 0) {
      // Found a match! Create game and remove both from queue
      const opponent = opponents[0]!; // We know it exists
      
      // Generate game ID
      const gameId = crypto.randomUUID();
      
      // Randomly assign colors
      const isCurrentPlayerWhite = Math.random() > 0.5;
      
      // Create game directly
      await ctx.db.insert("games", {
        gameId,
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        lastMove: undefined,
        lastMoveTime: Date.now(),
        currentTurn: "white",
        player1: {
          id: isCurrentPlayerWhite ? args.userId : opponent.userId,
          name: isCurrentPlayerWhite ? args.userName : opponent.userName,
          color: "white"
        },
        player2: {
          id: isCurrentPlayerWhite ? opponent.userId : args.userId,
          name: isCurrentPlayerWhite ? opponent.userName : args.userName,
          color: "black"
        },
        status: "active",
        gameMode: args.gameMode,
        createdAt: Date.now(),
        moveHistory: [],
      });
      
      // Remove both players from queue
      await ctx.db.delete(opponent._id);
      
      return {
        success: true,
        matchFound: true,
        gameId,
        playerColor: isCurrentPlayerWhite ? "white" : "black"
      };
    }

    // No match found, add to queue
    await ctx.db.insert("matchmaking", {
      userId: args.userId,
      userName: args.userName,
      userRating: args.userRating,
      gameMode: args.gameMode,
      joinedAt: Date.now(),
    });

    return { success: true, matchFound: false };
  },
});

export const leaveQueue = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const queueEntry = await ctx.db
      .query("matchmaking")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (queueEntry) {
      await ctx.db.delete(queueEntry._id);
    }

    return { success: true };
  },
});

export const getQueueStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Check if player has an active game
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
    
    const activeGames = [...asPlayer1, ...asPlayer2];
    
    if (activeGames.length > 0) {
      const game = activeGames[0]!; // We know it exists
      return {
        inQueue: false,
        matchFound: true,
        gameId: game.gameId,
        playerColor: game.player1.id === userId ? game.player1.color : game.player2.color
      };
    }

    // Check if player is in queue
    const queueEntry = await ctx.db
      .query("matchmaking")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!queueEntry) {
      return { inQueue: false };
    }

    return {
      inQueue: true,
      gameMode: queueEntry.gameMode,
      queueTime: Date.now() - queueEntry.joinedAt
    };
  },
});

export const getQueueStats = query({
  args: {},
  handler: async (ctx) => {
    const queueEntries = await ctx.db.query("matchmaking").collect();
    
    const stats = {
      onlineCount: queueEntries.length,
      gameModes: {} as Record<string, number>
    };

    for (const entry of queueEntries) {
      stats.gameModes[entry.gameMode] = (stats.gameModes[entry.gameMode] || 0) + 1;
    }

    return stats;
  },
});