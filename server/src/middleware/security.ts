import { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { AuthenticatedRequest } from '../auth/replitAuth.js'

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests from Replit domains and localhost for development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://localhost:3000',
      'https://localhost:5000'
    ]
    
    // Add Replit domains if specified
    if (process.env.REPLIT_DOMAINS) {
      const replitDomains = process.env.REPLIT_DOMAINS.split(',')
      allowedOrigins.push(...replitDomains.map(domain => `https://${domain.trim()}`))
    }
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }
    
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true, // Allow cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-replit-user-id',
    'x-replit-user-name',
    'x-replit-user-email',
    'x-replit-user-roles'
  ]
}

// Helmet security configuration
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Disable for Replit compatibility
}

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(options: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown'
    const now = Date.now()
    
    // Clean up old entries
    if (now % 1000 === 0) { // Cleanup every ~1000 requests
      for (const [k, v] of rateLimitMap.entries()) {
        if (now > v.resetTime) {
          rateLimitMap.delete(k)
        }
      }
    }
    
    const record = rateLimitMap.get(key)
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
      return next()
    }
    
    if (record.count >= options.max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      })
    }
    
    record.count++
    next()
  }
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  const { method, url, ip } = req
  
  // Log request
  console.log(`${new Date().toISOString()} - ${method} ${url} from ${ip}`)
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start
    const { statusCode } = res
    console.log(`${new Date().toISOString()} - ${method} ${url} ${statusCode} - ${duration}ms`)
  })
  
  next()
}

// Error handling middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err)
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development'
  
  res.status(500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  })
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
}

// Validate request body size
export function validateBodySize(req: Request, res: Response, next: NextFunction) {
  const contentLength = req.get('content-length')
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'Request body too large'
    })
  }
  
  next()
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By')
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  next()
}

// API key validation (for future API integrations)
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key']
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    })
  }
  
  // TODO: Validate API key against database
  // For now, just check if it exists
  next()
}

// User activity tracking
export function trackUserActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user && req.session) {
    req.session.lastActivity = Date.now()
  }
  next()
}