// Simple test script for frontend authentication flow
const FRONTEND_URL = 'http://localhost:3000'
const API_URL = 'http://localhost:3002'

async function testFrontendAuth() {
  console.log('🧪 Testing Frontend Authentication Flow...\n')
  
  try {
    // Test 1: Check if frontend is running
    console.log('1. Testing frontend accessibility...')
    const frontendResponse = await fetch(FRONTEND_URL)
    if (frontendResponse.ok) {
      console.log('✅ Frontend is accessible at http://localhost:3000')
    } else {
      console.log('❌ Frontend not accessible')
      return
    }
    
    // Test 2: Check API proxy
    console.log('\n2. Testing API proxy...')
    const proxyResponse = await fetch(`${FRONTEND_URL}/api/auth/status`)
    if (proxyResponse.ok) {
      const proxyResult = await proxyResponse.json()
      console.log('✅ API proxy working')
      console.log('   Auth status:', proxyResult.data?.isAuthenticated ? 'Authenticated' : 'Not authenticated')
    } else {
      console.log('❌ API proxy not working')
    }
    
    // Test 3: Direct API test for comparison
    console.log('\n3. Testing direct API access...')
    const directResponse = await fetch(`${API_URL}/api/auth/status`)
    if (directResponse.ok) {
      const directResult = await directResponse.json()
      console.log('✅ Direct API access working')
      console.log('   Auth status:', directResult.data?.isAuthenticated ? 'Authenticated' : 'Not authenticated')
    } else {
      console.log('❌ Direct API access not working')
    }
    
    console.log('\n🎉 Frontend test completed!')
    console.log('\n📋 Next steps:')
    console.log('   1. Open http://localhost:3000 in your browser')
    console.log('   2. Try registering a new account')
    console.log('   3. Test login functionality')
    console.log('   4. Verify dashboard access after authentication')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFrontendAuth()