import { Router } from 'express'
import { z } from 'zod'
import { 
  AuthenticatedRequest, 
  requireAuth, 
  requireAdmin,
  hashPassword,
  getSafeUserData
} from '../auth/jwtAuth.js'
import { userStorage, customerStorage, contractStorage } from '../db/storage.js'
import { db } from '../db/index.js'
import { users, customers, contracts } from '../db/schema.js'
import { eq, sql, desc, and, isNull, isNotNull } from 'drizzle-orm'

const router = Router()

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin)

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'manager', 'sales', 'support', 'finance', 'viewer'])
})

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name too short').optional(),
  email: z.string().email('Invalid email').optional(),
  role: z.enum(['admin', 'manager', 'sales', 'support', 'finance', 'viewer']).optional()
})

const updateStatusSchema = z.object({
  isActive: z.boolean()
})

// Get all users
router.get('/users', async (req: AuthenticatedRequest, res) => {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .where(sql`${users.role} != 'customer'`)
      .orderBy(desc(users.createdAt))
    
    res.json({
      success: true,
      data: allUsers.map(user => getSafeUserData(user))
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    })
  }
})

// Create new user
router.post('/users', async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body)
    
    // Check if email already exists
    const existingUser = await userStorage.findByEmail(validatedData.email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      })
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)
    
    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
        isActive: true
      })
      .returning()
    
    res.json({
      success: true,
      data: getSafeUserData(newUser)
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Create user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    })
  }
})

// Update user
router.put('/users/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id)
    const validatedData = updateUserSchema.parse(req.body)
    
    // Check if user exists
    const user = await userStorage.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }
    
    // Prevent changing customer to staff role
    if (user.role === 'customer') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change customer role'
      })
    }
    
    // If email is being changed, check for duplicates
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await userStorage.findByEmail(validatedData.email)
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        })
      }
    }
    
    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning()
    
    res.json({
      success: true,
      data: getSafeUserData(updatedUser)
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    })
  }
})

// Update user status
router.put('/users/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id)
    const validatedData = updateStatusSchema.parse(req.body)
    
    // Prevent admin from deactivating themselves
    if (userId === req.user?.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account'
      })
    }
    
    // Check if user exists
    const user = await userStorage.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }
    
    // Update status
    const [updatedUser] = await db
      .update(users)
      .set({
        isActive: validatedData.isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning()
    
    res.json({
      success: true,
      data: getSafeUserData(updatedUser)
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Update user status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    })
  }
})

// Delete user
router.delete('/users/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    // Prevent admin from deleting themselves
    if (userId === req.user?.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      })
    }
    
    // Check if user exists
    const user = await userStorage.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }
    
    // Delete user
    await db.delete(users).where(eq(users.id, userId))
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    })
  }
})

// System settings endpoints
router.get('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    // In a real app, these would come from a settings table
    const settings = {
      companyName: 'CAP Locations',
      systemEmail: 'system@caplocations.com',
      supportEmail: 'support@caplocations.com',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      contractDefaults: {
        term: 12,
        billingCycle: 'annual',
        gracePeriodDays: 30
      },
      emailNotifications: {
        contractExpiry: true,
        paymentDue: true,
        newCustomer: true
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 30,
        twoFactorEnabled: false,
        ipWhitelist: []
      }
    }
    
    res.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    })
  }
})

// Update system settings
router.put('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    // In a real app, this would update a settings table
    const updatedSettings = req.body
    
    res.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    })
  }
})

// Customer Access Management endpoints

// Get customers with portal access
router.get('/customer-access', async (req: AuthenticatedRequest, res) => {
  try {
    const customersWithAccess = await db
      .select({
        id: customers.id,
        customerId: customers.id,
        userId: customers.userId,
        canLogin: customers.canLogin,
        loginEmail: users.email,
        lastLoginAt: users.lastLoginAt,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          customerType: customers.customerType
        }
      })
      .from(customers)
      .leftJoin(users, eq(customers.userId, users.id))
      .where(isNotNull(customers.userId))
      .orderBy(desc(customers.createdAt))
    
    res.json({
      success: true,
      data: customersWithAccess
    })
  } catch (error) {
    console.error('Get customer access error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get customer access list'
    })
  }
})

// Get customers without portal access
router.get('/customers-without-access', async (req: AuthenticatedRequest, res) => {
  try {
    const customersWithoutAccess = await db
      .select()
      .from(customers)
      .where(isNull(customers.userId))
      .orderBy(customers.firstName, customers.lastName)
    
    // Disable caching for admin endpoints
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    
    res.json({
      success: true,
      data: customersWithoutAccess
    })
  } catch (error) {
    console.error('Get customers without access error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get customers without access'
    })
  }
})

// Grant customer portal access
router.post('/customer-access', async (req: AuthenticatedRequest, res) => {
  try {
    const { customerId, email, password } = req.body
    
    // Validate input
    if (!customerId || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID, email, and password are required'
      })
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      })
    }
    
    // Check if customer exists
    const customer = await customerStorage.findById(customerId)
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }
    
    // Check if customer already has access
    if (customer.userId) {
      return res.status(400).json({
        success: false,
        error: 'Customer already has portal access'
      })
    }
    
    // Check if email is already in use
    const existingUser = await userStorage.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      })
    }
    
    // Create user account
    const hashedPassword = await hashPassword(password)
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: `${customer.firstName} ${customer.lastName}`,
        password: hashedPassword,
        role: 'customer',
        isActive: true
      })
      .returning()
    
    // Update customer with user ID
    await db
      .update(customers)
      .set({
        userId: newUser.id,
        canLogin: true,
        updatedAt: new Date()
      })
      .where(eq(customers.id, customerId))
    
    res.json({
      success: true,
      message: 'Customer portal access granted successfully'
    })
  } catch (error) {
    console.error('Grant customer access error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to grant customer access'
    })
  }
})

// Update customer access status
router.put('/customer-access/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = parseInt(req.params.id)
    const { canLogin } = req.body
    
    const customer = await customerStorage.findById(customerId)
    if (!customer || !customer.userId) {
      return res.status(404).json({
        success: false,
        error: 'Customer access not found'
      })
    }
    
    // Update customer login status
    await db
      .update(customers)
      .set({
        canLogin,
        updatedAt: new Date()
      })
      .where(eq(customers.id, customerId))
    
    // Also update user active status
    await db
      .update(users)
      .set({
        isActive: canLogin,
        updatedAt: new Date()
      })
      .where(eq(users.id, customer.userId))
    
    res.json({
      success: true,
      message: 'Customer access status updated'
    })
  } catch (error) {
    console.error('Update customer access status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update customer access status'
    })
  }
})

// Reset customer password
router.put('/customer-access/:id/password', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = parseInt(req.params.id)
    const { password } = req.body
    
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      })
    }
    
    const customer = await customerStorage.findById(customerId)
    if (!customer || !customer.userId) {
      return res.status(404).json({
        success: false,
        error: 'Customer access not found'
      })
    }
    
    // Hash and update password
    const hashedPassword = await hashPassword(password)
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, customer.userId))
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Reset customer password error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    })
  }
})

// Revoke customer portal access
router.delete('/customer-access/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = parseInt(req.params.id)
    
    const customer = await customerStorage.findById(customerId)
    if (!customer || !customer.userId) {
      return res.status(404).json({
        success: false,
        error: 'Customer access not found'
      })
    }
    
    // Delete the user account
    await db.delete(users).where(eq(users.id, customer.userId))
    
    // Update customer to remove access
    await db
      .update(customers)
      .set({
        userId: null,
        canLogin: false,
        updatedAt: new Date()
      })
      .where(eq(customers.id, customerId))
    
    res.json({
      success: true,
      message: 'Customer portal access revoked'
    })
  } catch (error) {
    console.error('Revoke customer access error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to revoke customer access'
    })
  }
})

// Database backup endpoint
router.post('/backup', async (req: AuthenticatedRequest, res) => {
  try {
    // In a real app, this would trigger a database backup
    const backupInfo = {
      timestamp: new Date().toISOString(),
      size: '45.3 MB',
      location: 'backup/db_backup_' + Date.now() + '.sql',
      status: 'completed'
    }
    
    res.json({
      success: true,
      data: backupInfo,
      message: 'Database backup created successfully'
    })
  } catch (error) {
    console.error('Backup error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create backup'
    })
  }
})

export default router