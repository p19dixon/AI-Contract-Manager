import { db } from './index.js'
import { users } from './schema.js'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...')
    
    // Hash the new password
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    // Update the admin user's password
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.email, 'peter@pdixon.biz'))
      .returning()
    
    if (result.length > 0) {
      console.log('✅ Admin password reset successfully')
      console.log(`New password: ${newPassword}`)
      console.log(`Email: ${result[0].email}`)
    } else {
      console.log('❌ Admin user not found')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error resetting admin password:', error)
    process.exit(1)
  }
}

resetAdminPassword()