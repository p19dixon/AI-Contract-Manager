import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { join } from 'path'
import { 
  AuthenticatedRequest, 
  requireAuth, 
  requireCustomer 
} from '../auth/jwtAuth.js'
import { 
  contractStorage, 
  productStorage, 
  purchaseOrderStorage 
} from '../db/storage.js'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/purchase-orders/')
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    cb(null, `${timestamp}-${file.originalname}`)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, and images are allowed.'))
    }
  }
})

// Validation schemas
const newContractSchema = z.object({
  productId: z.number().int().positive(),
  contractTerm: z.number().int().min(1).max(10).default(1),
  billingCycle: z.enum(['annual', 'monthly', 'quarterly']).default('annual'),
  notes: z.string().optional()
})

const uploadPOSchema = z.object({
  contractId: z.number().int().positive(),
  poNumber: z.string().min(1, 'PO number is required').max(50, 'PO number too long')
})

// Get customer dashboard data
router.get('/dashboard', requireAuth, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const customer = req.customer!
    
    // Get customer's contracts
    const contracts = await contractStorage.findByCustomerId(customer.id)
    
    // Get available products for ordering
    const products = await productStorage.findActive()
    
    // Get purchase orders
    const purchaseOrders = await purchaseOrderStorage.findByCustomerId(customer.id)
    
    // Calculate statistics
    const activeContracts = contracts.filter(c => 
      ['BILLED', 'RECEIVED', 'PAID'].includes(c.billingStatus)
    )
    const pendingContracts = contracts.filter(c => c.billingStatus === 'PENDING')
    const totalValue = contracts.reduce((sum, c) => sum + parseFloat(c.netAmount || '0'), 0)
    
    res.json({
      success: true,
      data: {
        customer: {
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          type: customer.customerType
        },
        contracts: {
          all: contracts,
          active: activeContracts,
          pending: pendingContracts,
          total: contracts.length,
          totalValue: totalValue.toFixed(2)
        },
        products,
        purchaseOrders
      }
    })
  } catch (error) {
    console.error('Customer dashboard error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard'
    })
  }
})

// Get customer's contracts with filtering
router.get('/contracts', requireAuth, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const customer = req.customer!
    const status = req.query.status as string
    
    let contracts = await contractStorage.findByCustomerId(customer.id)
    
    // Filter by status if provided
    if (status && status !== 'all') {
      if (status === 'active') {
        contracts = contracts.filter(c => 
          ['BILLED', 'RECEIVED', 'PAID'].includes(c.billingStatus)
        )
      } else if (status === 'inactive') {
        contracts = contracts.filter(c => 
          ['PENDING', 'CANCELED', 'LATE'].includes(c.billingStatus)
        )
      } else {
        contracts = contracts.filter(c => c.billingStatus === status)
      }
    }
    
    res.json({
      success: true,
      data: contracts
    })
  } catch (error) {
    console.error('Get contracts error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load contracts'
    })
  }
})

// Get specific contract details
router.get('/contracts/:id', requireAuth, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const customer = req.customer!
    const contractId = parseInt(req.params.id)
    
    const contract = await contractStorage.findByIdWithRelations(contractId)
    
    if (!contract || contract.customerId !== customer.id) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      })
    }
    
    // Get purchase orders for this contract
    const purchaseOrders = await purchaseOrderStorage.findByContractId(contractId)
    
    res.json({
      success: true,
      data: {
        contract,
        purchaseOrders
      }
    })
  } catch (error) {
    console.error('Get contract error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load contract'
    })
  }
})

// Order new license/contract
router.post('/contracts', requireAuth, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const customer = req.customer!
    const validatedData = newContractSchema.parse(req.body)
    
    // Get product details
    const product = await productStorage.findById(validatedData.productId)
    if (!product || !product.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Product not found or inactive'
      })
    }
    
    // Calculate dates
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + validatedData.contractTerm)
    
    // Create new contract
    const newContract = await contractStorage.create({
      customerId: customer.id,
      productId: validatedData.productId,
      contractTerm: validatedData.contractTerm,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      billingCycle: validatedData.billingCycle,
      billingStatus: 'PENDING',
      amount: product.basePrice,
      resellerMargin: '0',
      netAmount: product.basePrice,
      notes: validatedData.notes
    })
    
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
    
    console.error('Create contract error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create contract'
    })
  }
})

// Upload purchase order
router.post('/purchase-orders', requireAuth, requireCustomer, upload.single('poFile'), async (req: AuthenticatedRequest, res) => {
  try {
    const customer = req.customer!
    const validatedData = uploadPOSchema.parse(req.body)
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      })
    }
    
    // Verify contract belongs to customer
    const contract = await contractStorage.findById(validatedData.contractId)
    if (!contract || contract.customerId !== customer.id) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      })
    }
    
    // Create purchase order record
    const newPO = await purchaseOrderStorage.create({
      contractId: validatedData.contractId,
      customerId: customer.id,
      poNumber: validatedData.poNumber,
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'pending'
    })
    
    res.status(201).json({
      success: true,
      data: newPO
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Upload PO error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload purchase order'
    })
  }
})

// Get available products for ordering
router.get('/products', requireAuth, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const products = await productStorage.findActive()
    
    res.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load products'
    })
  }
})

// Get customer's purchase orders
router.get('/purchase-orders', requireAuth, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const customer = req.customer!
    const purchaseOrders = await purchaseOrderStorage.findByCustomerId(customer.id)
    
    res.json({
      success: true,
      data: purchaseOrders
    })
  } catch (error) {
    console.error('Get purchase orders error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load purchase orders'
    })
  }
})

export default router