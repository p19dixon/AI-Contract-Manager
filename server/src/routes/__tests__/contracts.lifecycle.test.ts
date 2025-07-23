import request from 'supertest'
import express from 'express'
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

describe('Contract Lifecycle Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Contract Status Transitions', () => {
    const baseContract = {
      id: 1,
      customerId: 1,
      productId: 1,
      resellerId: null,
      contractTerm: 1,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      billingCycle: 'annual' as const,
      amount: '1000.00',
      resellerMargin: null,
      netAmount: '1000.00',
      notes: 'Test contract',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }

    it('should transition from PENDING to BILLED', async () => {
      const pendingContract = { ...baseContract, billingStatus: 'PENDING' as const }
      const billedContract = { ...baseContract, billingStatus: 'BILLED' as const }

      mockContractStorage.update.mockResolvedValue(billedContract)

      const response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'BILLED' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.billingStatus).toBe('BILLED')
    })

    it('should transition from BILLED to RECEIVED', async () => {
      const billedContract = { ...baseContract, billingStatus: 'BILLED' as const }
      const receivedContract = { ...baseContract, billingStatus: 'RECEIVED' as const }

      mockContractStorage.update.mockResolvedValue(receivedContract)

      const response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'RECEIVED' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.billingStatus).toBe('RECEIVED')
    })

    it('should transition from RECEIVED to PAID', async () => {
      const receivedContract = { ...baseContract, billingStatus: 'RECEIVED' as const }
      const paidContract = { ...baseContract, billingStatus: 'PAID' as const }

      mockContractStorage.update.mockResolvedValue(paidContract)

      const response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'PAID' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.billingStatus).toBe('PAID')
    })

    it('should transition from RECEIVED to LATE', async () => {
      const receivedContract = { ...baseContract, billingStatus: 'RECEIVED' as const }
      const lateContract = { ...baseContract, billingStatus: 'LATE' as const }

      mockContractStorage.update.mockResolvedValue(lateContract)

      const response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'LATE' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.billingStatus).toBe('LATE')
    })

    it('should transition from LATE to PAID', async () => {
      const lateContract = { ...baseContract, billingStatus: 'LATE' as const }
      const paidContract = { ...baseContract, billingStatus: 'PAID' as const }

      mockContractStorage.update.mockResolvedValue(paidContract)

      const response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'PAID' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.billingStatus).toBe('PAID')
    })

    it('should transition from any status to CANCELED', async () => {
      const activeContract = { ...baseContract, billingStatus: 'BILLED' as const }
      const canceledContract = { ...baseContract, billingStatus: 'CANCELED' as const }

      mockContractStorage.update.mockResolvedValue(canceledContract)

      const response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'CANCELED' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.billingStatus).toBe('CANCELED')
    })

    it('should handle multiple status updates in sequence', async () => {
      // First update: PENDING -> BILLED
      const billedContract = { ...baseContract, billingStatus: 'BILLED' as const }
      mockContractStorage.update.mockResolvedValueOnce(billedContract)

      let response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'BILLED' })
        .expect(200)

      expect(response.body.data.billingStatus).toBe('BILLED')

      // Second update: BILLED -> RECEIVED
      const receivedContract = { ...baseContract, billingStatus: 'RECEIVED' as const }
      mockContractStorage.update.mockResolvedValueOnce(receivedContract)

      response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'RECEIVED' })
        .expect(200)

      expect(response.body.data.billingStatus).toBe('RECEIVED')

      // Third update: RECEIVED -> PAID
      const paidContract = { ...baseContract, billingStatus: 'PAID' as const }
      mockContractStorage.update.mockResolvedValueOnce(paidContract)

      response = await request(app)
        .put('/contracts/1')
        .send({ billingStatus: 'PAID' })
        .expect(200)

      expect(response.body.data.billingStatus).toBe('PAID')
    })
  })

  describe('Contract Creation with Different Initial States', () => {
    const baseContractData = {
      customerId: 1,
      productId: 1,
      contractTerm: 1,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      billingCycle: 'annual' as const,
      amount: '1000.00',
      netAmount: '1000.00'
    }

    it('should create contract with default PENDING status', async () => {
      const newContract = {
        id: 1,
        ...baseContractData,
        billingStatus: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContractStorage.create.mockResolvedValue(newContract)

      const response = await request(app)
        .post('/contracts')
        .send(baseContractData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.billingStatus).toBe('PENDING')
    })

    it('should create contract with explicit initial status', async () => {
      const contractData = {
        ...baseContractData,
        billingStatus: 'BILLED' as const
      }

      const newContract = {
        id: 1,
        ...contractData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContractStorage.create.mockResolvedValue(newContract)

      const response = await request(app)
        .post('/contracts')
        .send(contractData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.billingStatus).toBe('BILLED')
    })
  })

  describe('Contract Filtering by Status', () => {
    const mockContracts = [
      { id: 1, billingStatus: 'PENDING' },
      { id: 2, billingStatus: 'BILLED' },
      { id: 3, billingStatus: 'RECEIVED' },
      { id: 4, billingStatus: 'PAID' },
      { id: 5, billingStatus: 'LATE' },
      { id: 6, billingStatus: 'CANCELED' }
    ]

    it('should filter contracts by PENDING status', async () => {
      const pendingContracts = mockContracts.filter(c => c.billingStatus === 'PENDING')
      mockContractStorage.findByStatus.mockResolvedValue(pendingContracts)

      const response = await request(app)
        .get('/contracts/status/PENDING')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].billingStatus).toBe('PENDING')
    })

    it('should filter contracts by BILLED status', async () => {
      const billedContracts = mockContracts.filter(c => c.billingStatus === 'BILLED')
      mockContractStorage.findByStatus.mockResolvedValue(billedContracts)

      const response = await request(app)
        .get('/contracts/status/BILLED')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].billingStatus).toBe('BILLED')
    })

    it('should filter contracts by RECEIVED status', async () => {
      const receivedContracts = mockContracts.filter(c => c.billingStatus === 'RECEIVED')
      mockContractStorage.findByStatus.mockResolvedValue(receivedContracts)

      const response = await request(app)
        .get('/contracts/status/RECEIVED')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].billingStatus).toBe('RECEIVED')
    })

    it('should filter contracts by PAID status', async () => {
      const paidContracts = mockContracts.filter(c => c.billingStatus === 'PAID')
      mockContractStorage.findByStatus.mockResolvedValue(paidContracts)

      const response = await request(app)
        .get('/contracts/status/PAID')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].billingStatus).toBe('PAID')
    })

    it('should filter contracts by LATE status', async () => {
      const lateContracts = mockContracts.filter(c => c.billingStatus === 'LATE')
      mockContractStorage.findByStatus.mockResolvedValue(lateContracts)

      const response = await request(app)
        .get('/contracts/status/LATE')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].billingStatus).toBe('LATE')
    })

    it('should filter contracts by CANCELED status', async () => {
      const canceledContracts = mockContracts.filter(c => c.billingStatus === 'CANCELED')
      mockContractStorage.findByStatus.mockResolvedValue(canceledContracts)

      const response = await request(app)
        .get('/contracts/status/CANCELED')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].billingStatus).toBe('CANCELED')
    })
  })

  describe('Contract Amount Calculations', () => {
    it('should handle contract without reseller margin', async () => {
      const contractData = {
        customerId: 1,
        productId: 1,
        contractTerm: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        billingCycle: 'annual' as const,
        amount: '1000.00',
        netAmount: '1000.00'
      }

      const newContract = {
        id: 1,
        ...contractData,
        billingStatus: 'PENDING' as const,
        resellerId: null,
        resellerMargin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContractStorage.create.mockResolvedValue(newContract)

      const response = await request(app)
        .post('/contracts')
        .send(contractData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.amount).toBe('1000.00')
      expect(response.body.data.netAmount).toBe('1000.00')
      expect(response.body.data.resellerMargin).toBeNull()
    })

    it('should handle contract with reseller margin', async () => {
      const contractData = {
        customerId: 1,
        productId: 1,
        resellerId: 1,
        contractTerm: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        billingCycle: 'annual' as const,
        amount: '1000.00',
        resellerMargin: '100.00',
        netAmount: '900.00'
      }

      const newContract = {
        id: 1,
        ...contractData,
        billingStatus: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContractStorage.create.mockResolvedValue(newContract)

      const response = await request(app)
        .post('/contracts')
        .send(contractData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.amount).toBe('1000.00')
      expect(response.body.data.resellerMargin).toBe('100.00')
      expect(response.body.data.netAmount).toBe('900.00')
    })

    it('should update contract amounts', async () => {
      const updateData = {
        amount: '1200.00',
        resellerMargin: '120.00',
        netAmount: '1080.00'
      }

      const updatedContract = {
        id: 1,
        customerId: 1,
        productId: 1,
        resellerId: 1,
        contractTerm: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        billingCycle: 'annual' as const,
        billingStatus: 'PENDING' as const,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockContractStorage.update.mockResolvedValue(updatedContract)

      const response = await request(app)
        .put('/contracts/1')
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.amount).toBe('1200.00')
      expect(response.body.data.resellerMargin).toBe('120.00')
      expect(response.body.data.netAmount).toBe('1080.00')
    })
  })

  describe('Contract Date Validation', () => {
    it('should handle different billing cycles', async () => {
      const billingCycles = ['annual', 'monthly', 'quarterly'] as const

      for (const cycle of billingCycles) {
        const contractData = {
          customerId: 1,
          productId: 1,
          contractTerm: 1,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          billingCycle: cycle,
          amount: '1000.00',
          netAmount: '1000.00'
        }

        const newContract = {
          id: 1,
          ...contractData,
          billingStatus: 'PENDING' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        mockContractStorage.create.mockResolvedValue(newContract)

        const response = await request(app)
          .post('/contracts')
          .send(contractData)
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.data.billingCycle).toBe(cycle)
      }
    })

    it('should handle different contract terms', async () => {
      const contractTerms = [1, 2, 3, 5]

      for (const term of contractTerms) {
        const contractData = {
          customerId: 1,
          productId: 1,
          contractTerm: term,
          startDate: '2024-01-01',
          endDate: `${2024 + term - 1}-12-31`,
          billingCycle: 'annual' as const,
          amount: '1000.00',
          netAmount: '1000.00'
        }

        const newContract = {
          id: 1,
          ...contractData,
          billingStatus: 'PENDING' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        mockContractStorage.create.mockResolvedValue(newContract)

        const response = await request(app)
          .post('/contracts')
          .send(contractData)
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.data.contractTerm).toBe(term)
      }
    })
  })
})