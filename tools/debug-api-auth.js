// Test authenticated API calls
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') })

const baseUrl = 'http://localhost:3002/api'

// First login to get a token
async function login() {
  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'peter@pdixon.biz',  // Admin account from database
        password: 'password123'      // Try common password
      })
    })
    
    const data = await response.json()
    if (response.ok) {
      console.log('✅ Login successful')
      return data.token
    } else {
      console.log('❌ Login failed:', data.error)
      return null
    }
  } catch (error) {
    console.log('❌ Login error:', error.message)
    return null
  }
}

// Test authenticated endpoint
async function testAuthenticatedEndpoint(token, endpoint, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`)
    console.log(`   URL: ${baseUrl}${endpoint}`)
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    
    return { success: response.ok, data }
  } catch (error) {
    console.log(`   Error:`, error.message)
    return { success: false, error: error.message }
  }
}

// Main test
console.log('🚀 Testing authenticated admin API endpoints...')

const token = await login()

if (token) {
  await testAuthenticatedEndpoint(token, '/admin/customers-without-access', 'Customers without portal access')
  await testAuthenticatedEndpoint(token, '/admin/customer-access', 'Customers with portal access')
} else {
  console.log('❌ Cannot test endpoints without authentication')
}

console.log('\n✅ Test complete')