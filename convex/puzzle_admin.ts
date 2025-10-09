import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all puzzles (admin only)
export const getAllPuzzles = query({
  args: {},
  handler: async (ctx) => {
    const puzzles = await ctx.db.query("puzzles").collect();
    
    // Get submission counts for each puzzle
    const puzzlesWithStats = await Promise.all(
      puzzles.map(async (puzzle) => {
        const submissions = await ctx.db
          .query("puzzleSubmissions")
          .withIndex("by_puzzle", (q) => q.eq("puzzleId", puzzle._id))
          .collect();
        
        return {
          ...puzzle,
          submissionCount: submissions.length,
        };
      })
    );
    
    return puzzlesWithStats.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get puzzle statistics (admin only)
export const getPuzzleStats = query({
  args: {},
  handler: async (ctx) => {
    const puzzles = await ctx.db.query("puzzles").collect();
    const submissions = await ctx.db.query("puzzleSubmissions").collect();
    
    const totalPuzzles = puzzles.length;
    const activePuzzles = puzzles.filter(p => p.isActive).length;
    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter(s => s.isCorrect).length;
    const successRate = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;
    
    return {
      totalPuzzles,
      activePuzzles,
      totalSubmissions,
      successRate,
    };
  },
});

// Create a new puzzle (admin only)
export const createPuzzle = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    fen: v.string(),
    solution: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert")
    ),
    theme: v.optional(v.string()),
    points: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // In a real app, you'd verify admin permissions here
    // For now, we'll assume the caller is authorized
    
    const now = Date.now();
    
    // Create a dummy profile ID for createdBy
    // In real implementation, get this from the authenticated user
    const adminProfile = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("isAdmin"), true))
      .first();
    
    if (!adminProfile) {
      throw new Error("Admin profile not found");
    }
    
    const puzzleId = await ctx.db.insert("puzzles", {
      title: args.title,
      description: args.description,
      fen: args.fen,
      solution: args.solution,
      difficulty: args.difficulty,
      theme: args.theme,
      points: args.points,
      createdBy: adminProfile._id,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
    
    return puzzleId;
  },
});

// Update an existing puzzle (admin only)
export const updatePuzzle = mutation({
  args: {
    puzzleId: v.id("puzzles"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    fen: v.optional(v.string()),
    solution: v.optional(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("expert")
      )
    ),
    theme: v.optional(v.string()),
    points: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { puzzleId, ...updates } = args;
    
    const existing = await ctx.db.get(puzzleId);
    if (!existing) {
      throw new Error("Puzzle not found");
    }
    
    await ctx.db.patch(puzzleId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return puzzleId;
  },
});

// Delete a puzzle (admin only)
export const deletePuzzle = mutation({
  args: {
    puzzleId: v.id("puzzles"),
  },
  handler: async (ctx, args) => {
    const puzzle = await ctx.db.get(args.puzzleId);
    if (!puzzle) {
      throw new Error("Puzzle not found");
    }
    
    // Delete all submissions for this puzzle first
    const submissions = await ctx.db
      .query("puzzleSubmissions")
      .withIndex("by_puzzle", (q) => q.eq("puzzleId", args.puzzleId))
      .collect();
    
    for (const submission of submissions) {
      await ctx.db.delete(submission._id);
    }
    
    // Delete the puzzle
    await ctx.db.delete(args.puzzleId);
    
    return args.puzzleId;
  },
});

// Get active puzzles for players
export const getActivePuzzles = query({
  args: {
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("expert")
      )
    ),
    theme: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("puzzles")
      .withIndex("by_isActive", (q) => q.eq("isActive", true));
    
    if (args.difficulty) {
      query = query.filter((q) => q.eq(q.field("difficulty"), args.difficulty));
    }
    
    if (args.theme) {
      query = query.filter((q) => q.eq(q.field("theme"), args.theme));
    }
    
    const puzzles = await query.collect();
    
    // Shuffle and limit results
    const shuffled = puzzles.sort(() => Math.random() - 0.5);
    const limited = args.limit ? shuffled.slice(0, args.limit) : shuffled;
    
    return limited;
  },
});

// Submit puzzle solution
export const submitSolution = mutation({
  args: {
    puzzleId: v.id("puzzles"),
    userId: v.id("profiles"),
    solution: v.string(),
    timeSpent: v.number(),
  },
  handler: async (ctx, args) => {
    const puzzle = await ctx.db.get(args.puzzleId);
    if (!puzzle || !puzzle.isActive) {
      throw new Error("Puzzle not found or inactive");
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if user already submitted this puzzle
    const existingSubmission = await ctx.db
      .query("puzzleSubmissions")
      .withIndex("by_puzzle_user", (q) => 
        q.eq("puzzleId", args.puzzleId).eq("userId", args.userId)
      )
      .first();
    
    if (existingSubmission) {
      throw new Error("You have already submitted a solution for this puzzle");
    }
    
    // Simple solution checking (normalize whitespace and case)
    const normalizeMove = (move: string) => 
      move.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const userSolution = normalizeMove(args.solution);
    const correctSolution = normalizeMove(puzzle.solution);
    const isCorrect = userSolution === correctSolution;
    
    const pointsEarned = isCorrect ? puzzle.points : 0;
    
    // Create submission record
    const submissionId = await ctx.db.insert("puzzleSubmissions", {
      puzzleId: args.puzzleId,
      userId: args.userId,
      solution: args.solution,
      isCorrect,
      timeSpent: args.timeSpent,
      pointsEarned,
      submittedAt: Date.now(),
    });
    
    // Update user's ELO/points if correct
    if (isCorrect) {
      await ctx.db.patch(args.userId, {
        elo: user.elo + pointsEarned,
        updatedAt: Date.now(),
      });
    }
    
    return {
      submissionId,
      isCorrect,
      pointsEarned,
      correctSolution: isCorrect ? undefined : puzzle.solution,
    };
  },
});

// Get user's puzzle submissions
export const getUserSubmissions = query({
  args: {
    userId: v.id("profiles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("puzzleSubmissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);
    
    // Get puzzle details for each submission
    const submissionsWithPuzzles = await Promise.all(
      submissions.map(async (submission) => {
        const puzzle = await ctx.db.get(submission.puzzleId);
        return {
          ...submission,
          puzzle: puzzle ? {
            title: puzzle.title,
            difficulty: puzzle.difficulty,
            theme: puzzle.theme,
            points: puzzle.points,
          } : null,
        };
      })
    );
    
    return submissionsWithPuzzles;
  },
});

// Get puzzle leaderboard
export const getPuzzleLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const submissions = await ctx.db.query("puzzleSubmissions").collect();
    
    // Group by user and calculate stats
    const userStats = new Map();
    
    for (const submission of submissions) {
      const userId = submission.userId;
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          userId,
          totalSubmissions: 0,
          correctSubmissions: 0,
          totalPoints: 0,
          averageTime: 0,
          totalTime: 0,
        });
      }
      
      const stats = userStats.get(userId);
      stats.totalSubmissions++;
      stats.totalTime += submission.timeSpent;
      
      if (submission.isCorrect) {
        stats.correctSubmissions++;
        stats.totalPoints += submission.pointsEarned;
      }
    }
    
    // Calculate averages and get user details
    const leaderboard = await Promise.all(
      Array.from(userStats.values()).map(async (stats) => {
        const user = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("_id"), stats.userId))
          .first();
        
        return {
          userId: stats.userId,
          userName: user?.name || "Unknown",
          displayName: user?.displayName || user?.name || "Unknown",
          totalSubmissions: stats.totalSubmissions,
          correctSubmissions: stats.correctSubmissions,
          successRate: Math.round((stats.correctSubmissions / stats.totalSubmissions) * 100),
          totalPoints: stats.totalPoints,
          averageTime: Math.round(stats.totalTime / stats.totalSubmissions),
        };
      })
    );
    
    // Sort by total points, then by success rate
    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.successRate - a.successRate;
    });
    
    return leaderboard.slice(0, args.limit || 20);
  },
});