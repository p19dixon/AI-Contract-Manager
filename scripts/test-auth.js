// Simple test script for authentication endpoints
const BASE_URL = 'http://localhost:3002'

async function testAuth() {
  console.log('🧪 Testing JWT Authentication System...\n')
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch(`${BASE_URL}/health`)
    const health = await healthResponse.json()
    console.log('✅ Health:', health.data?.status)
    
    // Test 2: Register new user
    console.log('\n2. Testing user registration...')
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePass123!'
    }
    
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    })
    
    if (registerResponse.ok) {
      const registerResult = await registerResponse.json()
      console.log('✅ Registration successful!')
      console.log('   User ID:', registerResult.data.user.id)
      console.log('   Token received:', !!registerResult.data.token)
      
      const token = registerResult.data.token
      
      // Test 3: Get current user with token
      console.log('\n3. Testing authenticated endpoint...')
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (meResponse.ok) {
        const meResult = await meResponse.json()
        console.log('✅ Authenticated request successful!')
        console.log('   User:', meResult.data.name, '(' + meResult.data.email + ')')
      } else {
        console.log('❌ Authenticated request failed')
      }
      
      // Test 4: Login with credentials
      console.log('\n4. Testing login...')
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password
        })
      })
      
      if (loginResponse.ok) {
        const loginResult = await loginResponse.json()
        console.log('✅ Login successful!')
        console.log('   Token received:', !!loginResult.data.token)
      } else {
        console.log('❌ Login failed')
      }
      
    } else {
      const error = await registerResponse.json()
      if (error.error?.includes('already exists')) {
        console.log('ℹ️  User already exists, testing login instead...')
        
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: registerData.email,
            password: registerData.password
          })
        })
        
        if (loginResponse.ok) {
          console.log('✅ Login successful!')
        } else {
          console.log('❌ Login failed')
        }
      } else {
        console.log('❌ Registration failed:', error.error)
      }
    }
    
    console.log('\n🎉 Authentication system test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAuth()