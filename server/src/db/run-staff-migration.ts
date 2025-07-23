import { db } from './index.js'
import { sql } from 'drizzle-orm'

async function runStaffMigration() {
  try {
    console.log('Starting staff management migration...')
    
    // Add new columns to customers table
    await db.execute(sql`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval')),
      ADD COLUMN IF NOT EXISTS assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS approved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    `)
    console.log('✅ Added customer management columns')
    
    // Update users table constraint to support new roles
    await db.execute(sql`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS check_role;
    `)
    
    await db.execute(sql`
      ALTER TABLE users 
      ADD CONSTRAINT check_role CHECK (role IN ('user', 'admin', 'customer', 'manager', 'sales', 'support'));
    `)
    console.log('✅ Updated users table to support new staff roles')
    
    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to_id);
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_approved_by ON customers(approved_by_id);
    `)
    console.log('✅ Created indexes for customer management')
    
    // Set existing customers to active status if they were null
    await db.execute(sql`
      UPDATE customers 
      SET status = 'active' 
      WHERE status IS NULL;
    `)
    console.log('✅ Updated existing customers to active status')
    
    console.log('🎉 Staff management migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runStaffMigration()