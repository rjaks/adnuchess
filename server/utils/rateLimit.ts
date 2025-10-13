import type { H3Event } from 'h3'
import { createError, getRequestIP } from 'h3'
import { useStorage } from '#imports'
import { log } from './logger'

interface RateLimitRule {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequestTime: number
}

// Rate limit configurations
export const rateLimitRules: Record<string, RateLimitRule> = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 login attempts per 15 minutes
  },
  
  // Matchmaking - prevent spam joining/leaving
  matchmaking: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 matchmaking actions per minute
  },
  
  // Game moves - reasonable limit for chess moves
  gameMove: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 moves per minute (very generous for chess)
  },
  
  // General API calls
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  },
  
  // Profile updates - prevent spam
  profile: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5 // 5 profile updates per minute
  },
  
  // Department changes - special handling (already has cooldown)
  department: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 2 // 2 attempts per minute
  }
}

export class RateLimiter {
  private storage = useStorage('rate-limit')
  
  async checkRateLimit(
    event: H3Event,
    key: string,
    rule?: RateLimitRule
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const ruleToUse = rule || rateLimitRules.api
    const now = Date.now()
    const ip = getRequestIP(event)
    
    // Create storage key combining the provided key and IP for security
    const storageKey = `ratelimit:${key}:${ip}`
    
    try {
      const entry = await this.storage.getItem<RateLimitEntry>(storageKey)
      
      if (!entry) {
        // First request
        const newEntry: RateLimitEntry = {
          count: 1,
          resetTime: now + ruleToUse.windowMs,
          firstRequestTime: now
        }
        
        await this.storage.setItem(storageKey, newEntry, {
          ttl: Math.ceil(ruleToUse.windowMs / 1000)
        })
        
        return {
          allowed: true,
          remaining: ruleToUse.maxRequests - 1,
          resetTime: newEntry.resetTime
        }
      }
      
      // Check if window has expired
      if (now >= entry.resetTime) {
        // Reset the window
        const newEntry: RateLimitEntry = {
          count: 1,
          resetTime: now + ruleToUse.windowMs,
          firstRequestTime: now
        }
        
        await this.storage.setItem(storageKey, newEntry, {
          ttl: Math.ceil(ruleToUse.windowMs / 1000)
        })
        
        return {
          allowed: true,
          remaining: ruleToUse.maxRequests - 1,
          resetTime: newEntry.resetTime
        }
      }
      
      // Within the current window
      if (entry.count >= ruleToUse.maxRequests) {
        // Rate limit exceeded
        log.security('Rate limit exceeded', undefined, ip, {
          key,
          count: entry.count,
          maxRequests: ruleToUse.maxRequests,
          windowMs: ruleToUse.windowMs
        })
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.resetTime
        }
      }
      
      // Increment counter
      entry.count++
      await this.storage.setItem(storageKey, entry, {
        ttl: Math.ceil((entry.resetTime - now) / 1000)
      })
      
      return {
        allowed: true,
        remaining: ruleToUse.maxRequests - entry.count,
        resetTime: entry.resetTime
      }
      
    } catch (error) {
      log.error('Rate limiter error', error, { key, ip })
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: ruleToUse.maxRequests,
        resetTime: now + ruleToUse.windowMs
      }
    }
  }
  
  async clearRateLimit(key: string, ip?: string): Promise<void> {
    try {
      if (ip) {
        await this.storage.removeItem(`ratelimit:${key}:${ip}`)
      } else {
        // Clear all entries for this key (admin function)
        const keys = await this.storage.getKeys(`ratelimit:${key}:`)
        await Promise.all(keys.map(k => this.storage.removeItem(k)))
      }
    } catch (error) {
      log.error('Failed to clear rate limit', error, { key, ip })
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Helper function for common rate limit check with error throwing
export async function enforceRateLimit(
  event: H3Event,
  key: string,
  rule?: RateLimitRule
): Promise<void> {
  const result = await rateLimiter.checkRateLimit(event, key, rule)
  
  if (!result.allowed) {
    const resetDate = new Date(result.resetTime)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        resetTime: resetDate.toISOString()
      }
    })
  }
  
  // Add rate limit headers
  event.node.res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
  event.node.res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
}

// Specific rate limit helpers
export const rateLimitHelpers = {
  auth: (event: H3Event) => enforceRateLimit(event, 'auth', rateLimitRules.auth),
  matchmaking: (event: H3Event, userId: string) => 
    enforceRateLimit(event, `matchmaking:${userId}`, rateLimitRules.matchmaking),
  gameMove: (event: H3Event, gameId: string, userId: string) => 
    enforceRateLimit(event, `move:${gameId}:${userId}`, rateLimitRules.gameMove),
  api: (event: H3Event, userId: string) => 
    enforceRateLimit(event, `api:${userId}`, rateLimitRules.api),
  profile: (event: H3Event, userId: string) => 
    enforceRateLimit(event, `profile:${userId}`, rateLimitRules.profile),
  department: (event: H3Event, userId: string) => 
    enforceRateLimit(event, `department:${userId}`, rateLimitRules.department)
}
