import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new tournament
export const createTournament = mutation({
  args: {
    name: v.string(),
    maxPlayers: v.number(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const tournamentId = await ctx.db.insert("tournaments", {
      name: args.name,
      status: "waiting",
      maxPlayers: args.maxPlayers,
      currentPlayers: 0,
      players: [],
      rounds: [],
      currentRound: 0,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    return tournamentId;
  },
});

// Join a tournament
export const joinTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
    name: v.string(),
    elo: v.number(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.status !== "waiting" && tournament.status !== "ready") {
      throw new Error("Tournament already started or completed");
    }

    if (tournament.currentPlayers >= tournament.maxPlayers) {
      throw new Error("Tournament is full");
    }

    // Check if user already joined
    const alreadyJoined = tournament.players.some(p => p.userId === args.userId);
    if (alreadyJoined) {
      throw new Error("Already joined this tournament");
    }

    const newPlayer = {
      userId: args.userId,
      name: args.name,
      elo: args.elo,
      joinedAt: Date.now(),
      status: "active" as const,
    };

    const updatedPlayers = [...tournament.players, newPlayer];
    const newPlayerCount = tournament.currentPlayers + 1;

    await ctx.db.patch(args.tournamentId, {
      players: updatedPlayers,
      currentPlayers: newPlayerCount,
      status: newPlayerCount >= tournament.maxPlayers ? "ready" : "waiting",
    });

    return { success: true };
  },
});

// Leave a tournament (only if not started)
export const leaveTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.status !== "waiting" && tournament.status !== "ready") {
      throw new Error("Cannot leave after tournament has started");
    }

    const updatedPlayers = tournament.players.filter(p => p.userId !== args.userId);

    await ctx.db.patch(args.tournamentId, {
      players: updatedPlayers,
      currentPlayers: updatedPlayers.length,
      status: "waiting",
    });

    return { success: true };
  },
});

// Start tournament and generate bracket
export const startTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    seededPlayers: v.optional(v.array(v.object({
      userId: v.string(),
      name: v.string(),
      elo: v.number(),
      joinedAt: v.number(),
      status: v.union(v.literal("active"), v.literal("eliminated"), v.literal("winner")),
      position: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.status !== "ready" && tournament.status !== "waiting") {
      throw new Error("Tournament not ready to start");
    }

    if (tournament.players.length < 2) {
      throw new Error("Need at least 2 players to start tournament");
    }

    // Use seeded players if provided, otherwise shuffle randomly
    const orderedPlayers = args.seededPlayers && args.seededPlayers.length === tournament.players.length
      ? args.seededPlayers
      : [...tournament.players].sort(() => Math.random() - 0.5);

    // Generate first round matches
    const firstRoundMatches = [];
    for (let i = 0; i < orderedPlayers.length; i += 2) {
      const player1 = orderedPlayers[i];
      const player2 = orderedPlayers[i + 1];

      const matchId = `${args.tournamentId}_r1_m${i / 2}`;
      
      firstRoundMatches.push({
        matchId,
        player1Id: player1.userId,
        player2Id: player2?.userId,
        status: player2 ? ("pending" as const) : ("completed" as const),
        winnerId: player2 ? undefined : player1.userId,
      });

      // Create match entry
      if (player2) {
        await ctx.db.insert("tournamentMatches", {
          tournamentId: args.tournamentId,
          roundNumber: 1,
          matchIndex: i / 2,
          player1: {
            userId: player1.userId,
            name: player1.name,
            color: "white",
          },
          player2: {
            userId: player2.userId,
            name: player2.name,
            color: "black",
          },
          status: "pending",
          createdAt: Date.now(),
        });
      }
    }

    const rounds = [{
      roundNumber: 1,
      matches: firstRoundMatches,
      status: "active" as const,
    }];

    await ctx.db.patch(args.tournamentId, {
      status: "active",
      rounds,
      currentRound: 1,
      startedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get tournament details
export const getTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tournamentId);
  },
});

// List all active tournaments
export const listActiveTournaments = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tournaments")
      .order("desc")
      .take(50);
  },
});

// Delete a tournament (creator only)
export const deleteTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    if (tournament.createdBy !== args.userId) {
      throw new Error("Only the creator can delete this tournament");
    }

    if (tournament.status === "active") {
      throw new Error("Cannot delete an active tournament");
    }

    await ctx.db.delete(args.tournamentId);
    return { success: true };
  },
});

// List user's tournaments
export const myTournaments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const allTournaments = await ctx.db
      .query("tournaments")
      .order("desc")
      .take(100);

    return allTournaments.filter(t => 
      t.players.some(p => p.userId === args.userId)
    );
  },
});

// Update match result
export const updateMatchResult = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    roundNumber: v.number(),
    matchIndex: v.number(),
    winnerId: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const round = tournament.rounds[args.roundNumber - 1];
    if (!round) throw new Error("Round not found");

    // Update match result
    round.matches[args.matchIndex].winnerId = args.winnerId;
    round.matches[args.matchIndex].status = "completed";

    // Check if all matches in round are completed
    const allMatchesCompleted = round.matches.every(m => m.status === "completed");

    if (allMatchesCompleted) {
      round.status = "completed";

      // Check if this was the final round
      const isFinalRound = round.matches.length === 1;
      
      if (isFinalRound) {
        // Tournament complete
        await ctx.db.patch(args.tournamentId, {
          rounds: tournament.rounds,
          status: "completed",
          winnerId: args.winnerId,
          completedAt: Date.now(),
        });
      } else {
        // Generate next round
        const winners = round.matches
          .filter(m => m.winnerId)
          .map(m => m.winnerId!);

        const nextRoundMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
          const player1Id = winners[i];
          const player2Id = winners[i + 1];

          nextRoundMatches.push({
            matchId: `${args.tournamentId}_r${args.roundNumber + 1}_m${i / 2}`,
            player1Id,
            player2Id,
            status: "pending" as const,
          });
        }

        tournament.rounds.push({
          roundNumber: args.roundNumber + 1,
          matches: nextRoundMatches,
          status: "pending" as const,
        });

        await ctx.db.patch(args.tournamentId, {
          rounds: tournament.rounds,
          currentRound: args.roundNumber + 1,
        });
      }
    } else {
      await ctx.db.patch(args.tournamentId, {
        rounds: tournament.rounds,
      });
    }

    return { success: true };
  },
});

// Get tournament matches for a specific round
export const getTournamentMatches = query({
  args: {
    tournamentId: v.id("tournaments"),
    roundNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tournamentMatches")
      .withIndex("by_round", q => 
        q.eq("tournamentId", args.tournamentId).eq("roundNumber", args.roundNumber)
      )
      .collect();
  },
});
