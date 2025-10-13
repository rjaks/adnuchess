import type { H3Event } from 'h3'
import { createError, getRequestIP, getHeader } from 'h3'
import { log } from './logger'

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Game Logic
  INVALID_MOVE = 'INVALID_MOVE',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  GAME_ALREADY_FINISHED = 'GAME_ALREADY_FINISHED',
  NOT_PLAYER_TURN = 'NOT_PLAYER_TURN',
  PLAYER_NOT_IN_GAME = 'PLAYER_NOT_IN_GAME',
  
  // Matchmaking
  ALREADY_IN_QUEUE = 'ALREADY_IN_QUEUE',
  NOT_IN_QUEUE = 'NOT_IN_QUEUE',
  MATCHMAKING_TIMEOUT = 'MATCHMAKING_TIMEOUT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // External Services
  CONVEX_ERROR = 'CONVEX_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT = 'CONFLICT'
}

export interface AppError extends Error {
  code: ErrorCode
  statusCode: number
  isOperational: boolean
  context?: Record<string, any>
}

export class ChessAppError extends Error implements AppError {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean = true
  public readonly context?: Record<string, any>

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'ChessAppError'
    this.code = code
    this.statusCode = statusCode
    this.context = context

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, ChessAppError)
  }
}

// Pre-defined error creators for common scenarios
export const errors = {
  // Authentication
  unauthorized: (message = 'Authentication required') =>
    new ChessAppError(ErrorCode.UNAUTHORIZED, message, 401),
  
  forbidden: (message = 'Access denied') =>
    new ChessAppError(ErrorCode.FORBIDDEN, message, 403),
  
  sessionExpired: (message = 'Session has expired') =>
    new ChessAppError(ErrorCode.SESSION_EXPIRED, message, 401),
  
  // Validation
  validationFailed: (message: string, context?: Record<string, any>) =>
    new ChessAppError(ErrorCode.VALIDATION_FAILED, message, 400, context),
  
  invalidInput: (field: string, value?: any) =>
    new ChessAppError(
      ErrorCode.INVALID_INPUT, 
      `Invalid input for field: ${field}`,
      400,
      { field, value }
    ),
  
  // Game Logic
  invalidMove: (move: string, gameId: string) =>
    new ChessAppError(
      ErrorCode.INVALID_MOVE,
      `Invalid chess move: ${move}`,
      400,
      { move, gameId }
    ),
  
  gameNotFound: (gameId: string) =>
    new ChessAppError(
      ErrorCode.GAME_NOT_FOUND,
      `Game not found: ${gameId}`,
      404,
      { gameId }
    ),
  
  gameFinished: (gameId: string) =>
    new ChessAppError(
      ErrorCode.GAME_ALREADY_FINISHED,
      `Game has already finished: ${gameId}`,
      409,
      { gameId }
    ),
  
  notPlayerTurn: (gameId: string, playerId: string) =>
    new ChessAppError(
      ErrorCode.NOT_PLAYER_TURN,
      'It is not your turn to move',
      400,
      { gameId, playerId }
    ),
  
  // Matchmaking
  alreadyInQueue: (userId: string) =>
    new ChessAppError(
      ErrorCode.ALREADY_IN_QUEUE,
      'Player is already in matchmaking queue',
      409,
      { userId }
    ),
  
  // Rate Limiting
  rateLimitExceeded: (retryAfter: number) =>
    new ChessAppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Try again in ${retryAfter} seconds`,
      429,
      { retryAfter }
    ),
  
  // External Services
  convexError: (originalError: Error, operation: string) =>
    new ChessAppError(
      ErrorCode.CONVEX_ERROR,
      `Convex operation failed: ${operation}`,
      503,
      { originalError: originalError.message, operation }
    ),
  
  // General
  internal: (message = 'Internal server error', context?: Record<string, any>) =>
    new ChessAppError(ErrorCode.INTERNAL_ERROR, message, 500, context),
  
  notFound: (resource: string, id?: string) =>
    new ChessAppError(
      ErrorCode.RESOURCE_NOT_FOUND,
      `${resource} not found${id ? `: ${id}` : ''}`,
      404,
      { resource, id }
    ),
  
  conflict: (message: string, context?: Record<string, any>) =>
    new ChessAppError(ErrorCode.CONFLICT, message, 409, context),
  
  serviceUnavailable: (service: string) =>
    new ChessAppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `Service temporarily unavailable: ${service}`,
      503,
      { service }
    )
}

// Enhanced error handler with logging and context
export function handleError(error: unknown, event: H3Event, context?: Record<string, any>) {
  const ip = getRequestIP(event)
  const userAgent = getHeader(event, 'user-agent')
  const url = event.node.req.url
  const method = event.node.req.method
  
  const requestContext = {
    ip,
    userAgent,
    url,
    method,
    timestamp: new Date().toISOString(),
    ...context
  }

  if (error instanceof ChessAppError) {
    // Log operational errors as warnings with context
    log.warn(`Operational error: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      request: requestContext
    })

    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
      data: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' ? { context: error.context } : {})
      }
    })
  }

  if (error instanceof Error) {
    // Log unexpected errors with full stack trace
    log.error(`Unexpected error: ${error.message}`, error, {
      request: requestContext
    })

    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message

    throw createError({
      statusCode: 500,
      statusMessage: message,
      data: {
        code: ErrorCode.INTERNAL_ERROR,
        message,
        ...(process.env.NODE_ENV === 'development' ? { originalError: error.message } : {})
      }
    })
  }

  // Handle unknown error types
  log.error('Unknown error type encountered', new Error('Unknown error'), {
    error,
    request: requestContext
  })

  throw createError({
    statusCode: 500,
    statusMessage: 'Internal server error',
    data: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred'
    }
  })
}

// Async error wrapper for route handlers
export function asyncHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      // If it's already a properly formatted error, re-throw it
      if (error instanceof ChessAppError) {
        throw error
      }
      
      // Convert unknown errors to ChessAppError
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw errors.internal(message, { originalError: error })
    }
  }
}

// Helper to check if error is operational (expected)
export function isOperationalError(error: unknown): error is ChessAppError {
  return error instanceof ChessAppError && error.isOperational
}
