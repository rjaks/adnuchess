import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  INITIAL_ELO_RATING,
  getKFactor,
  calculateNewElo,
  ACTUAL_SCORE,
  isProvisionalPlayer,
  type ActualScore,
} from "./utils/eloConstants";

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
      endReason: "resignation",
      result: "resignation"
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
    }    if (accepted) {
      // End the game as a draw
      await ctx.db.patch(game._id, {
        status: "finished",
        winner: "draw",
        endReason: "draw_agreement",
        result: "agreement",
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

/**
 * Valid final game statuses that indicate a completed game
 */
const FINAL_GAME_STATUSES = ["finished"] as const;

/**
 * Atomic mutation to update ELO ratings for both players after a game concludes.
 * 
 * This mutation:
 * 1. Verifies the game is in a final state
 * 2. Checks that ratings haven't already been updated (using ratingsUpdated flag)
 * 3. Fetches both player profiles
 * 4. Calculates new ELO ratings using the proper K-factors
 * 5. Atomically updates both player profiles AND sets the ratingsUpdated flag
 * 
 * @param gameId - The unique identifier of the finished game
 * @returns Object containing the rating changes for both players
 * @throws Error if game not found, not finished, or ratings already updated
 */
export const updateEloAfterGame = mutation({
  args: {
    gameId: v.string(),
  },
  handler: async (ctx, { gameId }) => {
    // Step 1: Fetch the game document
    const game = await ctx.db
      .query("games")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .first();

    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // Step 2: Verify game is in a final state
    if (game.status !== "finished") {
      throw new Error(`Game is not finished. Current status: ${game.status}`);
    }

    // Step 3: Check if ratings have already been updated (idempotency check)
    if (game.ratingsUpdated === true) {
      console.log(`[ELO] Ratings already updated for game ${gameId}, skipping.`);
      return {
        alreadyUpdated: true,
        message: "Ratings have already been updated for this game",
      };
    }

    // Step 4: Identify white and black players
    const whitePlayer = game.player1.color === "white" ? game.player1 : game.player2;
    const blackPlayer = game.player1.color === "black" ? game.player1 : game.player2;

    // Step 5: Fetch both player profiles
    const whiteProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", whitePlayer.id))
      .unique();

    const blackProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", blackPlayer.id))
      .unique();

    if (!whiteProfile || !blackProfile) {
      throw new Error(
        `Player profile not found. White: ${whiteProfile ? "found" : "missing"}, Black: ${blackProfile ? "found" : "missing"}`
      );
    }

    // Step 6: Get current ratings (use new field, fallback to legacy, then default)
    const whiteRating = whiteProfile.eloRating ?? whiteProfile.elo ?? INITIAL_ELO_RATING;
    const blackRating = blackProfile.eloRating ?? blackProfile.elo ?? INITIAL_ELO_RATING;    // Step 7: Get games played for K-factor calculation
    const whiteGamesPlayed = whiteProfile.gamesPlayed ?? 0;
    const blackGamesPlayed = blackProfile.gamesPlayed ?? 0;
    
    // Step 7.1: Get current win/loss/draw stats
    const whiteWins = whiteProfile.wins ?? 0;
    const whiteLosses = whiteProfile.losses ?? 0;
    const whiteDraws = whiteProfile.draws ?? 0;
    const blackWins = blackProfile.wins ?? 0;
    const blackLosses = blackProfile.losses ?? 0;
    const blackDraws = blackProfile.draws ?? 0;

    // Step 8: Calculate K-factors based on games played
    const whiteKFactor = getKFactor(whiteGamesPlayed);
    const blackKFactor = getKFactor(blackGamesPlayed);

    // Step 9: Determine actual scores based on game result
    let whiteScore: ActualScore;
    let blackScore: ActualScore;

    if (game.winner === "draw" || game.winner === undefined) {
      // Draw
      whiteScore = ACTUAL_SCORE.DRAW;
      blackScore = ACTUAL_SCORE.DRAW;
    } else if (game.winner === whitePlayer.id) {
      // White wins
      whiteScore = ACTUAL_SCORE.WIN;
      blackScore = ACTUAL_SCORE.LOSS;
    } else if (game.winner === blackPlayer.id) {
      // Black wins
      whiteScore = ACTUAL_SCORE.LOSS;
      blackScore = ACTUAL_SCORE.WIN;
    } else {
      // Fallback: check by timeoutWinner if available
      if (game.timeoutWinner === "white") {
        whiteScore = ACTUAL_SCORE.WIN;
        blackScore = ACTUAL_SCORE.LOSS;
      } else if (game.timeoutWinner === "black") {
        whiteScore = ACTUAL_SCORE.LOSS;
        blackScore = ACTUAL_SCORE.WIN;
      } else {
        throw new Error(`Unable to determine game result. Winner: ${game.winner}`);
      }
    }    // Step 10: Calculate new ELO ratings using the pure function
    const newWhiteRating = calculateNewElo(whiteRating, blackRating, whiteScore, whiteKFactor);
    const newBlackRating = calculateNewElo(blackRating, whiteRating, blackScore, blackKFactor);

    const now = Date.now();
    
    // Step 10.1: Calculate new win/loss/draw stats
    const isDraw = whiteScore === ACTUAL_SCORE.DRAW;
    const whiteWon = whiteScore === ACTUAL_SCORE.WIN;
    const blackWon = blackScore === ACTUAL_SCORE.WIN;

    // Step 11: ATOMIC UPDATE - Update both player profiles
    // Convex mutations are transactional, so these updates are atomic
    await ctx.db.patch(whiteProfile._id, {
      eloRating: newWhiteRating,
      elo: newWhiteRating, // Keep legacy field in sync
      gamesPlayed: whiteGamesPlayed + 1,
      wins: whiteWins + (whiteWon ? 1 : 0),
      losses: whiteLosses + (blackWon ? 1 : 0),
      draws: whiteDraws + (isDraw ? 1 : 0),
      updatedAt: now,
    });

    await ctx.db.patch(blackProfile._id, {
      eloRating: newBlackRating,
      elo: newBlackRating, // Keep legacy field in sync
      gamesPlayed: blackGamesPlayed + 1,
      wins: blackWins + (blackWon ? 1 : 0),
      losses: blackLosses + (whiteWon ? 1 : 0),
      draws: blackDraws + (isDraw ? 1 : 0),
      updatedAt: now,
    });

    // Step 12: Mark the game as having ratings updated (idempotency flag)
    await ctx.db.patch(game._id, {
      ratingsUpdated: true,
    });

    console.log(
      `[ELO] Updated ratings for game ${gameId}: ` +
      `White (${whitePlayer.name}): ${whiteRating} -> ${newWhiteRating} (${whiteScore === 1 ? "WIN" : whiteScore === 0 ? "LOSS" : "DRAW"}), ` +
      `Black (${blackPlayer.name}): ${blackRating} -> ${newBlackRating} (${blackScore === 1 ? "WIN" : blackScore === 0 ? "LOSS" : "DRAW"})`
    );

    // Step 13: Return the rating changes for display
    return {
      alreadyUpdated: false,
      white: {
        playerId: whitePlayer.id,
        playerName: whitePlayer.name,
        oldRating: whiteRating,
        newRating: newWhiteRating,
        change: newWhiteRating - whiteRating,
        gamesPlayed: whiteGamesPlayed + 1,
        isProvisional: isProvisionalPlayer(whiteGamesPlayed + 1),
        kFactorUsed: whiteKFactor,
        result: whiteScore === 1 ? "win" : whiteScore === 0 ? "loss" : "draw",
      },
      black: {
        playerId: blackPlayer.id,
        playerName: blackPlayer.name,
        oldRating: blackRating,
        newRating: newBlackRating,
        change: newBlackRating - blackRating,
        gamesPlayed: blackGamesPlayed + 1,
        isProvisional: isProvisionalPlayer(blackGamesPlayed + 1),
        kFactorUsed: blackKFactor,
        result: blackScore === 1 ? "win" : blackScore === 0 ? "loss" : "draw",
      },
    };
  },
});
