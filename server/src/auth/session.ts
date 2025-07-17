import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import postgres from 'postgres'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from the root .env file
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

const PgSession = connectPgSimple(session)

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required for session storage')
}

// Create PostgreSQL connection for sessions
const sessionSql = postgres(connectionString)

// Session configuration
export const sessionConfig = {
  store: new PgSession({
    conObject: {
      connectionString,
      ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    },
    tableName: 'session', // Table name for session storage
    createTableIfMissing: true // Automatically create session table
  }),
  secret: process.env.SESSION_SECRET || 'your-super-secure-session-secret-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' as const // CSRF protection
  },
  name: 'contracts-saas-session' // Custom session name
}

// Session middleware
export const sessionMiddleware = session(sessionConfig)

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId?: string
    isAuthenticated?: boolean
    lastActivity?: number
  }
}

// Helper function to destroy all user sessions
export async function destroyUserSessions(userId: string): Promise<void> {
  try {
    await sessionSql`
      DELETE FROM session 
      WHERE sess->>'userId' = ${userId}
    `
  } catch (error) {
    console.error('Error destroying user sessions:', error)
  }
}

// Helper function to get active session count
export async function getActiveSessionCount(): Promise<number> {
  try {
    const result = await sessionSql`
      SELECT COUNT(*) as count 
      FROM session 
      WHERE expire > NOW()
    `
    return parseInt(result[0]?.count || '0')
  } catch (error) {
    console.error('Error getting active session count:', error)
    return 0
  }
}

// Cleanup expired sessions (can be run periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await sessionSql`
      DELETE FROM session 
      WHERE expire < NOW()
    `
    return result.count || 0
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error)
    return 0
  }
}