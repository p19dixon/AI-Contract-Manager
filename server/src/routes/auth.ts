import { Router } from 'express'
import { z } from 'zod'
import { 
  AuthenticatedRequest, 
  requireAuth, 
  optionalAuth, 
  requireAdmin,
  generateToken,
  hashPassword,
  verifyPassword,
  validatePassword,
  getSafeUserData
} from '../auth/jwtAuth.js'
import { userStorage } from '../db/storage.js'

const router = Router()

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email address').optional()
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
})

// Register new user
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    
    // Validate password strength
    const passwordValidation = validatePassword(validatedData.password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password validation failed',
        details: passwordValidation.errors
      })
    }
    
    // Check if user already exists
    const existingUser = await userStorage.findByEmail(validatedData.email)
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      })
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)
    
    // Create user
    const newUser = await userStorage.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: 'user' // Default role
    })
    
    // Generate token
    const token = generateToken(newUser)
    
    // Update last login
    await userStorage.updateLastLogin(newUser.id)
    
    res.status(201).json({
      success: true,
      data: {
        user: getSafeUserData(newUser),
        token
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    })
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body)
    
    // Find user by email
    const user = await userStorage.findByEmail(validatedData.email)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      })
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(validatedData.password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
    }
    
    // Generate token
    const token = generateToken(user)
    
    // Update last login
    await userStorage.updateLastLogin(user.id)
    
    res.json({
      success: true,
      data: {
        user: getSafeUserData(user),
        token
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Login failed'
    })
  }
})

// Get current user
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: getSafeUserData(req.user!)
  })
})

// Update user profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body)
    
    // Check if email is already taken by another user
    if (validatedData.email && validatedData.email !== req.user!.email) {
      const existingUser = await userStorage.findByEmail(validatedData.email)
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(409).json({
          success: false,
          error: 'Email already taken'
        })
      }
    }
    
    // Update user
    const updatedUser = await userStorage.update(req.user!.id, validatedData)
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }
    
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
    
    console.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      error: 'Profile update failed'
    })
  }
})

// Change password
router.put('/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body)
    
    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      validatedData.currentPassword, 
      req.user!.password
    )
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      })
    }
    
    // Validate new password strength
    const passwordValidation = validatePassword(validatedData.newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'New password validation failed',
        details: passwordValidation.errors
      })
    }
    
    // Hash new password
    const hashedNewPassword = await hashPassword(validatedData.newPassword)
    
    // Update password
    const updatedUser = await userStorage.update(req.user!.id, {
      password: hashedNewPassword
    })
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Password change error:', error)
    res.status(500).json({
      success: false,
      error: 'Password change failed'
    })
  }
})

// Admin: Get all users
router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit
    
    const users = await userStorage.findAll(limit, offset)
    const total = await userStorage.count()
    
    res.json({
      success: true,
      data: users.map(user => getSafeUserData(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    })
  }
})

// Admin: Deactivate/activate user
router.put('/users/:id/status', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { isActive } = req.body
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean'
      })
    }
    
    const updatedUser = await userStorage.setActive(userId, isActive)
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }
    
    res.json({
      success: true,
      data: getSafeUserData(updatedUser)
    })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    })
  }
})

// Check authentication status
router.get('/status', optionalAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      isAuthenticated: !!req.user,
      user: req.user ? getSafeUserData(req.user) : null
    }
  })
})

export default router