import { defineEventHandler, setHeaders, getHeader } from 'h3'
import { log } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
  // Skip for non-API routes and static files
  if (!event.node.req.url?.startsWith('/api/')) {
    return
  }

  const allowedOrigins = [
    process.env.NUXT_PUBLIC_SITE_URL,
    'http://localhost:3000', // Development
    'http://127.0.0.1:3000'  // Development
  ].filter(Boolean)

  const origin = getHeader(event, 'origin')
  
  // CORS Headers
  if (origin && allowedOrigins.includes(origin)) {
    setHeaders(event, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true'
    })
  }

  setHeaders(event, {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  })

  // Security Headers
  setHeaders(event, {
    // Prevent XSS attacks
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    
    // HSTS (only in production with HTTPS)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // Content Security Policy (basic)
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.convex.cloud",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' *.convex.cloud wss://*.convex.cloud",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; '),
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  })

  // Handle preflight OPTIONS requests
  if (event.node.req.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    return null
  }

  // Log suspicious requests in production
  if (process.env.NODE_ENV === 'production') {
    const userAgent = getHeader(event, 'user-agent')
    const referer = getHeader(event, 'referer')
    
    // Log requests without proper origin/referer (potential CSRF)
    if (!origin && !referer && event.node.req.method !== 'GET') {
      log.security('Request without origin or referer', undefined, event.context.clientIP, {
        method: event.node.req.method,
        url: event.node.req.url,
        userAgent
      })
    }
    
    // Log suspicious user agents
    if (userAgent && /bot|crawler|spider|scanner/i.test(userAgent)) {
      log.security('Bot access attempt', undefined, event.context.clientIP, {
        userAgent,
        url: event.node.req.url
      })
    }
  }
})
