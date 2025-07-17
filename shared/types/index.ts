import { z } from 'zod'

// Database entity types (re-exported from server schema)
export type User = {
  id: number
  email: string
  name: string
  password: string
  role: string
  isActive: boolean | null
  lastLoginAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type Customer = {
  id: number
  firstName: string
  lastName: string
  name: string | null
  email: string
  phone: string | null
  customerType: string
  street: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type Product = {
  id: number
  name: string
  description: string | null
  category: string
  basePrice: string
  isBundle: boolean | null
  bundleProducts: string | null
  isActive: boolean | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type Reseller = {
  id: number
  name: string
  email: string
  phone: string | null
  marginPercentage: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export type Contract = {
  id: number
  customerId: number | null
  productId: number | null
  resellerId: number | null
  contractTerm: number
  startDate: string
  endDate: string
  billingCycle: string
  billingStatus: string
  amount: string
  resellerMargin: string | null
  netAmount: string
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

// Complex types for queries with relations
export type ContractWithRelations = Contract & {
  customer: Customer | null
  product: Product | null
  reseller: Reseller | null
}

// Enums for type safety
export const CustomerType = {
  INDIVIDUAL: 'individual',
  PARTNER: 'partner',
  RESELLER: 'reseller',
  SOLUTION_PROVIDER: 'solution_provider'
} as const

export const BillingStatus = {
  PENDING: 'PENDING',
  BILLED: 'BILLED',
  RECEIVED: 'RECEIVED',
  PAID: 'PAID',
  LATE: 'LATE',
  CANCELED: 'CANCELED'
} as const

export const BillingCycle = {
  ANNUAL: 'annual',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly'
} as const

export const ProductCategory = {
  FULL_FILE: 'full file',
  LITE: 'lite',
  ONLINE: 'online',
  PROPOSED: 'proposed',
  ANCHORS_TENANTS: 'anchors & tenants'
} as const

// Zod validation schemas for API requests
export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  customerType: z.enum(['individual', 'partner', 'reseller', 'solution_provider']).default('individual'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('USA')
})

export const updateCustomerSchema = createCustomerSchema.partial()

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  isBundle: z.boolean().default(false),
  bundleProducts: z.string().optional(), // JSON string of product IDs
  isActive: z.boolean().default(true)
})

export const updateProductSchema = createProductSchema.partial()

export const createResellerSchema = z.object({
  name: z.string().min(1, 'Reseller name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  marginPercentage: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid margin percentage').default('0')
})

export const updateResellerSchema = createResellerSchema.partial()

export const createContractSchema = z.object({
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

export const updateContractSchema = createContractSchema.partial()

// Authentication validation schemas
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email address').optional()
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
})

// API response types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

export type PaginatedResponse<T> = {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard metrics type
export type DashboardMetrics = {
  totalContracts: number
  activeRevenue: string
  pendingRenewals: number
  overduePayments: {
    count: number
    amount: string
  }
  recentActivity: {
    id: number
    type: 'contract_created' | 'contract_updated' | 'payment_received'
    description: string
    timestamp: string
  }[]
}

// Analytics types
export type RevenueByMonth = {
  month: string
  revenue: string
}

export type ContractsByStatus = {
  status: string
  count: number
}