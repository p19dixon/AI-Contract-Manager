import { Request, Response, NextFunction } from 'express'
import { userStorage } from '../db/storage.js'

// Replit Auth user type
export interface ReplitUser {
  id: string
  email: string
  name: string
  profileImage?: string
  roles?: string[]
}

// Extended request type with user
export interface AuthenticatedRequest extends Request {
  user?: ReplitUser
}

// Get user from Replit Auth headers
export function getReplitUser(req: Request): ReplitUser | null {
  const userId = req.headers['x-replit-user-id'] as string
  const userName = req.headers['x-replit-user-name'] as string
  const userEmail = req.headers['x-replit-user-email'] as string
  const userRoles = req.headers['x-replit-user-roles'] as string

  if (!userId || !userName || !userEmail) {
    return null
  }

  return {
    id: userId,
    name: userName,
    email: userEmail,
    roles: userRoles ? userRoles.split(',') : []
  }
}

// Middleware to check if user is authenticated
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const replitUser = getReplitUser(req)
    
    if (!replitUser) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      })
    }

    // Check if user exists in our database, create if not
    let dbUser = await userStorage.findById(replitUser.id)
    
    if (!dbUser) {
      // Create new user in our database
      dbUser = await userStorage.create({
        id: replitUser.id,
        email: replitUser.email,
        name: replitUser.name
      })
    } else {
      // Update user info if changed
      if (dbUser.email !== replitUser.email || dbUser.name !== replitUser.name) {
        dbUser = await userStorage.update(replitUser.id, {
          email: replitUser.email,
          name: replitUser.name
        })
      }
    }

    // Attach user to request
    req.user = replitUser
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
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const replitUser = getReplitUser(req)
    
    if (replitUser) {
      // Check if user exists in our database
      let dbUser = await userStorage.findById(replitUser.id)
      
      if (!dbUser) {
        // Create new user in our database
        dbUser = await userStorage.create({
          id: replitUser.id,
          email: replitUser.email,
          name: replitUser.name
        })
      }

      // Attach user to request
      req.user = replitUser
    }
    
    next()
  } catch (error) {
    console.error('Optional auth error:', error)
    // Don't fail the request, just continue without user
    next()
  }
}

// Development middleware for local testing (bypasses Replit Auth)
export function devAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'development') {
    return next()
  }

  // Mock user for development
  const mockUser: ReplitUser = {
    id: 'dev-user-1',
    name: 'Development User',
    email: 'dev@example.com',
    roles: ['admin']
  }

  req.user = mockUser
  next()
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

    if (!req.user.roles?.includes(role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      })
    }

    next()
  }
}