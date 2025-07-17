import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../auth/jwtAuth.js'
import { productStorage } from '../db/storage.js'

const router = Router()

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  isBundle: z.boolean().default(false),
  bundleProducts: z.string().optional(),
  originalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').optional(),
  discountPercentage: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid discount format').optional(),
  isActive: z.boolean().default(true)
})

const updateProductSchema = createProductSchema.partial()

// Get all products
router.get('/', requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const products = await productStorage.findAll()
    
    res.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    })
  }
})

// Get single product by ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      })
    }

    const product = await productStorage.findById(id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    })
  }
})

// Create new product
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createProductSchema.parse(req.body)
    
    const newProduct = await productStorage.create(validatedData)
    
    res.status(201).json({
      success: true,
      data: newProduct
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Error creating product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    })
  }
})

// Update product
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      })
    }

    const validatedData = updateProductSchema.parse(req.body)
    
    const updatedProduct = await productStorage.update(id, validatedData)
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: updatedProduct
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => e.message)
      })
    }
    
    console.error('Error updating product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    })
  }
})

// Delete product
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      })
    }

    const deleted = await productStorage.delete(id)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    })
  }
})

// Get products by category
router.get('/category/:category', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { category } = req.params
    
    const products = await productStorage.findByCategory(category)
    
    res.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Error fetching products by category:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    })
  }
})

// Get active products only
router.get('/active/list', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const products = await productStorage.findActive()
    
    res.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Error fetching active products:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active products'
    })
  }
})

export default router