import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const resignGame = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status === "finished") {
      throw new Error("Game is already finished");
    }

    // Determine the winner
    let winner;
    if (playerId === game.player1.id) {
      winner = game.player2.id;
    } else if (playerId === game.player2.id) {
      winner = game.player1.id;
    } else {
      throw new Error("Player is not part of this game");
    }    // Update the game status
    await ctx.db.patch(game._id, {
      status: "finished",
      winner,
      endReason: "resignation"
    });

    return {
      success: true,
      winner
    };
  },
});

export const offerDraw = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status === "finished") {
      throw new Error("Game is already finished");
    }

    // Check if the player is part of this game
    if (playerId !== game.player1.id && playerId !== game.player2.id) {
      throw new Error("Player is not part of this game");
    }

    // Determine the opponent
    const opponentId = playerId === game.player1.id 
      ? game.player2.id 
      : game.player1.id;

    // Set the draw offer in the game state
    await ctx.db.patch(game._id, {
      drawOffer: {
        offeredBy: playerId,
        offeredTo: opponentId,
        offeredAt: Date.now()
      }
    });

    return {
      success: true
    };
  },
});

export const respondToDrawOffer = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
    accepted: v.boolean(),
  },
  handler: async (ctx, { gameId, playerId, accepted }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status === "finished") {
      throw new Error("Game is already finished");
    }

    // Check if there is a draw offer to this player
    if (!game.drawOffer || game.drawOffer.offeredTo !== playerId) {
      throw new Error("No draw offer to respond to");
    }

    if (accepted) {      // End the game as a draw
      await ctx.db.patch(game._id, {
        status: "finished",
        winner: "draw",
        endReason: "draw_agreement",
        drawOffer: undefined
      });

      return {
        success: true,
        result: "draw"
      };
    } else {
      // Remove the draw offer
      await ctx.db.patch(game._id, {
        drawOffer: undefined
      });

      return {
        success: true,
        result: "declined"
      };
    }
  },
});

export const cancelDrawOffer = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, { gameId, playerId }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    // Check if there is a draw offer from this player
    if (!game.drawOffer || game.drawOffer.offeredBy !== playerId) {
      throw new Error("No draw offer from this player to cancel");
    }

    // Remove the draw offer
    await ctx.db.patch(game._id, {
      drawOffer: undefined
    });

    return {
      success: true
    };
  },
});
