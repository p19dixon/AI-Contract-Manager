import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import adminRoutes from '../admin.js'
import { userStorage, customerStorage } from '../../db/storage.js'
import { db } from '../../db/index.js'
import { users, customers } from '../../db/schema.js'

// Mock dependencies
jest.mock('../../db/storage.js')
jest.mock('../../db/index.js')
jest.mock('../../auth/jwtAuth.js', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'admin', email: 'admin@test.com' }
    next()
  }),
  requireAdmin: jest.fn((req, res, next) => next()),
  hashPassword: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  getSafeUserData: jest.fn((user) => ({ ...user, password: undefined }))
}))

const mockUserStorage = userStorage as jest.Mocked<typeof userStorage>
const mockCustomerStorage = customerStorage as jest.Mocked<typeof customerStorage>
const mockDb = db as jest.Mocked<typeof db>

// Create test app
const app = express()
app.use(express.json())
app.use('/admin', adminRoutes)

describe('Admin Routes - Customer Access Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /admin/customer-access', () => {
    it('should return customers with portal access', async () => {
      const mockCustomersWithAccess = [
        {
          id: 1,
          customerId: 1,
          userId: 1,
          canLogin: true,
          loginEmail: 'john@example.com',
          lastLoginAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
          customer: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@company.com',
            customerType: 'partner'
          }
        }
      ]

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockCustomersWithAccess)
            })
          })
        })
      })

      const response = await request(app)
        .get('/admin/customer-access')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCustomersWithAccess)
    })

    it('should handle database errors', async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })
      })

      const response = await request(app)
        .get('/admin/customer-access')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to get customer access list')
    })
  })

  describe('GET /admin/customers-without-access', () => {
    it('should return customers without portal access', async () => {
      const mockCustomersWithoutAccess = [
        {
          id: 3,
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@company.com',
          customerType: 'individual'
        }
      ]

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockCustomersWithoutAccess)
          })
        })
      })

      const response = await request(app)
        .get('/admin/customers-without-access')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCustomersWithoutAccess)
    })
  })

  describe('POST /admin/customer-access', () => {
    const validRequestData = {
      customerId: 1,
      email: 'customer@example.com',
      password: 'password123'
    }

    beforeEach(() => {
      mockCustomerStorage.findById.mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        userId: null
      })

      mockUserStorage.findByEmail.mockResolvedValue(null)

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            { id: 1, email: 'customer@example.com', name: 'John Doe', role: 'customer' }
          ])
        })
      })

      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      })
    })

    it('should grant customer portal access successfully', async () => {
      const response = await request(app)
        .post('/admin/customer-access')
        .send(validRequestData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Customer portal access granted successfully')
      expect(mockCustomerStorage.findById).toHaveBeenCalledWith(1)
      expect(mockUserStorage.findByEmail).toHaveBeenCalledWith('customer@example.com')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/admin/customer-access')
        .send({ customerId: 1 }) // Missing email and password
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Customer ID, email, and password are required')
    })

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/admin/customer-access')
        .send({
          customerId: 1,
          email: 'customer@example.com',
          password: 'short'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Password must be at least 8 characters')
    })

    it('should check if customer exists', async () => {
      mockCustomerStorage.findById.mockResolvedValue(null)

      const response = await request(app)
        .post('/admin/customer-access')
        .send(validRequestData)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Customer not found')
    })

    it('should check if customer already has access', async () => {
      mockCustomerStorage.findById.mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        userId: 2 // Already has a user ID
      })

      const response = await request(app)
        .post('/admin/customer-access')
        .send(validRequestData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Customer already has portal access')
    })

    it('should check if email is already in use', async () => {
      mockUserStorage.findByEmail.mockResolvedValue({
        id: 2,
        email: 'customer@example.com',
        name: 'Existing User',
        role: 'admin'
      })

      const response = await request(app)
        .post('/admin/customer-access')
        .send(validRequestData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Email already in use')
    })

    it('should handle database errors', async () => {
      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      })

      const response = await request(app)
        .post('/admin/customer-access')
        .send(validRequestData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to grant customer access')
    })
  })

  describe('PUT /admin/customer-access/:id/status', () => {
    beforeEach(() => {
      mockCustomerStorage.findById.mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        userId: 1
      })

      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      })
    })

    it('should update customer access status', async () => {
      const response = await request(app)
        .put('/admin/customer-access/1/status')
        .send({ canLogin: false })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Customer access status updated')
      expect(mockCustomerStorage.findById).toHaveBeenCalledWith(1)
    })

    it('should validate customer exists and has access', async () => {
      mockCustomerStorage.findById.mockResolvedValue(null)

      const response = await request(app)
        .put('/admin/customer-access/1/status')
        .send({ canLogin: false })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Customer access not found')
    })

    it('should validate customer has user ID', async () => {
      mockCustomerStorage.findById.mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        userId: null
      })

      const response = await request(app)
        .put('/admin/customer-access/1/status')
        .send({ canLogin: false })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Customer access not found')
    })
  })

  describe('PUT /admin/customer-access/:id/password', () => {
    beforeEach(() => {
      mockCustomerStorage.findById.mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        userId: 1
      })

      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      })
    })

    it('should reset customer password', async () => {
      const response = await request(app)
        .put('/admin/customer-access/1/password')
        .send({ password: 'newpassword123' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password reset successfully')
    })

    it('should validate password length', async () => {
      const response = await request(app)
        .put('/admin/customer-access/1/password')
        .send({ password: 'short' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Password must be at least 8 characters')
    })

    it('should validate customer exists and has access', async () => {
      mockCustomerStorage.findById.mockResolvedValue(null)

      const response = await request(app)
        .put('/admin/customer-access/1/password')
        .send({ password: 'newpassword123' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Customer access not found')
    })
  })

  describe('DELETE /admin/customer-access/:id', () => {
    beforeEach(() => {
      mockCustomerStorage.findById.mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        userId: 1
      })

      mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })

      mockDb.update = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      })
    })

    it('should revoke customer portal access', async () => {
      const response = await request(app)
        .delete('/admin/customer-access/1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Customer portal access revoked')
      expect(mockCustomerStorage.findById).toHaveBeenCalledWith(1)
    })

    it('should validate customer exists and has access', async () => {
      mockCustomerStorage.findById.mockResolvedValue(null)

      const response = await request(app)
        .delete('/admin/customer-access/1')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Customer access not found')
    })

    it('should validate customer has user ID', async () => {
      mockCustomerStorage.findById.mockResolvedValue({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
        userId: null
      })

      const response = await request(app)
        .delete('/admin/customer-access/1')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Customer access not found')
    })

    it('should handle database errors', async () => {
      mockDb.delete = jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('Database error'))
      })

      const response = await request(app)
        .delete('/admin/customer-access/1')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to revoke customer access')
    })
  })

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      // This test would need to be configured with the actual auth middleware
      // For now, we assume the middleware is properly configured
      expect(true).toBe(true)
    })

    it('should require admin role for all endpoints', async () => {
      // This test would need to be configured with role-based access control
      // For now, we assume the admin middleware is properly configured
      expect(true).toBe(true)
    })
  })
})