import { db } from './index.js'
import { users, customers } from './schema.js'
import { eq, sql, desc, and, isNull, isNotNull } from 'drizzle-orm'

async function testQueries() {
  try {
    console.log('Testing customer access queries...\n')
    
    // Test 1: Check what the current buggy query returns
    console.log('1. Current buggy query from /customer-access endpoint:')
    const buggyQuery = await db
      .select({
        id: customers.id,
        customerId: customers.id,
        userId: customers.userId,
        canLogin: customers.canLogin,
        loginEmail: users.email,
        lastLoginAt: users.lastLoginAt,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          customerType: customers.customerType
        }
      })
      .from(customers)
      .leftJoin(users, eq(customers.userId, users.id))
      .where(and(
        sql`${customers.userId} IS NOT NULL`,
        sql`${customers.canLogin} = true OR ${customers.canLogin} = false`
      ))
      .orderBy(desc(customers.createdAt))
    
    console.log(`Found ${buggyQuery.length} results:`)
    buggyQuery.forEach(row => {
      console.log(`  - ${row.customer.firstName} ${row.customer.lastName}, userId: ${row.userId}, canLogin: ${row.canLogin}`)
    })
    
    // Test 2: Correct query - customers who actually have users
    console.log('\n2. Correct query - customers with userId not null:')
    const correctQuery = await db
      .select({
        id: customers.id,
        customerId: customers.id,
        userId: customers.userId,
        canLogin: customers.canLogin,
        loginEmail: users.email,
        lastLoginAt: users.lastLoginAt,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          customerType: customers.customerType
        }
      })
      .from(customers)
      .leftJoin(users, eq(customers.userId, users.id))
      .where(isNotNull(customers.userId))
      .orderBy(desc(customers.createdAt))
    
    console.log(`Found ${correctQuery.length} results:`)
    correctQuery.forEach(row => {
      console.log(`  - ${row.customer.firstName} ${row.customer.lastName}, userId: ${row.userId}, canLogin: ${row.canLogin}`)
    })
    
    // Test 3: Check customers without access
    console.log('\n3. Customers without access (userId is null):')
    const withoutAccess = await db
      .select()
      .from(customers)
      .where(isNull(customers.userId))
      .orderBy(customers.firstName, customers.lastName)
    
    console.log(`Found ${withoutAccess.length} results:`)
    withoutAccess.forEach(row => {
      console.log(`  - ${row.firstName} ${row.lastName}, userId: ${row.userId}, canLogin: ${row.canLogin}`)
    })
    
    // Test 4: Check all customers to verify data
    console.log('\n4. All customers in database:')
    const allCustomers = await db
      .select()
      .from(customers)
      .orderBy(customers.firstName, customers.lastName)
    
    console.log(`Found ${allCustomers.length} total customers:`)
    allCustomers.forEach(row => {
      console.log(`  - ${row.firstName} ${row.lastName}, userId: ${row.userId}, canLogin: ${row.canLogin}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error testing queries:', error)
    process.exit(1)
  }
}

testQueries()