import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../auth/jwtAuth.js'
import { resellerStorage } from '../db/storage.js'

const router = Router()

// Validation schemas
const createResellerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  marginPercentage: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid margin percentage format'),
  isActive: z.boolean().default(true),
  notes: z.string().optional()
})

const updateResellerSchema = createResellerSchema.partial()

// Get all resellers
router.get('/', requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const resellers = await resellerStorage.findAll()
    
    res.json({
      success: true,
      data: resellers
    })
  } catch (error) {
    console.error('Error fetching resellers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resellers'
    })
  }
})

// Get single reseller by ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reseller ID'
      })
    }

    const reseller = await resellerStorage.findById(id)
    
    if (!reseller) {
      return res.status(404).json({
        success: false,
        error: 'Reseller not found'
      })
    }

    res.json({
      success: true,
      data: reseller
    })
  } catch (error) {
    console.error('Error fetching reseller:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reseller'
    })
  }
})

// Create new reseller
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createResellerSchema.parse(req.body)
    
    const newReseller = await resellerStorage.create(validatedData)
    
    res.status(201).json({
      success: true,
      data: newReseller
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Error creating reseller:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create reseller'
    })
  }
})

// Update reseller
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reseller ID'
      })
    }

    const validatedData = updateResellerSchema.parse(req.body)
    
    const updatedReseller = await resellerStorage.update(id, validatedData)
    
    if (!updatedReseller) {
      return res.status(404).json({
        success: false,
        error: 'Reseller not found'
      })
    }

    res.json({
      success: true,
      data: updatedReseller
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Error updating reseller:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update reseller'
    })
  }
})

// Delete reseller
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reseller ID'
      })
    }

    const deleted = await resellerStorage.delete(id)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Reseller not found'
      })
    }

    res.json({
      success: true,
      message: 'Reseller deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting reseller:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete reseller'
    })
  }
})

export default router