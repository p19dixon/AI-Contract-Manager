import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'
import { config } from 'dotenv'

// Load environment variables from the root .env file
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runUserMigration() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const sql = postgres(connectionString)

  try {
    console.log('Connecting to database...')
    
    // Read and execute the user migration SQL
    const migrationPath = join(__dirname, 'migrations', '0002_update_users.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('Running user migration...')
    await sql.unsafe(migrationSQL)
    
    console.log('✅ User migration completed successfully!')
    
    // Verify the users table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `
    
    console.log('📋 Users table structure:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
  } catch (error) {
    console.error('❌ User migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runUserMigration()