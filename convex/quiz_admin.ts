import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check a single question's structure
export const debugQuestion = query({
  args: { index: v.optional(v.number()) },
  handler: async (ctx, { index = 0 }) => {
    const questions = await ctx.db.query("quizQuestions").take(index + 1);
    const question = questions[index];
    return {
      raw: question,
      hasCorrectAnswer: question?.correctAnswer !== undefined,
      correctAnswerValue: question?.correctAnswer,
      allFields: Object.keys(question || {}),
    };
  },
});

// Seed function to add initial quiz questions
export const seedQuizQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const questions = [
      // Openings - Beginner
      {
        question: "What is the most popular first move for White in chess?",
        category: "openings" as const,
        difficulty: "beginner" as const,
        options: ["1.e4", "1.d4", "1.Nf3", "1.c4"],
        correctAnswer: 0,
        explanation: "1.e4 (King's Pawn opening) is the most popular first move, controlling the center and allowing quick development of the bishop and queen.",
        timeLimit: 15,
        points: 10,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },
      {
        question: "Which opening is known as the 'Italian Game'?",
        category: "openings" as const,
        difficulty: "beginner" as const,
        options: ["1.e4 e5 2.Nf3 Nc6 3.Bc4", "1.e4 e5 2.Nf3 Nc6 3.Bb5", "1.d4 d5 2.c4", "1.e4 c5"],
        correctAnswer: 0,
        explanation: "The Italian Game starts with 1.e4 e5 2.Nf3 Nc6 3.Bc4, attacking the f7 square early in the game.",
        timeLimit: 20,
        points: 10,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },
      {
        question: "What does 'castling' accomplish?",
        category: "rules" as const,
        difficulty: "beginner" as const,
        options: ["King safety and rook development", "Checkmate the opponent", "Capture an enemy piece", "Promote a pawn"],
        correctAnswer: 0,
        explanation: "Castling serves two purposes: it moves the king to safety behind pawns and brings the rook toward the center for better activity.",
        timeLimit: 15,
        points: 10,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },

      // Tactics - Beginner
      {
        question: "What is a 'fork' in chess?",
        category: "tactics" as const,
        difficulty: "beginner" as const,
        options: ["Attacking two pieces at once", "Moving the same piece twice", "Capturing with a pawn", "Promoting to a queen"],
        correctAnswer: 0,
        explanation: "A fork is a tactic where one piece attacks two or more enemy pieces simultaneously, often winning material.",
        timeLimit: 15,
        points: 10,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },
      {
        question: "What is 'discovered attack'?",
        category: "tactics" as const,
        difficulty: "intermediate" as const,
        options: ["An attack revealed by moving another piece", "Attacking with a newly promoted piece", "Finding a hidden checkmate", "Capturing an undefended piece"],
        correctAnswer: 0,
        explanation: "A discovered attack occurs when moving one piece reveals an attack from another piece behind it.",
        timeLimit: 20,
        points: 15,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },

      // History - Beginner
      {
        question: "Who is considered the first official World Chess Champion?",
        category: "history" as const,
        difficulty: "beginner" as const,
        options: ["Wilhelm Steinitz", "Paul Morphy", "Adolf Anderssen", "Howard Staunton"],
        correctAnswer: 0,
        explanation: "Wilhelm Steinitz became the first official World Chess Champion in 1886, though he was considered the strongest player before that.",
        timeLimit: 20,
        points: 10,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },
      {
        question: "In which country did chess originate?",
        category: "history" as const,
        difficulty: "beginner" as const,
        options: ["India", "China", "Persia", "Russia"],
        correctAnswer: 0,
        explanation: "Chess originated in India around the 6th century as a game called Chaturanga.",
        timeLimit: 15,
        points: 10,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },

      // Rules - Beginner
      {
        question: "How many squares are on a chess board?",
        category: "rules" as const,
        difficulty: "beginner" as const,
        options: ["64", "32", "48", "56"],
        correctAnswer: 0,
        explanation: "A chess board has 8x8 = 64 squares, alternating between light and dark colors.",
        timeLimit: 10,
        points: 5,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },
      {
        question: "Can a pawn move backwards?",
        category: "rules" as const,
        difficulty: "beginner" as const,
        options: ["No, never", "Yes, but only when capturing", "Yes, but only on the first move", "Yes, after promotion"],
        correctAnswer: 0,
        explanation: "Pawns can only move forward, never backwards. This is one of the fundamental rules of chess.",
        timeLimit: 10,
        points: 5,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },

      // Famous Games - Intermediate
      {
        question: "The 'Immortal Game' was played between which two players?",
        category: "famous-games" as const,
        difficulty: "intermediate" as const,
        options: ["Anderssen vs Kieseritzky", "Morphy vs Duke of Brunswick", "Capablanca vs Marshall", "Fischer vs Spassky"],
        correctAnswer: 0,
        explanation: "The 'Immortal Game' was played in 1851 between Adolf Anderssen and Lionel Kieseritzky, featuring brilliant sacrificial play.",
        timeLimit: 25,
        points: 20,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },

      // Endgames - Intermediate
      {
        question: "In a King and Pawn vs King endgame, what is the 'opposition'?",
        category: "endgames" as const,
        difficulty: "intermediate" as const,
        options: ["Kings facing each other with one square between", "Having more pawns than opponent", "Promoting the pawn first", "Capturing the opponent's king"],
        correctAnswer: 0,
        explanation: "Opposition occurs when kings face each other with exactly one square between them. The player to move loses the opposition.",
        timeLimit: 25,
        points: 20,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },

      // Theory - Advanced
      {
        question: "What is the Lucena Position?",
        category: "theory" as const,
        difficulty: "advanced" as const,
        options: ["A winning rook endgame technique", "A chess opening system", "A mating pattern", "A pawn structure"],
        correctAnswer: 0,
        explanation: "The Lucena Position is a fundamental winning technique in rook and pawn vs rook endgames, involving the 'building a bridge' method.",
        timeLimit: 30,
        points: 30,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },

      // More beginner questions for variety
      {
        question: "Which piece can only move diagonally?",
        category: "rules" as const,
        difficulty: "beginner" as const,
        options: ["Bishop", "Rook", "Knight", "Queen"],
        correctAnswer: 0,
        explanation: "The bishop can only move diagonally across the board, staying on squares of the same color throughout the game.",
        timeLimit: 10,
        points: 5,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },
      {
        question: "What is 'en passant'?",
        category: "rules" as const,
        difficulty: "intermediate" as const,
        options: ["A special pawn capture", "A way to escape check", "Castling through check", "Moving two pieces at once"],
        correctAnswer: 0,
        explanation: "En passant is a special pawn capture that can occur when an opponent's pawn moves two squares forward from its starting position, landing next to your pawn.",
        timeLimit: 20,
        points: 15,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },
      {
        question: "What is a 'pin' in chess tactics?",
        category: "tactics" as const,
        difficulty: "beginner" as const,
        options: ["Restricting a piece's movement", "Capturing multiple pieces", "Checking the king", "Moving without capturing"],
        correctAnswer: 0,
        explanation: "A pin occurs when a piece cannot or should not move because it would expose a more valuable piece behind it to attack.",
        timeLimit: 15,
        points: 10,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      },
      {
        question: "Who was known as the 'Human Chess Machine'?",
        category: "history" as const,
        difficulty: "intermediate" as const,
        options: ["José Capablanca", "Garry Kasparov", "Magnus Carlsen", "Bobby Fischer"],
        correctAnswer: 0,
        explanation: "José Capablanca was nicknamed the 'Human Chess Machine' for his incredible endgame technique and seemingly effortless play.",
        timeLimit: 20,
        points: 15,
        createdBy: "system",
        createdAt: now,
        isActive: true,
      }
    ];

    // Delete all existing questions first
    const existingQuestions = await ctx.db.query("quizQuestions").collect();
    for (const q of existingQuestions) {
      await ctx.db.delete(q._id);
    }

    // Insert all questions
    const insertedIds = [];
    for (const question of questions) {
      const id = await ctx.db.insert("quizQuestions", question);
      insertedIds.push(id);
    }

    return {
      message: `Successfully deleted ${existingQuestions.length} old questions and added ${questions.length} new quiz questions!`,
      questionIds: insertedIds
    };
  },
});

// Function to get quiz statistics (for admin purposes)
export const getQuizStats = mutation({
  args: {},
  handler: async (ctx) => {
    const totalQuestions = await ctx.db.query("quizQuestions").collect();
    const totalSessions = await ctx.db.query("quizSessions").collect();
    const completedSessions = totalSessions.filter(s => s.status === "completed");

    const categoryCounts = totalQuestions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const difficultyCounts = totalQuestions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalQuestions: totalQuestions.length,
      activeQuestions: totalQuestions.filter(q => q.isActive).length,
      totalSessions: totalSessions.length,
      completedSessions: completedSessions.length,
      categoryCounts,
      difficultyCounts,
    };
  },
});

// Debug query to check if questions have correctAnswer field
export const checkQuestionStructure = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("quizQuestions").take(3);
    return questions.map(q => ({
      id: q._id,
      question: q.question?.substring(0, 50),
      correctAnswer: q.correctAnswer,
      options: q.options,
      allKeys: Object.keys(q),
      hasCorrectAnswer: 'correctAnswer' in q
    }));
  },
});

// Get a single question by ID to debug
export const getQuestionById = query({
  args: { questionId: v.id("quizQuestions") },
  handler: async (ctx, { questionId }) => {
    const q = await ctx.db.get(questionId);
    return q;
  },
});
