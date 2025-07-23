import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './src/db/schema.js'

// Load environment variables
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') })

// Database connection
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const client = postgres(connectionString, { ssl: 'require' })
const db = drizzle(client)

console.log('Fetching all users...')

const allUsers = await db.select().from(users)
console.log('Total users:', allUsers.length)
console.log('Users:')

allUsers.forEach(user => {
  console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`)
})

await client.end()