import { generateToken, verifyToken } from '../auth/jwtAuth.js'
import { userStorage } from '../db/storage.js'

async function testAuth() {
  try {
    console.log('Testing authentication...')
    
    // Get user
    const user = await userStorage.findByEmail('peter@pdixon.biz')
    console.log('Found user:', JSON.stringify(user, null, 2))
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    // Generate token
    const token = generateToken(user)
    console.log('Generated token:', token)
    
    // Verify token
    const payload = verifyToken(token)
    console.log('Verified payload:', JSON.stringify(payload, null, 2))
    
    console.log('✅ Authentication test passed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Authentication test failed:', error)
    process.exit(1)
  }
}

testAuth()