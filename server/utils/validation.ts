import { z } from 'zod'

// Export z for other files to use
export { z }

// Common validation schemas - wrapped in functions to avoid auto-import issues
export const getGameMode = () => z.enum(['blitz', 'rapid', 'classical', 'bullet'])
export const getColor = () => z.enum(['white', 'black'])
export const getGameStatus = () => z.enum(['waiting', 'active', 'finished'])

// User validation
export const getUserId = () => z.string().min(1, 'User ID is required')
export const getUserName = () => z.string().min(1).max(100, 'Name must be 1-100 characters')
export const getUserEmail = () => z.string().email('Invalid email format')

// Chess game validation
export const getFenString = () => z.string().regex(
  /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[bw]\s(-|[KQkq]+)\s(-|[a-h][3-6])\s\d+\s\d+$/,
  'Invalid FEN string'
)

export const getChessMove = () => z.string().regex(
  /^[a-h][1-8][a-h][1-8][qrbn]?$/,
  'Invalid chess move format'
)

// Backward compatibility - keep the original exports but make them lazy
export const gameMode = getGameMode()
export const color = getColor()
export const gameStatus = getGameStatus()
export const userId = getUserId()
export const userName = getUserName()
export const userEmail = getUserEmail()
export const fenString = getFenString()
export const chessMove = getChessMove()

// Matchmaking schemas
export const joinQueueSchema = z.object({
  gameMode: gameMode,
  rating: z.number().min(100).max(3000).optional()
})

export const gameStateSchema = z.object({
  id: z.string(),
  fen: fenString,
  lastMove: chessMove.nullable(),
  lastMoveTime: z.number(),
  currentTurn: color,
  player1: z.object({
    id: userId,
    name: userName,
    color: color
  }),
  player2: z.object({
    id: userId,
    name: userName,
    color: color
  }),
  status: gameStatus,
  winner: userId.optional(),
  gameMode: gameMode,
  createdAt: z.number(),
  moveHistory: z.array(chessMove)
})

export const queuePlayerSchema = z.object({
  userId: userId,
  userName: userName,
  userRating: z.number().min(100).max(3000),
  gameMode: gameMode,
  joinedAt: z.number()
})

// API request schemas
export const makeMoveSchema = z.object({
  gameId: z.string(),
  move: chessMove,
  fen: fenString
})

export const createGameSchema = z.object({
  gameMode: gameMode,
  timeControl: z.number().min(60).max(7200).optional(), // 1 minute to 2 hours in seconds
  opponent: userId.optional()
})

export const gameIdSchema = z.object({
  id: z.string().min(1, 'Game ID is required')
})

// Profile schemas
export const updateProfileSchema = z.object({
  displayName: z.string().max(50, 'Display name too long').optional(),
  department: z.string().max(100, 'Department name too long').optional()
})

// Query parameter validation
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export const leaderboardQuerySchema = z.object({
  period: z.enum(['week', 'month', 'all']).default('all'),
  department: z.string().optional(),
  userType: z.enum(['student', 'faculty', 'staff', 'alumni']).optional(),
  ...paginationSchema.shape
})

// Rate limiting keys
export const rateLimitKeys = {
  matchmaking: (userId: string) => `matchmaking:${userId}`,
  gameMove: (gameId: string, userId: string) => `move:${gameId}:${userId}`,
  auth: (ip: string) => `auth:${ip}`,
  api: (userId: string) => `api:${userId}`,
  profile: (userId: string) => `profile:${userId}`
} as const

// Validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${message}`)
    }
    throw error
  }
}

export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  error?: string 
} => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return { success: false, error: message }
    }
    return { success: false, error: 'Unknown validation error' }
  }
}
