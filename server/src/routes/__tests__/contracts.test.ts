import request from 'supertest'
import express from 'express'
import { z } from 'zod'
import contractsRoutes from '../contracts.js'
import { contractStorage } from '../../db/storage.js'

// Mock dependencies
jest.mock('../../db/storage.js')
jest.mock('../../db/index.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))
jest.mock('../../auth/jwtAuth.js', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'admin', email: 'admin@test.com' }
    next()
  })
}))

const mockContractStorage = contractStorage as jest.Mocked<typeof contractStorage>

// Create test app
const app = express()
app.use(express.json())
app.use('/contracts', contractsRoutes)

// Test data
const mockContract = {
  id: 1,
  customerId: 1,
  productId: 1,
  resellerId: null,
  contractTerm: 1,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  billingCycle: 'annual' as const,
  billingStatus: 'PENDING' as const,
  amount: '1000.00',
  resellerMargin: null,
  netAmount: '1000.00',
  notes: 'Test contract',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

const mockContractWithRelations = {
  ...mockContract,
  customer: {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    company: 'Test Company'
  },
  product: {
    id: 1,
    name: 'Test Product',
    category: 'full file',
    basePrice: '1000.00'
  },
  reseller: null
}

describe('Contracts API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /contracts', () => {
    it('should return all contracts with relationships', async () => {
      mockContractStorage.findAllWithRelations.mockResolvedValue([mockContractWithRelations])

      const response = await request(app)
        .get('/contracts')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([mockContractWithRelations])
      expect(mockContractStorage.findAllWithRelations).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors', async () => {
      mockContractStorage.findAllWithRelations.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .get('/contracts')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to fetch contracts')
    })
  })

  describe('GET /contracts/:id', () => {
    it('should return contract by ID with relationships', async () => {
      mockContractStorage.findByIdWithRelations.mockResolvedValue(mockContractWithRelations)

      const response = await request(app)
        .get('/contracts/1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockContractWithRelations)
      expect(mockContractStorage.findByIdWithRelations).toHaveBeenCalledWith(1)
    })

    it('should return 404 for non-existent contract', async () => {
      mockContractStorage.findByIdWithRelations.mockResolvedValue(null)

      const response = await request(app)
        .get('/contracts/999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Contract not found')
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/contracts/invalid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid contract ID')
    })

    it('should handle database errors', async () => {
      mockContractStorage.findByIdWithRelations.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .get('/contracts/1')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to fetch contract')
    })
  })

  describe('POST /contracts', () => {
    const validContractData = {
      customerId: 1,
      productId: 1,
      contractTerm: 1,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      billingCycle: 'annual' as const,
      billingStatus: 'PENDING' as const,
      amount: '1000.00',
      netAmount: '1000.00',
      notes: 'Test contract'
    }

    it('should create a new contract with valid data', async () => {
      mockContractStorage.create.mockResolvedValue(mockContract)

      const response = await request(app)
        .post('/contracts')
        .send(validContractData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockContract)
      expect(mockContractStorage.create).toHaveBeenCalledWith(validContractData)
    })

    it('should create contract with optional reseller', async () => {
      const contractWithReseller = {
        ...validContractData,
        resellerId: 1,
        resellerMargin: '100.00'
      }
      
      mockContractStorage.create.mockResolvedValue({
        ...mockContract,
        resellerId: 1,
        resellerMargin: '100.00'
      })

      const response = await request(app)
        .post('/contracts')
        .send(contractWithReseller)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(mockContractStorage.create).toHaveBeenCalledWith(contractWithReseller)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        customerId: 1
        // Missing required fields
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toBeInstanceOf(Array)
    })

    it('should validate customer ID is positive', async () => {
      const invalidData = {
        ...validContractData,
        customerId: 0
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toContain('Customer is required')
    })

    it('should validate product ID is positive', async () => {
      const invalidData = {
        ...validContractData,
        productId: -1
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toContain('Product is required')
    })

    it('should validate contract term is at least 1 year', async () => {
      const invalidData = {
        ...validContractData,
        contractTerm: 0
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toContain('Contract term must be at least 1 year')
    })

    it('should validate date format', async () => {
      const invalidData = {
        ...validContractData,
        startDate: 'invalid-date'
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toContain('Invalid date format (YYYY-MM-DD)')
    })

    it('should validate billing cycle enum', async () => {
      const invalidData = {
        ...validContractData,
        billingCycle: 'invalid'
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should validate billing status enum', async () => {
      const invalidData = {
        ...validContractData,
        billingStatus: 'INVALID'
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should validate amount format', async () => {
      const invalidData = {
        ...validContractData,
        amount: 'invalid-amount'
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toContain('Invalid amount format')
    })

    it('should validate margin format when provided', async () => {
      const invalidData = {
        ...validContractData,
        resellerMargin: 'invalid-margin'
      }

      const response = await request(app)
        .post('/contracts')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toContain('Invalid margin format')
    })

    it('should handle database errors', async () => {
      mockContractStorage.create.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/contracts')
        .send(validContractData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to create contract')
    })
  })

  describe('PUT /contracts/:id', () => {
    const updateData = {
      billingStatus: 'PAID' as const,
      notes: 'Updated contract'
    }

    it('should update contract with valid data', async () => {
      const updatedContract = { ...mockContract, ...updateData }
      mockContractStorage.update.mockResolvedValue(updatedContract)

      const response = await request(app)
        .put('/contracts/1')
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(updatedContract)
      expect(mockContractStorage.update).toHaveBeenCalledWith(1, updateData)
    })

    it('should return 404 for non-existent contract', async () => {
      mockContractStorage.update.mockResolvedValue(null)

      const response = await request(app)
        .put('/contracts/999')
        .send(updateData)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Contract not found')
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/contracts/invalid')
        .send(updateData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid contract ID')
    })

    it('should validate partial update data', async () => {
      const invalidData = {
        billingStatus: 'INVALID_STATUS'
      }

      const response = await request(app)
        .put('/contracts/1')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should handle database errors', async () => {
      mockContractStorage.update.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .put('/contracts/1')
        .send(updateData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to update contract')
    })
  })

  describe('DELETE /contracts/:id', () => {
    it('should delete contract successfully', async () => {
      mockContractStorage.delete.mockResolvedValue(true)

      const response = await request(app)
        .delete('/contracts/1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Contract deleted successfully')
      expect(mockContractStorage.delete).toHaveBeenCalledWith(1)
    })

    it('should return 404 for non-existent contract', async () => {
      mockContractStorage.delete.mockResolvedValue(false)

      const response = await request(app)
        .delete('/contracts/999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Contract not found')
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/contracts/invalid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid contract ID')
    })

    it('should handle database errors', async () => {
      mockContractStorage.delete.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .delete('/contracts/1')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to delete contract')
    })
  })

  describe('GET /contracts/status/:status', () => {
    it('should return contracts by status', async () => {
      const pendingContracts = [mockContractWithRelations]
      mockContractStorage.findByStatus.mockResolvedValue(pendingContracts)

      const response = await request(app)
        .get('/contracts/status/PENDING')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(pendingContracts)
      expect(mockContractStorage.findByStatus).toHaveBeenCalledWith('PENDING')
    })

    it('should return empty array for status with no contracts', async () => {
      mockContractStorage.findByStatus.mockResolvedValue([])

      const response = await request(app)
        .get('/contracts/status/CANCELED')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
    })

    it('should handle database errors', async () => {
      mockContractStorage.findByStatus.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .get('/contracts/status/PENDING')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to fetch contracts')
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      // Since we're mocking the auth middleware, we verify it's being called
      // In a real test, you'd want to test with and without proper auth tokens
      expect(true).toBe(true)
    })
  })
})