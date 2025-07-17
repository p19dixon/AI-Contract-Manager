import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as schema from './schema.js'

// Load environment variables from the root .env file
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create PostgreSQL connection
const sql = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30
})

// Create Drizzle instance
export const db = drizzle(sql, { schema })

// Export schema for external use
export * from './schema.js'

// Health check function
export async function checkDatabaseConnection() {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection...')
  await sql.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Closing database connection...')
  await sql.end()
  process.exit(0)
})