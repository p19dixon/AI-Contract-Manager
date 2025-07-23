import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../auth/jwtAuth.js'
import { customerStorage } from '../db/storage.js'

const router = Router()

// Validation schemas
const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  customerType: z.string().default('individual'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional()
})

const updateCustomerSchema = createCustomerSchema.partial()

// Get all customers
router.get('/', requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const customers = await customerStorage.findAll()
    
    res.json({
      success: true,
      data: customers
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    })
  }
})

// Get single customer by ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid customer ID'
      })
    }

    const customer = await customerStorage.findById(id)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }

    res.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    })
  }
})

// Create new customer
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createCustomerSchema.parse(req.body)
    
    const newCustomer = await customerStorage.create(validatedData)
    
    res.status(201).json({
      success: true,
      data: newCustomer
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Error creating customer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    })
  }
})

// Update customer
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid customer ID'
      })
    }

    const validatedData = updateCustomerSchema.parse(req.body)
    
    const updatedCustomer = await customerStorage.update(id, validatedData)
    
    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }

    res.json({
      success: true,
      data: updatedCustomer
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Error updating customer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    })
  }
})

// Delete customer
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid customer ID'
      })
    }

    const deleted = await customerStorage.delete(id)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    })
  }
})

export default router