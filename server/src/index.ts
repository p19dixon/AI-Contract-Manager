import express from 'express'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Import middleware
import { sessionMiddleware } from './auth/session.js'
import { 
  corsOptions,
  helmetOptions,
  rateLimit,
  requestLogger,
  errorHandler,
  notFoundHandler,
  securityHeaders
} from './middleware/security.js'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// Import routes
import authRoutes from './routes/auth.js'
import contractRoutes from './routes/contracts.js'
import customerRoutes from './routes/customers.js'
import productRoutes from './routes/products.js'
import resellerRoutes from './routes/resellers.js'
import customerPortalRoutes from './routes/customerPortal.js'
import staffRoutes from './routes/staff.js'
import adminRoutes from './routes/admin.js'

// Import database connection check
import { checkDatabaseConnection } from './db/index.js'

// Load environment variables from root .env file
config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../.env') })

const app = express()
const PORT = process.env.PORT || 5000

// Trust proxy (for Replit)
app.set('trust proxy', 1)

// Security middleware
app.use(helmet(helmetOptions))
app.use(cors(corsOptions))
app.use(securityHeaders)

// Rate limiting - more permissive for development
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 })) // 1000 requests per 15 minutes

// Request parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Session management
app.use(sessionMiddleware)

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger)
}

// Cookie parser for JWT tokens
app.use(cookieParser())

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection()
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
        version: '1.0.0'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/products', productRoutes)
app.use('/api/resellers', resellerRoutes)
app.use('/api/customer-portal', customerPortalRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/admin', adminRoutes)

// Welcome endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Contract & Data Licensing Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      contracts: '/api/contracts',
      customers: '/api/customers',
      products: '/api/products',
      resellers: '/api/resellers',
      customerPortal: '/api/customer-portal',
      staff: '/api/staff'
    }
  })
})

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

// Start server
async function startServer() {
  try {
    // Check database connection
    console.log('Checking database connection...')
    const dbConnected = await checkDatabaseConnection()
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your DATABASE_URL.')
      process.exit(1)
    }
    
    console.log('✅ Database connection successful')
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`)
      console.log(`📋 Contracts API: http://localhost:${PORT}/api/contracts`)
      console.log(`👥 Customers API: http://localhost:${PORT}/api/customers`)
      console.log(`📦 Products API: http://localhost:${PORT}/api/products`)
      console.log(`🤝 Resellers API: http://localhost:${PORT}/api/resellers`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...')
  process.exit(0)
})

// Start the server
startServer()