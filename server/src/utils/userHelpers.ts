import { userStorage } from '../db/storage.js'
import { type User } from '../db/schema.js'

// User management utility functions

/**
 * Get user by ID with error handling
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    return await userStorage.findById(id)
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    return null
  }
}

/**
 * Get user by email with error handling
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    return await userStorage.findByEmail(email)
  } catch (error) {
    console.error('Error fetching user by email:', error)
    return null
  }
}

/**
 * Create or update user from Replit Auth
 */
export async function createOrUpdateUserFromReplit(replitUser: {
  id: string
  email: string
  name: string
}): Promise<User | null> {
  try {
    // Check if user exists
    let user = await userStorage.findById(replitUser.id)
    
    if (!user) {
      // Create new user
      user = await userStorage.create({
        id: replitUser.id,
        email: replitUser.email,
        name: replitUser.name
      })
    } else {
      // Update existing user if info has changed
      if (user.email !== replitUser.email || user.name !== replitUser.name) {
        user = await userStorage.update(replitUser.id, {
          email: replitUser.email,
          name: replitUser.name
        })
      }
    }
    
    return user
  } catch (error) {
    console.error('Error creating/updating user from Replit:', error)
    return null
  }
}

/**
 * Safe user data for client responses (removes sensitive info)
 */
export function getSafeUserData(user: User, roles?: string[]) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: roles || []
  }
}

/**
 * Validate user data
 */
export function validateUserData(data: { name?: string; email?: string }) {
  const errors: string[] = []
  
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length < 1) {
      errors.push('Name is required')
    }
    if (data.name.length > 100) {
      errors.push('Name must be less than 100 characters')
    }
  }
  
  if (data.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push('Valid email is required')
    }
  }
  
  return errors
}

/**
 * Check if user has specific role
 */
export function hasRole(userRoles: string[] | undefined, requiredRole: string): boolean {
  return userRoles?.includes(requiredRole) || false
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: string[] | undefined, requiredRoles: string[]): boolean {
  if (!userRoles || !requiredRoles.length) return false
  return requiredRoles.some(role => userRoles.includes(role))
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(userRoles: string[] | undefined, requiredRoles: string[]): boolean {
  if (!userRoles || !requiredRoles.length) return false
  return requiredRoles.every(role => userRoles.includes(role))
}

/**
 * Get user display name (fallback to email if name not available)
 */
export function getUserDisplayName(user: User): string {
  return user.name || user.email
}

/**
 * Format user for logging (safe, no sensitive data)
 */
export function getUserLogInfo(user: User): string {
  return `User(id=${user.id}, email=${user.email})`
}