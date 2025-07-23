import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { userStorage, customerStorage } from '../db/storage.js'
import { type User, type Customer } from '../db/schema.js'
import { hasPermission } from './permissions.js'

// JWT payload interface
export interface JwtPayload {
  userId: number
  email: string
  role: string
  iat?: number
  exp?: number
}

// Extended request type with user and customer
export interface AuthenticatedRequest extends Request {
  user?: User
  customer?: Customer
}

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-this-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Generate JWT token
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Verify JWT token
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    return null
  }
}

// Extract token from request headers
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  }
  
  // Also check for token in cookies (fallback)
  return req.cookies?.token || null
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Middleware to require authentication
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      })
    }
    
    const payload = verifyToken(token)
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      })
    }
    
    // Get user from database
    const user = await userStorage.findById(payload.userId)
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      })
    }
    
    // Attach user to request
    req.user = user
    
    // If user is a customer, also attach customer record
    if (user.role === 'customer') {
      const customer = await customerStorage.findByUserId(user.id)
      if (customer) {
        req.customer = customer
      }
    }
    
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

// Optional auth middleware (doesn't require authentication but adds user if available)
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req)
    
    if (token) {
      const payload = verifyToken(token)
      
      if (payload) {
        const user = await userStorage.findById(payload.userId)
        
        if (user && user.isActive) {
          req.user = user
          
          // If user is a customer, also attach customer record
          if (user.role === 'customer') {
            const customer = await customerStorage.findByUserId(user.id)
            if (customer) {
              req.customer = customer
            }
          }
        }
      }
    }
    
    next()
  } catch (error) {
    console.error('Optional auth error:', error)
    // Don't fail the request, just continue without user
    next()
  }
}

// Check if user has specific role
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
    }
    
    next()
  }
}

// Check if user is admin
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next)
}

// Check if user has any of the specified roles
export function requireAnyRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
    }
    
    next()
  }
}

// Validate password strength
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Check if user is a customer
export function requireCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Customer access required'
    })
  }
  
  if (!req.customer) {
    return res.status(403).json({
      success: false,
      error: 'Customer profile not found'
    })
  }
  
  next()
}

// Check if user has specific permission
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
    }

    next()
  }
}

// Check if user is staff (not customer)
export function requireStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  if (req.user.role === 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Staff access required'
    })
  }

  next()
}

// Generate safe user data for responses (excludes password)
export function getSafeUserData(user: User) {
  const { password, ...safeUser } = user
  return safeUser
}