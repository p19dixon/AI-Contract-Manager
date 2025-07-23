import { db } from './index.js'
import { users } from './schema.js'
import { eq } from 'drizzle-orm'

async function updateUserRole() {
  try {
    console.log('Updating user role...')
    
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, 'peter@pdixon.biz'))
      .returning()
    
    console.log('Updated user:', JSON.stringify(result[0], null, 2))
    console.log('✅ User role updated to admin')
    process.exit(0)
  } catch (error) {
    console.error('Error updating user role:', error)
    process.exit(1)
  }
}

updateUserRole()