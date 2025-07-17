import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'
import { config } from 'dotenv'

// Load environment variables from the root .env file
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runMigration() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const sql = postgres(connectionString)

  try {
    console.log('Connecting to database...')
    
    // Read and execute the migration SQL
    const migrationPath = join(__dirname, 'migrations', '0001_initial.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('Running migration...')
    await sql.unsafe(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    console.log('📋 Created tables:')
    tables.forEach(table => console.log(`  - ${table.table_name}`))
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runMigration()