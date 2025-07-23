import { db } from './index.js'
import { sql } from 'drizzle-orm'

async function runCustomerPortalMigration() {
  try {
    console.log('Starting customer portal migration...')
    
    // Add new columns to customers table
    await db.execute(sql`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS can_login BOOLEAN DEFAULT FALSE;
    `)
    console.log('✅ Added customer portal columns to customers table')
    
    // Update users table to support customer role
    await db.execute(sql`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS check_role;
    `)
    
    await db.execute(sql`
      ALTER TABLE users 
      ADD CONSTRAINT check_role CHECK (role IN ('user', 'admin', 'customer'));
    `)
    console.log('✅ Updated users table to support customer role')
    
    // Create purchase_orders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        po_number TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Created purchase_orders table')
    
    // Create indexes for performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_can_login ON customers(can_login);
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_contract_id ON purchase_orders(contract_id);
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_customer_id ON purchase_orders(customer_id);
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
    `)
    console.log('✅ Created indexes for performance')
    
    console.log('🎉 Customer portal migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runCustomerPortalMigration()