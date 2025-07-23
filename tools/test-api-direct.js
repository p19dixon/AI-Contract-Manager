// Test the API directly with authentication
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') })

const baseUrl = 'http://localhost:3002/api'

async function testDirectAPI() {
  try {
    // Login first
    console.log('🔐 Logging in...')
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      })
    })
    
    const loginData = await loginResponse.json()
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.error}`)
    }
    
    console.log('✅ Login successful')
    console.log('📄 Login response:', JSON.stringify(loginData, null, 2))
    
    // Test the customers-without-access endpoint
    console.log('\n🔍 Testing /admin/customers-without-access...')
    const customersResponse = await fetch(`${baseUrl}/admin/customers-without-access`, {
      headers: {
        'Authorization': `Bearer ${loginData.data?.token || loginData.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Status: ${customersResponse.status}`)
    console.log(`📋 Headers:`, Object.fromEntries(customersResponse.headers.entries()))
    
    const customersData = await customersResponse.json()
    console.log('📄 Response body:', JSON.stringify(customersData, null, 2))
    
    if (customersData.success && customersData.data) {
      console.log(`\n✅ Found ${customersData.data.length} customers available for portal access:`)
      customersData.data.forEach(customer => {
        console.log(`   - ${customer.firstName} ${customer.lastName} (${customer.email})`)
      })
    } else {
      console.log('❌ API response indicates failure or no data')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

console.log('🚀 Testing admin API directly...\n')
await testDirectAPI()
console.log('\n✅ Test complete')