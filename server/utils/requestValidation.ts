import type { H3Event } from 'h3'
import { readBody, getQuery, getRouterParam } from 'h3'
import { validateInput, safeValidate } from '~/server/utils/validation'
import { errors } from '~/server/utils/errorHandler'
import { log } from '~/server/utils/logger'
import { z } from 'zod'

export interface ValidationOptions {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
  stripUnknown?: boolean
  logValidation?: boolean
}

/**
 * Validation middleware that validates request body, query params, and route params
 */
export async function validateRequest<T = any>(
  event: H3Event, 
  options: ValidationOptions
): Promise<{
  body?: T
  query?: any
  params?: any
}> {
  const result: any = {}

  try {
    // Validate body
    if (options.body) {
      const body = await readBody(event).catch(() => ({}))
      
      if (options.logValidation) {
        log.debug('Validating request body', { body, schema: options.body.description })
      }

      const validation = safeValidate(options.body, body)
      if (!validation.success) {
        throw errors.validationFailed(`Body validation failed: ${validation.error}`, { body })
      }
      result.body = validation.data
    }

    // Validate query parameters
    if (options.query) {
      const query = getQuery(event)
      
      if (options.logValidation) {
        log.debug('Validating query parameters', { query, schema: options.query.description })
      }

      const validation = safeValidate(options.query, query)
      if (!validation.success) {
        throw errors.validationFailed(`Query validation failed: ${validation.error}`, { query })
      }
      result.query = validation.data
    }

    // Validate route parameters
    if (options.params) {
      const params: Record<string, any> = {}
      
      // Get all available router params
      const url = event.node.req.url || ''
      const pathSegments = url.split('/').filter(Boolean)
      
      // Extract common route params
      if (url.includes('/api/')) {
        const apiIndex = pathSegments.indexOf('api')
        for (let i = apiIndex + 1; i < pathSegments.length; i++) {
          const segment = pathSegments[i]
          const nextSegment = pathSegments[i + 1]
          
          // Check for common param patterns
          if (segment === 'game' && nextSegment) {
            params.id = nextSegment.split('?')[0] // Remove query string
          } else if (segment === 'players' && nextSegment) {
            params.id = nextSegment.split('?')[0]
          } else if (segment === 'profile' && nextSegment) {
            params.id = nextSegment.split('?')[0]
          }
        }
      }

      // Also try getRouterParam for standard Nuxt patterns
      try {
        const routerId = getRouterParam(event, 'id')
        if (routerId) params.id = routerId
      } catch (e) {
        // getRouterParam might fail, that's ok
      }

      if (options.logValidation) {
        log.debug('Validating route parameters', { params, schema: options.params.description })
      }

      const validation = safeValidate(options.params, params)
      if (!validation.success) {
        throw errors.validationFailed(`Params validation failed: ${validation.error}`, { params })
      }
      result.params = validation.data
    }

    return result

  } catch (error) {
    // Log validation failures for debugging
    log.warn('Request validation failed', {
      url: event.node.req.url,
      method: event.node.req.method,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      options: {
        hasBody: !!options.body,
        hasQuery: !!options.query,
        hasParams: !!options.params
      }
    })

    throw error
  }
}

/**
 * Decorator function for route handlers to add validation
 */
export function withValidation<T = any>(options: ValidationOptions) {
  return function(handler: (event: H3Event, validated: any) => Promise<T>) {
    return async (event: H3Event): Promise<T> => {
      const validated = await validateRequest(event, options)
      return handler(event, validated)
    }
  }
}

/**
 * Common validation helper functions for chess game endpoints
 */

// Create validation schemas dynamically to avoid export issues
export function createCommonValidation(validationType: 'gameId' | 'playerId' | 'pagination' | 'gameMove' | 'matchmaking') {
  switch (validationType) {
    case 'gameId':
      return {
        params: z.object({
          id: z.string().min(1, 'Game ID is required')
        })
      }
    case 'playerId':
      return {
        params: z.object({
          id: z.string().min(1, 'Player ID is required')
        })
      }
    case 'pagination':
      return {
        query: z.object({
          page: z.coerce.number().min(1).default(1),
          limit: z.coerce.number().min(1).max(100).default(20),
          sort: z.enum(['asc', 'desc']).default('desc').optional()
        })
      }
    case 'gameMove':
      return {
        body: z.object({
          gameId: z.string().min(1),
          move: z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/, 'Invalid move format'),
          fen: z.string().regex(
            /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[bw]\s(-|[KQkq]+)\s(-|[a-h][3-6])\s\d+\s\d+$/,
            'Invalid FEN string'
          )
        })
      }
    case 'matchmaking':
      return {
        body: z.object({
          gameMode: z.enum(['blitz', 'rapid', 'classical', 'bullet']),
          rating: z.number().min(100).max(3000).optional()
        })
      }
    default:
      throw new Error(`Unknown validation type: ${validationType}`)
  }
}


