import { generateToken } from '../auth/jwtAuth.js'
import { userStorage } from '../db/storage.js'

async function testCustomersAPI() {
  try {
    console.log('Testing customers API...')
    
    const user = await userStorage.findByEmail('peter@pdixon.biz')
    console.log('User:', user ? { id: user.id, email: user.email, role: user.role } : 'Not found')
    
    const token = generateToken(user)
    console.log('Generated token:', token.substring(0, 50) + '...')
    
    const response = await fetch('http://localhost:3002/api/staff/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('API Response:', JSON.stringify(data, null, 2))
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testCustomersAPI()