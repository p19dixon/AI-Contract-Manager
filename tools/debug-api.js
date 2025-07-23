// Direct test of the admin API endpoints
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') })

const baseUrl = 'http://localhost:3002/api'

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`)
    console.log(`   URL: ${baseUrl}${endpoint}`)
    
    const response = await fetch(`${baseUrl}${endpoint}`)
    const data = await response.json()
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    
    return { success: response.ok, data }
  } catch (error) {
    console.log(`   Error:`, error.message)
    return { success: false, error: error.message }
  }
}

// Test endpoints
console.log('🚀 Testing API endpoints...')

await testEndpoint('/health', 'Health check')
await testEndpoint('/customers', 'Regular customers endpoint')
await testEndpoint('/admin/customers-without-access', 'Admin customers without access (no auth)')

console.log('\n✅ Test complete')