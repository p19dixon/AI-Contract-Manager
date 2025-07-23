import { db } from './index.js'
import { users, customers } from './schema.js'

async function checkData() {
  try {
    console.log('Checking database data...')
    
    const allUsers = await db.select().from(users)
    console.log('Users in database:', JSON.stringify(allUsers, null, 2))
    
    const allCustomers = await db.select().from(customers)
    console.log('Customers in database:', JSON.stringify(allCustomers, null, 2))
    
    console.log('Database check complete')
    process.exit(0)
  } catch (error) {
    console.error('Error checking database:', error)
    process.exit(1)
  }
}

checkData()