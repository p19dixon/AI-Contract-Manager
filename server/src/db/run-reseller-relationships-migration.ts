import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'
import postgres from 'postgres'

// Load environment variables
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const sql = postgres(connectionString)

async function runMigration() {
  try {
    console.log('🚀 Running reseller relationships migration...')
    
    // Read the migration file
    const migrationSQL = await readFile(
      join(dirname(fileURLToPath(import.meta.url)), 'migrations', '0006_add_reseller_relationships.sql'),
      'utf-8'
    )
    
    // Execute the migration
    await sql.unsafe(migrationSQL)
    
    console.log('✅ Reseller relationships migration completed successfully!')
    console.log('📋 Changes applied:')
    console.log('   - Added reseller_id to customers table')
    console.log('   - Added address fields to resellers table')
    console.log('   - Created reseller_contacts table')
    console.log('   - Added indexes for performance')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runMigration()