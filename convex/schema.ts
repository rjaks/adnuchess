import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    displayName: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("student"), v.literal("faculty"), v.literal("alumni"))
    ),
    department: v.optional(v.string()),
    departmentLastChanged: v.optional(v.number()),
    
    // ELO Rating System Fields (optional for backward compatibility with existing data)
    eloRating: v.optional(v.number()), // Current ELO rating (default: 1500 for new players)
    gamesPlayed: v.optional(v.number()), // Total number of completed games
    
    // Game Statistics
    wins: v.optional(v.number()), // Total wins
    losses: v.optional(v.number()), // Total losses
    draws: v.optional(v.number()), // Total draws
    
    // Legacy field - keeping for backward compatibility
    elo: v.optional(v.number()),
    
    picture: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Add admin flag for PuzzleNida access
    isAdmin: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  games: defineTable({
    gameId: v.string(),
    fen: v.string(),
    lastMove: v.optional(v.string()),
    lastMoveTime: v.number(),
    currentTurn: v.union(v.literal("white"), v.literal("black")),
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
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    winner: v.optional(v.string()),
    endReason: v.optional(v.string()),
    result: v.optional(v.union(
      v.literal("checkmate"),
      v.literal("stalemate"),
      v.literal("resignation"),
      v.literal("timeout"),
      v.literal("agreement"),
      v.literal("abandonment")
    )),
    drawOffer: v.optional(v.object({
      offeredBy: v.string(),
      offeredTo: v.string(),
      offeredAt: v.number()
    })),
    gameMode: v.string(),
    createdAt: v.number(),
    moveHistory: v.array(v.string()),
    
    // Timer fields (optional for backward compatibility)
    timeControl: v.optional(v.object({
      baseTimeMs: v.number(),
      incrementMs: v.number(),
      type: v.union(
        v.literal("none"),
        v.literal("standard"),
        v.literal("increment"),
        v.literal("delay")
      )
    })),
    whiteTimeMs: v.optional(v.number()),
    blackTimeMs: v.optional(v.number()),
    lastMoveTimestamp: v.optional(v.number()),
    gameStartTimestamp: v.optional(v.number()),
    timeoutWinner: v.optional(v.union(v.literal("white"), v.literal("black"))),
    
    // ELO rating update flag (ensures ratings are updated exactly once)
    ratingsUpdated: v.optional(v.boolean()),
  })
    .index("by_gameId", ["gameId"])
    .index("by_player", ["player1.id"])
    .index("by_player2", ["player2.id"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // PuzzleNida system tables
  puzzles: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    fen: v.string(), // Chess position in FEN notation
    solution: v.string(), // Expected move sequence in PGN
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert")
    ),
    theme: v.optional(v.string()), // e.g., "mate_in_2", "fork", "pin"
    points: v.number(), // Points awarded for solving
    createdBy: v.id("profiles"), // Admin who created the puzzle
    isActive: v.boolean(), // Whether puzzle is available for solving
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_difficulty", ["difficulty"])
    .index("by_theme", ["theme"])
    .index("by_isActive", ["isActive"])
    .index("by_createdBy", ["createdBy"]),

  puzzleSubmissions: defineTable({
    puzzleId: v.id("puzzles"),
    userId: v.id("profiles"),
    solution: v.string(), // User's submitted move sequence
    isCorrect: v.boolean(),
    timeSpent: v.number(), // Time in milliseconds
    pointsEarned: v.number(),
    submittedAt: v.number(),
  })
    .index("by_puzzle", ["puzzleId"])
    .index("by_user", ["userId"])
    .index("by_puzzle_user", ["puzzleId", "userId"])
    .index("by_submittedAt", ["submittedAt"]),

  // QuizMania Tables
  quizQuestions: defineTable({
    question: v.string(),
    category: v.union(
      v.literal("openings"),
      v.literal("endgames"), 
      v.literal("tactics"),
      v.literal("history"),
      v.literal("rules"),
      v.literal("famous-games"),
      v.literal("theory")
    ),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    options: v.array(v.string()), // Multiple choice options
    correctAnswer: v.number(), // Index of correct option (0-based)
    explanation: v.optional(v.string()),
    timeLimit: v.number(), // Seconds allowed to answer
    points: v.number(), // Points awarded for correct answer
    createdBy: v.string(), // Admin who created the question
    createdAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_difficulty", ["difficulty"])
    .index("by_category_difficulty", ["category", "difficulty"])
    .index("by_isActive", ["isActive"]),

  quizSessions: defineTable({
    userId: v.string(),
    gameMode: v.union(v.literal("practice"), v.literal("timed"), v.literal("challenge")),
    category: v.optional(v.string()), // Specific category or "mixed"
    difficulty: v.optional(v.string()), // Specific difficulty or "mixed"
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("abandoned")),
    currentQuestionIndex: v.number(),
    questions: v.array(v.id("quizQuestions")), // Array of question IDs
    answers: v.array(v.object({
      questionId: v.id("quizQuestions"),
      userAnswer: v.optional(v.number()), // User's selected option index (in ORIGINAL order)
      correctAnswer: v.optional(v.number()), // Index of the correct answer (in ORIGINAL order)
      optionOrder: v.optional(v.array(v.number())), // Shuffled order shown to user [2,0,3,1] means option 2 was shown first
      isCorrect: v.boolean(),
      timeSpent: v.number(), // Milliseconds
      pointsEarned: v.number(),
    })),
    totalScore: v.number(),
    totalQuestions: v.number(),
    correctAnswers: v.number(),
    timeRemaining: v.optional(v.number()), // For timed modes
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_gameMode", ["gameMode"]),

  quizLeaderboard: defineTable({
    userId: v.string(),
    category: v.string(),
    difficulty: v.string(),
    bestScore: v.number(),
    bestAccuracy: v.number(), // Percentage
    totalQuestions: v.number(),
    totalCorrect: v.number(),
    averageTime: v.number(), // Average seconds per question
    gamesPlayed: v.number(),
    lastPlayed: v.number(),
    rank: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_category", ["category"])
    .index("by_category_difficulty", ["category", "difficulty"])
    .index("by_bestScore", ["bestScore"])
    .index("by_bestAccuracy", ["bestAccuracy"]),

  // Battle Royale Tournament Tables
  tournaments: defineTable({
    name: v.string(),
    status: v.union(
      v.literal("waiting"), // Waiting for players to join
      v.literal("ready"), // Enough players, ready to start
      v.literal("active"), // Tournament in progress
      v.literal("completed") // Tournament finished
    ),
    maxPlayers: v.number(), // e.g., 16, 32 for bracket sizes
    currentPlayers: v.number(),
    players: v.array(v.object({
      userId: v.string(),
      name: v.string(),
      elo: v.number(),
      joinedAt: v.number(),
      status: v.union(
        v.literal("active"), // Still in tournament
        v.literal("eliminated"), // Lost and out
        v.literal("winner") // Won the tournament
      ),
      position: v.optional(v.number()), // Final ranking
    })),
    rounds: v.array(v.object({
      roundNumber: v.number(),
      matches: v.array(v.object({
        matchId: v.string(),
        player1Id: v.string(),
        player2Id: v.optional(v.string()), // Optional for byes
        gameId: v.optional(v.id("games")),
        winnerId: v.optional(v.string()),
        status: v.union(
          v.literal("pending"), // Not started yet
          v.literal("active"), // Game in progress
          v.literal("completed") // Game finished
        ),
      })),
      status: v.union(
        v.literal("pending"),
        v.literal("active"),
        v.literal("completed")
      ),
    })),
    currentRound: v.number(),
    winnerId: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  tournamentMatches: defineTable({
    tournamentId: v.id("tournaments"),
    roundNumber: v.number(),
    matchIndex: v.number(),
    player1: v.object({
      userId: v.string(),
      name: v.string(),
      color: v.union(v.literal("white"), v.literal("black"))
    }),
    player2: v.optional(v.object({
      userId: v.string(),
      name: v.string(),
      color: v.union(v.literal("white"), v.literal("black"))
    })),
    gameId: v.optional(v.id("games")),
    winnerId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed")
    ),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_tournament", ["tournamentId"])
    .index("by_status", ["status"])
    .index("by_round", ["tournamentId", "roundNumber"]),
  // Chat messages for games
  chat_messages: defineTable({
    gameId: v.string(),
    userId: v.string(),
    userName: v.string(),
    message: v.string(),
    timestamp: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_timestamp", ["timestamp"]),
});