import winston from 'winston'

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.colorize({ all: process.env.NODE_ENV === 'development' })
  ),
  defaultMeta: { 
    service: 'adnu-chess',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
})

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }))
  
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }))
}

// Enhanced logging methods with context
export const log = {
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, { ...meta, timestamp: new Date().toISOString() })
  },
  
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, { ...meta, timestamp: new Date().toISOString() })
  },
  
  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    const errorInfo = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { error }
    
    logger.error(message, { 
      ...errorInfo, 
      ...meta, 
      timestamp: new Date().toISOString() 
    })
  },
  
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, { ...meta, timestamp: new Date().toISOString() })
  },

  // Chess-specific logging
  gameAction: (action: string, gameId: string, playerId: string, meta?: Record<string, any>) => {
    logger.info(`Game Action: ${action}`, {
      action,
      gameId,
      playerId,
      category: 'game',
      ...meta,
      timestamp: new Date().toISOString()
    })
  },

  matchmaking: (action: string, playerId: string, meta?: Record<string, any>) => {
    logger.info(`Matchmaking: ${action}`, {
      action,
      playerId,
      category: 'matchmaking',
      ...meta,
      timestamp: new Date().toISOString()
    })
  },

  security: (event: string, userId?: string, ip?: string, meta?: Record<string, any>) => {
    logger.warn(`Security Event: ${event}`, {
      event,
      userId,
      ip,
      category: 'security',
      ...meta,
      timestamp: new Date().toISOString()
    })
  }
}

export default logger
