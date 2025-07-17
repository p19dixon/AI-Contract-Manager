import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../auth/jwtAuth.js'
import { contractStorage } from '../db/storage.js'

const router = Router()

// Validation schemas
const createContractSchema = z.object({
  customerId: z.number().min(1, 'Customer is required'),
  productId: z.number().min(1, 'Product is required'),
  resellerId: z.number().optional(),
  contractTerm: z.number().min(1, 'Contract term must be at least 1 year').default(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  billingCycle: z.enum(['annual', 'monthly', 'quarterly']).default('annual'),
  billingStatus: z.enum(['PENDING', 'BILLED', 'RECEIVED', 'PAID', 'LATE', 'CANCELED']).default('PENDING'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  resellerMargin: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid margin format').optional(),
  netAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid net amount format'),
  notes: z.string().optional()
})

const updateContractSchema = createContractSchema.partial()

// Get all contracts with relationships
router.get('/', requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const contracts = await contractStorage.findAllWithRelations()
    
    res.json({
      success: true,
      data: contracts
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts'
    })
  }
})

// Get single contract by ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract ID'
      })
    }

    const contract = await contractStorage.findByIdWithRelations(id)
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      })
    }

    res.json({
      success: true,
      data: contract
    })
  } catch (error) {
    console.error('Error fetching contract:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract'
    })
  }
})

// Create new contract
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createContractSchema.parse(req.body)
    
    const newContract = await contractStorage.create(validatedData)
    
    res.status(201).json({
      success: true,
      data: newContract
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Error creating contract:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create contract'
    })
  }
})

// Update contract
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract ID'
      })
    }

    const validatedData = updateContractSchema.parse(req.body)
    
    const updatedContract = await contractStorage.update(id, validatedData)
    
    if (!updatedContract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      })
    }

    res.json({
      success: true,
      data: updatedContract
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Error updating contract:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update contract'
    })
  }
})

// Delete contract
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract ID'
      })
    }

    const deleted = await contractStorage.delete(id)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      })
    }

    res.json({
      success: true,
      message: 'Contract deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting contract:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete contract'
    })
  }
})

// Get contracts by status
router.get('/status/:status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.params
    
    const contracts = await contractStorage.findByStatus(status)
    
    res.json({
      success: true,
      data: contracts
    })
  } catch (error) {
    console.error('Error fetching contracts by status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts'
    })
  }
})

export default router