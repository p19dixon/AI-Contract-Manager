import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { customers } from './src/db/schema.js'

// Load environment variables
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') })

// Database connection
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const client = postgres(connectionString, { ssl: 'require' })
const db = drizzle(client)

console.log('Fetching all customers...')

const allCustomers = await db.select().from(customers)
console.log('Total customers:', allCustomers.length)
console.log('Customers:', JSON.stringify(allCustomers, null, 2))

const customersWithUserId = allCustomers.filter(c => c.userId !== null)
const customersWithoutUserId = allCustomers.filter(c => c.userId === null)

console.log('\nCustomers WITH userId (have portal access):', customersWithUserId.length)
console.log('Customers WITHOUT userId (available for granting access):', customersWithoutUserId.length)

if (customersWithoutUserId.length > 0) {
  console.log('\nCustomers available for portal access:')
  customersWithoutUserId.forEach(customer => {
    console.log(`- ${customer.firstName} ${customer.lastName} (${customer.email}) - ${customer.customerType}`)
  })
} else {
  console.log('\nNo customers available for granting portal access')
}

await client.end()