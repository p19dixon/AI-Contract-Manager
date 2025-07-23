import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'
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

console.log('Creating admin user...')

const email = 'admin@test.com'
const password = 'admin123'
const name = 'Admin User'

try {
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)
  
  // Create user
  const [newUser] = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning()
  
  console.log('✅ Admin user created successfully!')
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Password: ${password}`)
  console.log(`👤 Name: ${name}`)
  console.log(`🎯 Role: admin`)
  console.log(`🆔 User ID: ${newUser.id}`)
  
} catch (error) {
  if (error.code === '23505') { // Unique constraint violation
    console.log('❌ User already exists with this email')
  } else {
    console.error('❌ Error creating user:', error.message)
  }
}

await client.end()
console.log('\n🎯 You can now login with:')
console.log(`   Email: ${email}`)
console.log(`   Password: ${password}`)