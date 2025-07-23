import { Router } from 'express'
import { z } from 'zod'
import { 
  AuthenticatedRequest, 
  requireAuth, 
  requireStaff,
  requirePermission
} from '../auth/jwtAuth.js'
import { customerStorage, userStorage } from '../db/storage.js'
import { Permissions } from '../auth/permissions.js'

const router = Router()

// All staff routes require authentication and staff role
router.use(requireAuth, requireStaff)

// Validation schemas
const updateCustomerStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'pending_approval']),
  notes: z.string().optional()
})

const assignCustomerSchema = z.object({
  assignedToId: z.number().int().positive()
})

const updateNotesSchema = z.object({
  notes: z.string().max(1000, 'Notes too long')
})

// Get all customers with staff information
router.get('/customers', requirePermission(Permissions.CUSTOMER_READ), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit
    const status = req.query.status as string
    const assignedTo = req.query.assignedTo as string
    
    let customers
    
    if (status) {
      customers = await customerStorage.findByStatus(status, limit, offset)
    } else if (assignedTo) {
      customers = await customerStorage.findAssignedTo(parseInt(assignedTo), limit, offset)
    } else {
      customers = await customerStorage.findWithRelations(limit, offset)
    }
    
    const total = await customerStorage.count()
    
    res.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get customers'
    })
  }
})

// Get specific customer with full details
router.get('/customers/:id', requirePermission(Permissions.CUSTOMER_READ), async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = parseInt(req.params.id)
    const customer = await customerStorage.findById(customerId)
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }
    
    // Get assigned staff and approver info
    let assignedTo = null
    let approvedBy = null
    
    if (customer.assignedToId) {
      assignedTo = await userStorage.findById(customer.assignedToId)
    }
    
    if (customer.approvedById) {
      approvedBy = await userStorage.findById(customer.approvedById)
    }
    
    res.json({
      success: true,
      data: {
        ...customer,
        assignedTo,
        approvedBy
      }
    })
  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get customer'
    })
  }
})

// Update customer status
router.put('/customers/:id/status', requirePermission(Permissions.CUSTOMER_UPDATE), async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = parseInt(req.params.id)
    const validatedData = updateCustomerStatusSchema.parse(req.body)
    
    const customer = await customerStorage.findById(customerId)
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }
    
    // Check permission for approve/suspend actions
    if (validatedData.status === 'active' && customer.status === 'pending_approval') {
      if (!req.user || !req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Invalid user session'
        })
      }
      
      // This is an approval action
      const updatedCustomer = await customerStorage.updateStatus(customerId, validatedData.status, req.user.id)
      
      res.json({
        success: true,
        data: updatedCustomer
      })
    } else if (validatedData.status === 'suspended') {
      // Check suspend permission
      if (!req.user || !req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Invalid user session'
        })
      }
      
      const updatedCustomer = await customerStorage.updateStatus(customerId, validatedData.status)
      
      res.json({
        success: true,
        data: updatedCustomer
      })
    } else {
      // Regular status update
      const updatedCustomer = await customerStorage.updateStatus(customerId, validatedData.status)
      
      res.json({
        success: true,
        data: updatedCustomer
      })
    }
    
    // Update notes if provided
    if (validatedData.notes) {
      await customerStorage.updateNotes(customerId, validatedData.notes)
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Update customer status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update customer status'
    })
  }
})

// Assign customer to staff member
router.put('/customers/:id/assign', requirePermission(Permissions.CUSTOMER_ASSIGN), async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = parseInt(req.params.id)
    const validatedData = assignCustomerSchema.parse(req.body)
    
    const customer = await customerStorage.findById(customerId)
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }
    
    // Verify the assigned user exists and is staff
    const assignedUser = await userStorage.findById(validatedData.assignedToId)
    if (!assignedUser || assignedUser.role === 'customer') {
      return res.status(400).json({
        success: false,
        error: 'Invalid staff member'
      })
    }
    
    const updatedCustomer = await customerStorage.assignTo(customerId, validatedData.assignedToId)
    
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
    
    console.error('Assign customer error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to assign customer'
    })
  }
})

// Update customer notes
router.put('/customers/:id/notes', requirePermission(Permissions.CUSTOMER_UPDATE), async (req: AuthenticatedRequest, res) => {
  try {
    const customerId = parseInt(req.params.id)
    const validatedData = updateNotesSchema.parse(req.body)
    
    const customer = await customerStorage.findById(customerId)
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }
    
    const updatedCustomer = await customerStorage.updateNotes(customerId, validatedData.notes)
    
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
    
    console.error('Update notes error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update notes'
    })
  }
})

// Get all staff members for assignment
router.get('/staff', requirePermission(Permissions.USER_READ), async (req: AuthenticatedRequest, res) => {
  try {
    const staff = await userStorage.findAll(100, 0)
    const staffOnly = staff.filter(user => user.role !== 'customer')
    
    res.json({
      success: true,
      data: staffOnly.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }))
    })
  } catch (error) {
    console.error('Get staff error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get staff'
    })
  }
})

// Get customer statistics
router.get('/stats', requirePermission(Permissions.ANALYTICS_READ), async (req: AuthenticatedRequest, res) => {
  try {
    const total = await customerStorage.count()
    const active = await customerStorage.findByStatus('active', 1000, 0)
    const pending = await customerStorage.findByStatus('pending_approval', 1000, 0)
    const suspended = await customerStorage.findByStatus('suspended', 1000, 0)
    const inactive = await customerStorage.findByStatus('inactive', 1000, 0)
    
    res.json({
      success: true,
      data: {
        total,
        active: active.length,
        pending: pending.length,
        suspended: suspended.length,
        inactive: inactive.length
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    })
  }
})

export default router