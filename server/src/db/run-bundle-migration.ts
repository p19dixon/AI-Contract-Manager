import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'
import { config } from 'dotenv'

// Load environment variables from the root .env file
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runBundleMigration() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const sql = postgres(connectionString)

  try {
    console.log('Connecting to database...')
    
    // Read and execute the bundle migration SQL
    const migrationPath = join(__dirname, 'migrations', '0003_add_product_bundle_pricing.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('Running bundle pricing migration...')
    await sql.unsafe(migrationSQL)
    
    console.log('✅ Bundle pricing migration completed successfully!')
    
    // Verify columns were added
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('original_price', 'discount_percentage')
      ORDER BY column_name
    `
    
    console.log('📋 Added columns:')
    columns.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`))
    
  } catch (error) {
    console.error('❌ Bundle migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runBundleMigration()