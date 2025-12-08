import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get questions for a quiz session
export const getQuestionsForQuiz = query({
  args: {
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, { category, difficulty, limit }) => {
    let query = ctx.db.query("quizQuestions").filter(q => q.eq(q.field("isActive"), true));
    
    if (category && category !== "mixed") {
      query = query.filter(q => q.eq(q.field("category"), category));
    }
    
    if (difficulty && difficulty !== "mixed") {
      query = query.filter(q => q.eq(q.field("difficulty"), difficulty));
    }
    
    const questions = await query.collect();
    
    // Shuffle and limit questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  },
});

// Start a new quiz session
export const startQuizSession = mutation({
  args: {
    userId: v.string(),
    gameMode: v.union(v.literal("practice"), v.literal("timed"), v.literal("challenge")),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    questionCount: v.number(),
  },
  handler: async (ctx, { userId, gameMode, category, difficulty, questionCount }) => {
    // Get questions for the session
    const questions = await ctx.runQuery("quiz:getQuestionsForQuiz", {
      category,
      difficulty,
      limit: questionCount,
    });
    
    if (questions.length === 0) {
      throw new Error("No questions available for the selected criteria");
    }
    
    // Create quiz session
    const sessionId = await ctx.db.insert("quizSessions", {
      userId,
      gameMode,
      category: category || "mixed",
      difficulty: difficulty || "mixed",
      status: "active",
      currentQuestionIndex: 0,
      questions: questions.map(q => q._id),
      answers: [],
      totalScore: 0,
      totalQuestions: questions.length,
      correctAnswers: 0,
      timeRemaining: gameMode === "timed" ? 300000 : undefined, // 5 minutes for timed mode
      startedAt: Date.now(),
    });
    
    return { sessionId, questionCount: questions.length };
  },
});

// Get current quiz session
export const getQuizSession = query({
  args: { sessionId: v.id("quizSessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;
    
    // Get current question
    const currentQuestion = session.currentQuestionIndex < session.questions.length 
      ? await ctx.db.get(session.questions[session.currentQuestionIndex])
      : null;
    
    // For Quick Fire (challenge mode), override timeLimit to 10 seconds
    const finalTimeLimit = session.gameMode === "challenge" ? 10 : (currentQuestion?.timeLimit ?? 15);
    
    console.log(`[QuizSession] Mode: ${session.gameMode}, Original timeLimit: ${currentQuestion?.timeLimit}, Final timeLimit: ${finalTimeLimit}`);
    
    return {
      ...session,
      currentQuestion: currentQuestion ? {
        ...currentQuestion,
        correctAnswer: undefined, // Don't send correct answer to client
        timeLimit: finalTimeLimit,
      } : null,
    };
  },
});

// Submit answer to current question
export const submitAnswer = mutation({
  args: {
    sessionId: v.id("quizSessions"),
    answer: v.optional(v.number()),
    timeSpent: v.number(),
    optionOrder: v.optional(v.array(v.number())), // Shuffled order of options
  },
  handler: async (ctx, { sessionId, answer, timeSpent, optionOrder }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive session");
    }
    
    const currentQuestionId = session.questions[session.currentQuestionIndex];
    const question = await ctx.db.get(currentQuestionId);
    if (!question) {
      throw new Error("Question not found");
    }
    
    console.log("[submitAnswer] Question data:", JSON.stringify(question));
    console.log("[submitAnswer] correctAnswer field:", question.correctAnswer);
    
    // Check if answer is correct
    const isCorrect = answer !== undefined && answer === question.correctAnswer;
    const pointsEarned = isCorrect ? question.points : 0;
    
    // Add answer to session - INCLUDE correctAnswer and optionOrder for later display
    const newAnswer = {
      questionId: currentQuestionId,
      userAnswer: answer,
      correctAnswer: question.correctAnswer, // Store correct answer here!
      optionOrder, // Store shuffled order
      isCorrect,
      timeSpent,
      pointsEarned,
    };
    
    const updatedAnswers = [...session.answers, newAnswer];
    const newScore = session.totalScore + pointsEarned;
    const newCorrectCount = session.correctAnswers + (isCorrect ? 1 : 0);
    const nextIndex = session.currentQuestionIndex + 1;
    
    // Check if quiz is complete
    const isComplete = nextIndex >= session.totalQuestions;
    
    await ctx.db.patch(sessionId, {
      answers: updatedAnswers,
      currentQuestionIndex: nextIndex,
      totalScore: newScore,
      correctAnswers: newCorrectCount,
      status: isComplete ? "completed" : "active",
      completedAt: isComplete ? Date.now() : undefined,
    });
    
    // Update leaderboard if quiz is complete
    if (isComplete) {
      await updateLeaderboard(ctx, session.userId, session, newScore, newCorrectCount);
    }
    
    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      pointsEarned,
      isComplete,
      totalScore: newScore,
    };
  },
});

// End timed quiz when time runs out
export const endTimedQuiz = mutation({
  args: { sessionId: v.id("quizSessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Mark session as completed
    await ctx.db.patch(sessionId, {
      status: "completed",
      completedAt: Date.now(),
    });
    
    // Update leaderboard
    await updateLeaderboard(ctx, session.userId, session, session.totalScore, session.correctAnswers);
    
    return { success: true };
  },
});

// Get quiz results
export const getQuizResults = query({
  args: { sessionId: v.id("quizSessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;
    
    // Get detailed results with questions and answers
    const detailedAnswers = [];
    
    for (const answer of session.answers) {
      const question = await ctx.db.get(answer.questionId);
      
      // Calculate score - handle both old sessions (without pointsEarned) and new ones
      const score = answer.pointsEarned !== undefined 
        ? answer.pointsEarned 
        : (answer.isCorrect ? (question?.points || 10) : 0);
      
      // Shuffle options based on stored order (if available)
      let displayOptions = question?.options || [];
      let displayCorrectAnswer = question ? question.correctAnswer : null;
      let displayUserAnswer = answer.userAnswer;
      
      if (answer.optionOrder && answer.optionOrder.length > 0) {
        // Reorder options to match what was shown to the user
        displayOptions = answer.optionOrder.map((originalIndex: number) => 
          question?.options[originalIndex] || ''
        );
        
        // Convert correct answer index to shuffled position
        displayCorrectAnswer = answer.optionOrder.indexOf(question?.correctAnswer ?? -1);
        
        // Convert user answer index to shuffled position
        if (displayUserAnswer !== undefined && displayUserAnswer !== null) {
          displayUserAnswer = answer.optionOrder.indexOf(displayUserAnswer);
        }
      }
      
      // Explicitly construct the object to ensure correctAnswer is included
      const detailedAnswer = {
        questionId: answer.questionId,
        userAnswer: displayUserAnswer,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
        pointsEarned: answer.pointsEarned,
        question: question?.question || 'Question not found',
        options: displayOptions,
        explanation: question?.explanation || '',
        correctAnswer: displayCorrectAnswer,
        score: score,
      };
      
      detailedAnswers.push(detailedAnswer);
    }
    
    const accuracy = session.totalQuestions > 0 
      ? (session.correctAnswers / session.totalQuestions) * 100 
      : 0;
    
    const totalTime = session.completedAt && session.startedAt 
      ? session.completedAt - session.startedAt 
      : 0;
    
    const averageTimePerQuestion = session.answers.length > 0
      ? session.answers.reduce((sum, a) => sum + a.timeSpent, 0) / session.answers.length
      : 0;
    
    return {
      session,
      detailedAnswers,
      stats: {
        accuracy,
        totalTime,
        averageTimePerQuestion: averageTimePerQuestion / 1000, // Convert to seconds
      },
    };
  },
});

// Get quiz leaderboard
export const getQuizLeaderboard = query({
  args: {
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, difficulty, limit = 20 }) => {
    let query = ctx.db.query("quizLeaderboard");
    
    if (category && category !== "all") {
      query = query.filter(q => q.eq(q.field("category"), category));
    }
    
    if (difficulty && difficulty !== "all") {
      query = query.filter(q => q.eq(q.field("difficulty"), difficulty));    }
    
    // Get all entries and sort manually since Convex order with filters can be complex
    const allEntries = await query.collect();
    const sortedEntries = allEntries.sort((a, b) => b.bestScore - a.bestScore);
    const leaderboard = sortedEntries.slice(0, limit);
    
    // Get user profiles for display names
    const enrichedLeaderboard = await Promise.all(
      leaderboard.map(async (entry) => {
        const profile = await ctx.db
          .query("profiles")
          .filter(q => q.eq(q.field("userId"), entry.userId))
          .unique();
        
        return {
          ...entry,
          displayName: profile?.displayName || profile?.name || "Unknown",
          department: profile?.department,
        };
      })
    );
    
    return enrichedLeaderboard;
  },
});

// Helper function to update leaderboard
async function updateLeaderboard(ctx: any, userId: string, session: any, finalScore: number, correctAnswers: number) {
  const accuracy = (correctAnswers / session.totalQuestions) * 100;
  const totalTime = session.completedAt - session.startedAt;
  const averageTime = totalTime / session.totalQuestions / 1000; // Convert to seconds
  
  // Find existing leaderboard entry
  const existingEntry = await ctx.db
    .query("quizLeaderboard")
    .filter(q => 
      q.and(
        q.eq(q.field("userId"), userId),
        q.eq(q.field("category"), session.category),
        q.eq(q.field("difficulty"), session.difficulty)
      )
    )
    .unique();
  
  if (existingEntry) {
    // Update existing entry
    const newGamesPlayed = existingEntry.gamesPlayed + 1;
    const newTotalQuestions = existingEntry.totalQuestions + session.totalQuestions;
    const newTotalCorrect = existingEntry.totalCorrect + correctAnswers;
    const newBestScore = Math.max(existingEntry.bestScore, finalScore);
    const newBestAccuracy = Math.max(existingEntry.bestAccuracy, accuracy);
    const newAverageTime = (existingEntry.averageTime * existingEntry.gamesPlayed + averageTime) / newGamesPlayed;
    
    await ctx.db.patch(existingEntry._id, {
      bestScore: newBestScore,
      bestAccuracy: newBestAccuracy,
      totalQuestions: newTotalQuestions,
      totalCorrect: newTotalCorrect,
      averageTime: newAverageTime,
      gamesPlayed: newGamesPlayed,
      lastPlayed: Date.now(),
    });
  } else {
    // Create new entry
    await ctx.db.insert("quizLeaderboard", {
      userId,
      category: session.category,
      difficulty: session.difficulty,
      bestScore: finalScore,
      bestAccuracy: accuracy,
      totalQuestions: session.totalQuestions,
      totalCorrect: correctAnswers,
      averageTime,
      gamesPlayed: 1,
      lastPlayed: Date.now(),
    });
  }
}

// Admin function to add quiz questions
export const addQuizQuestion = mutation({
  args: {
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
    options: v.array(v.string()),
    correctAnswer: v.number(),
    explanation: v.optional(v.string()),
    timeLimit: v.number(),
    points: v.number(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user is admin (you can add this check)
    const questionId = await ctx.db.insert("quizQuestions", {
      ...args,
      createdAt: Date.now(),
      isActive: true,
    });
    
    return questionId;
  },
});

// Get quiz statistics for a user
export const getUserQuizStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const sessions = await ctx.db
      .query("quizSessions")
      .filter(q => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();
    
    const leaderboardEntries = await ctx.db
      .query("quizLeaderboard")
      .filter(q => q.eq(q.field("userId"), userId))
      .collect();
    
    const totalGames = sessions.length;
    const totalScore = sessions.reduce((sum, s) => sum + s.totalScore, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const averageScore = totalGames > 0 ? totalScore / totalGames : 0;
    
    return {
      totalGames,
      totalScore,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100,
      leaderboardEntries,
      recentSessions: sessions.slice(-5), // Last 5 sessions
    };
  },
});
