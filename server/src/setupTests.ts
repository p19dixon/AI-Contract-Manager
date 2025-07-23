// Server test setup
import { jest } from '@jest/globals'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.SESSION_SECRET = 'test-secret'
process.env.JWT_SECRET = 'test-jwt-secret'

// Global test timeout
jest.setTimeout(10000)