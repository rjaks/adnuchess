import { defineEventHandler } from 'h3'
import { log } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {} as Record<string, { status: string; responseTime?: number; error?: string }>
  }

  // Check database/storage connectivity
  try {
    const { useStorage } = await import('#imports')
    const storage = useStorage('health-check')
    const testKey = `health-check:${Date.now()}`
    
    const dbStartTime = Date.now()
    await storage.setItem(testKey, { test: true }, { ttl: 10 }) // 10 second TTL
    await storage.getItem(testKey)
    await storage.removeItem(testKey)
    
    healthCheck.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStartTime
    }
  } catch (error) {
    healthCheck.status = 'degraded'
    healthCheck.checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }

  // Check Convex connectivity (if available)
  try {
    const convexStartTime = Date.now()
    const { $convex } = event.context
    
    if ($convex) {
      // Try a simple query to test Convex connection
      await $convex.query('profiles:getAllProfiles')
      
      healthCheck.checks.convex = {
        status: 'healthy',
        responseTime: Date.now() - convexStartTime
      }
    } else {
      healthCheck.checks.convex = {
        status: 'not_configured'
      }
    }
  } catch (error) {
    healthCheck.status = 'degraded'
    healthCheck.checks.convex = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown Convex error'
    }
  }

  // Check memory usage
  const memUsage = process.memoryUsage()
  healthCheck.checks.memory = {
    status: memUsage.heapUsed < memUsage.heapTotal * 0.9 ? 'healthy' : 'warning',
    responseTime: 0,
    ...memUsage
  }

  // Overall response time
  const totalResponseTime = Date.now() - startTime
  healthCheck.checks.overall = {
    status: 'healthy',
    responseTime: totalResponseTime
  }

  // Set HTTP status based on health
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503

  event.node.res.statusCode = statusCode

  // Log health check if there are issues
  if (healthCheck.status !== 'healthy') {
    log.warn('Health check detected issues', {
      status: healthCheck.status,
      checks: healthCheck.checks
    })
  }

  return healthCheck
})
