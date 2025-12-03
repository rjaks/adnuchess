import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { 
  INITIAL_ELO_RATING,
  getKFactor,
  calculateExpectedScore,
  calculateNewRating,
  GAME_RESULT_SCORES,
  isProvisionalPlayer
} from "./utils/eloConstants";

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const upsertFromSession = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        picture: args.picture ?? existing.picture,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      role: undefined, // force profile completion
      eloRating: INITIAL_ELO_RATING, // New players start at 1500
      gamesPlayed: 0, // New players have 0 completed games
      wins: 0, // New players have 0 wins
      losses: 0, // New players have 0 losses
      draws: 0, // New players have 0 draws
      elo: INITIAL_ELO_RATING, // Legacy field for backward compatibility
      picture: args.picture,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const completeProfile = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    displayName: v.optional(v.string()),
    department: v.string(),
    role: v.union(v.literal("student"), v.literal("faculty"), v.literal("alumni")),
  },
  handler: async (ctx, { userId, name, displayName, department, role }) => {
    const doc = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!doc) throw new Error("Profile not found; run upsertFromSession first.");

    const now = Date.now();
    await ctx.db.patch(doc._id, {
      name,
      displayName,
      department,
      departmentLastChanged: now,
      role,
      updatedAt: now,
    });
  },
});

export const seedTestProfiles = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rows = [
      { userId: "u_demo_1", email: "s1@gbox.adnu.edu.ph", name: "Demo Student", role: "student" as const, eloRating: 1500, gamesPlayed: 0 },
      { userId: "u_demo_2", email: "f1@gbox.adnu.edu.ph", name: "Demo Faculty", role: "faculty" as const, eloRating: 1600, gamesPlayed: 35 },
      { userId: "u_demo_3", email: "a1@gbox.adnu.edu.ph", name: "Demo Alumni",  role: "alumni"  as const, eloRating: 1400, gamesPlayed: 15 },
    ];
    for (const r of rows) {
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", r.userId))
        .unique();
      if (!existing) {
        await ctx.db.insert("profiles", { 
          ...r, 
          elo: r.eloRating, // Legacy field
          picture: undefined, 
          createdAt: now, 
          updatedAt: now 
        });
      }
    }
  },
});

/**
 * Migration: Migrate existing profiles to use new ELO fields
 * This should be run once to update all existing profiles
 */
export const migrateProfilesToNewEloFields = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const profiles = await ctx.db.query("profiles").collect();
    
    let migrated = 0;
    let skipped = 0;
    
    for (const profile of profiles) {
      // Skip if already migrated (has eloRating field set)
      if (profile.eloRating !== undefined) {
        skipped++;
        continue;
      }
      
      // Migrate: use existing elo value or default to 1500
      const eloRating = profile.elo ?? INITIAL_ELO_RATING;
      
      await ctx.db.patch(profile._id, {
        eloRating: eloRating,
        gamesPlayed: 0, // Start fresh - we don't have historical game count
        updatedAt: now,
      });
      
      migrated++;
    }
    
    return {
      totalProfiles: profiles.length,
      migrated,
      skipped,
      message: `Migration complete. Migrated ${migrated} profiles, skipped ${skipped} already migrated.`
    };
  },
});

/**
 * Update ELO ratings for both players after a game ends
 * This mutation handles all the ELO calculation and updates both player profiles
 */
export const updateEloAfterGame = mutation({
  args: {
    winnerUserId: v.optional(v.string()), // undefined for draws
    loserUserId: v.optional(v.string()), // undefined for draws
    player1UserId: v.string(), // For draws, both players needed
    player2UserId: v.string(),
    isDraw: v.boolean(),
  },
  handler: async (ctx, { winnerUserId, loserUserId, player1UserId, player2UserId, isDraw }) => {
    const now = Date.now();
    
    // Get both player profiles
    const profile1 = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", player1UserId))
      .unique();
    
    const profile2 = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", player2UserId))
      .unique();
    
    if (!profile1 || !profile2) {
      throw new Error("One or both player profiles not found");
    }
    
    // Get current ratings (use new field, fallback to legacy)
    const rating1 = profile1.eloRating ?? profile1.elo ?? INITIAL_ELO_RATING;
    const rating2 = profile2.eloRating ?? profile2.elo ?? INITIAL_ELO_RATING;
    
    // Get games played
    const games1 = profile1.gamesPlayed ?? 0;
    const games2 = profile2.gamesPlayed ?? 0;
    
    // Calculate K-factors based on games played
    const kFactor1 = getKFactor(games1);
    const kFactor2 = getKFactor(games2);
    
    // Calculate expected scores
    const expected1 = calculateExpectedScore(rating1, rating2);
    const expected2 = calculateExpectedScore(rating2, rating1);
    
    let actualScore1: number;
    let actualScore2: number;
    
    if (isDraw) {
      actualScore1 = GAME_RESULT_SCORES.DRAW;
      actualScore2 = GAME_RESULT_SCORES.DRAW;
    } else {
      // Determine actual scores based on winner
      actualScore1 = winnerUserId === player1UserId ? GAME_RESULT_SCORES.WIN : GAME_RESULT_SCORES.LOSS;
      actualScore2 = winnerUserId === player2UserId ? GAME_RESULT_SCORES.WIN : GAME_RESULT_SCORES.LOSS;
    }
    
    // Calculate new ratings
    const newRating1 = calculateNewRating(rating1, expected1, actualScore1, kFactor1);
    const newRating2 = calculateNewRating(rating2, expected2, actualScore2, kFactor2);
    
    // Update player 1
    await ctx.db.patch(profile1._id, {
      eloRating: newRating1,
      elo: newRating1, // Keep legacy field in sync
      gamesPlayed: games1 + 1,
      updatedAt: now,
    });
    
    // Update player 2
    await ctx.db.patch(profile2._id, {
      eloRating: newRating2,
      elo: newRating2, // Keep legacy field in sync
      gamesPlayed: games2 + 1,
      updatedAt: now,
    });
    
    // Return the rating changes for display
    return {
      player1: {
        odRating: rating1,
        newRating: newRating1,
        change: newRating1 - rating1,
        gamesPlayed: games1 + 1,
        isProvisional: isProvisionalPlayer(games1 + 1),
        kFactorUsed: kFactor1,
      },
      player2: {
        oldRating: rating2,
        newRating: newRating2,
        change: newRating2 - rating2,
        gamesPlayed: games2 + 1,
        isProvisional: isProvisionalPlayer(games2 + 1),
        kFactorUsed: kFactor2,
      },
    };
  },
});

/**
 * Get ELO statistics for a player
 */
export const getEloStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile) {
      return null;
    }
    
    const eloRating = profile.eloRating ?? profile.elo ?? INITIAL_ELO_RATING;
    const gamesPlayed = profile.gamesPlayed ?? 0;
    const wins = profile.wins ?? 0;
    const losses = profile.losses ?? 0;
    const draws = profile.draws ?? 0;
    const isProvisional = isProvisionalPlayer(gamesPlayed);
    const kFactor = getKFactor(gamesPlayed);
    const gamesUntilEstablished = isProvisional ? 30 - gamesPlayed : 0;
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
    
    return {
      eloRating,
      gamesPlayed,
      wins,
      losses,
      draws,
      winRate,
      isProvisional,
      kFactor,
      gamesUntilEstablished,
    };
  },
});

/**
 * Get full player stats including wins, losses, draws
 */
export const getPlayerStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile) {
      return null;
    }
    
    const gamesPlayed = profile.gamesPlayed ?? 0;
    const wins = profile.wins ?? 0;
    const losses = profile.losses ?? 0;
    const draws = profile.draws ?? 0;
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
    
    return {
      gamesPlayed,
      wins,
      losses,
      draws,
      winRate,
    };
  },
});

export const updateDisplayName = mutation({
  args: {
    userId: v.string(),
    displayName: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { userId, displayName }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    // If displayName is null or empty string, remove the displayName field
    const updateData = {
      displayName: displayName && displayName.trim() !== "" ? displayName.trim() : undefined,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(profile._id, updateData);
    return { success: true };
  },
});

export const updateDepartment = mutation({
  args: {
    userId: v.string(),
    department: v.union(v.string(), v.null()),
    skipCooldownCheck: v.optional(v.boolean()), // For admin override if needed
  },
  handler: async (ctx, { userId, department, skipCooldownCheck = false }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const now = Date.now();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    
    // Check if user is trying to change to a different department
    const normalizedNewDept = department && department.trim() !== "" ? department.trim() : undefined;
    const isDepartmentChanging = profile.department !== normalizedNewDept;
    
    // Check cooldown period if department is actually changing
    if (isDepartmentChanging && !skipCooldownCheck && profile.departmentLastChanged) {
      const timeSinceLastChange = now - profile.departmentLastChanged;
      const remainingCooldown = oneYearInMs - timeSinceLastChange;
      
      if (remainingCooldown > 0) {
        // Calculate remaining days for user-friendly error
        const remainingDays = Math.ceil(remainingCooldown / (24 * 60 * 60 * 1000));
        throw new Error(`Department can only be changed once per year. You can change your department again in ${remainingDays} days.`);
      }
    }

    // Prepare update data
    const updateData: any = {
      department: normalizedNewDept,
      updatedAt: now,
    };

    // Only update departmentLastChanged if department is actually changing
    if (isDepartmentChanging) {
      updateData.departmentLastChanged = now;
    }

    await ctx.db.patch(profile._id, updateData);
    return { 
      success: true,
      departmentChanged: isDepartmentChanging,
      nextChangeAvailable: isDepartmentChanging ? now + oneYearInMs : (profile.departmentLastChanged || 0) + oneYearInMs
    };
  },
});

export const checkDepartmentCooldown = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const now = Date.now();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    
    if (!profile.departmentLastChanged) {
      return { 
        canChange: true,
        remainingDays: 0,
        nextChangeDate: null
      };
    }

    const timeSinceLastChange = now - profile.departmentLastChanged;
    const remainingCooldown = oneYearInMs - timeSinceLastChange;
    
    if (remainingCooldown <= 0) {
      return { 
        canChange: true,
        remainingDays: 0,
        nextChangeDate: null
      };
    }

    const remainingDays = Math.ceil(remainingCooldown / (24 * 60 * 60 * 1000));
    const nextChangeDate = new Date(profile.departmentLastChanged + oneYearInMs);
    
    return { 
      canChange: false,
      remainingDays,
      nextChangeDate: nextChangeDate.toLocaleDateString()
    };
  },
});

export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    // Get all profiles and sort by ELO rating in descending order
    const profiles = await ctx.db.query("profiles").collect();
    return profiles.sort((a, b) => (b.eloRating ?? b.elo ?? INITIAL_ELO_RATING) - (a.eloRating ?? a.elo ?? INITIAL_ELO_RATING));
  },
});

export const isProfileComplete = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    
    // Profile is complete if it has both role and department
    return {
      isComplete: !!(profile?.role && profile?.department),
      profile: profile,
      missingFields: {
        role: !profile?.role,
        department: !profile?.department
      }
    };
  },
});

/**
 * Migration: Populate wins/losses/draws stats from game history for all profiles
 * This should be run once to update all existing profiles with their game stats
 */
export const migrateProfileStats = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const profiles = await ctx.db.query("profiles").collect();
    const games = await ctx.db.query("games").collect();
    
    // Filter only finished games
    const finishedGames = games.filter(game => game.status === "finished");
    
    let migrated = 0;
    let skipped = 0;
    
    for (const profile of profiles) {
      // Skip if already has stats populated (wins, losses, or draws > 0)
      if ((profile.wins ?? 0) > 0 || (profile.losses ?? 0) > 0 || (profile.draws ?? 0) > 0) {
        skipped++;
        continue;
      }
      
      // Calculate stats from game history
      let wins = 0;
      let losses = 0;
      let draws = 0;
      
      for (const game of finishedGames) {
        const isPlayer1 = game.player1.id === profile.userId;
        const isPlayer2 = game.player2.id === profile.userId;
        
        if (!isPlayer1 && !isPlayer2) continue;
        
        // Determine player's color
        const playerColor = isPlayer1 ? game.player1.color : game.player2.color;
        
        // Check game result
        if (game.winner === "draw") {
          draws++;
        } else if (game.winner === profile.userId) {
          wins++;
        } else if (game.winner && game.winner !== profile.userId) {
          // Winner is the other player
          losses++;
        } else if (game.timeoutWinner) {
          // Check timeout winner
          if (game.timeoutWinner === playerColor) {
            wins++;
          } else {
            losses++;
          }
        }
      }
      
      const gamesPlayed = wins + losses + draws;
      
      // Update profile with calculated stats
      await ctx.db.patch(profile._id, {
        wins,
        losses,
        draws,
        gamesPlayed: Math.max(profile.gamesPlayed ?? 0, gamesPlayed),
        updatedAt: now,
      });
      
      migrated++;
    }
    
    return {
      totalProfiles: profiles.length,
      totalFinishedGames: finishedGames.length,
      migrated,
      skipped,
      message: `Migration complete. Migrated ${migrated} profiles, skipped ${skipped} already populated.`
    };
  },
});

/**
 * Reset stats for a specific user (for testing/admin purposes)
 */
export const resetUserStats = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    await ctx.db.patch(profile._id, {
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
