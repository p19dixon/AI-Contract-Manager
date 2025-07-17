import { checkDatabaseConnection } from './index.js'

async function testConnection() {
  console.log('Testing database connection...')
  
  const isConnected = await checkDatabaseConnection()
  
  if (isConnected) {
    console.log('✅ Database connection successful!')
  } else {
    console.log('❌ Database connection failed!')
  }
  
  process.exit(0)
}

testConnection()