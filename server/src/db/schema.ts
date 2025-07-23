import { pgTable, text, serial, timestamp, decimal, boolean, integer, date } from 'drizzle-orm/pg-core'

// Users table for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'), // user, admin, customer, manager, sales, support
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Customers table with separated name fields and full address
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  name: text('name'), // Legacy field for backward compatibility
  company: text('company'), // Company name - important for B2B contracts
  email: text('email').notNull(),
  phone: text('phone'),
  customerType: text('customer_type').notNull().default('individual'), // partner, reseller, solution provider, individual
  resellerId: integer('reseller_id').references(() => resellers.id, { onDelete: 'set null' }), // Link to reseller (for reseller's customers)
  street: text('street'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country').default('USA'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }), // Link to user account for portal access
  canLogin: boolean('can_login').default(false), // Allow portal access
  status: text('status').notNull().default('active'), // active, inactive, suspended, pending_approval
  assignedToId: integer('assigned_to_id').references(() => users.id, { onDelete: 'set null' }), // Staff member responsible
  notes: text('notes'), // Internal notes about the customer
  approvedAt: timestamp('approved_at'),
  approvedById: integer('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Products table with bundle support and custom categories
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // full file, lite, online, proposed, anchors & tenants, custom
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull().default('0'),
  isBundle: boolean('is_bundle').default(false),
  bundleProducts: text('bundle_products'), // JSON array of product IDs
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }), // Total price before discount for bundles
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0'), // Discount percentage for bundles
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Resellers table with margin configuration
export const resellers = pgTable('resellers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  marginPercentage: decimal('margin_percentage', { precision: 5, scale: 2 }).default('0'),
  street: text('street'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country').default('USA'),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Reseller Contacts table - Staff members who work for the reseller (Point of Contact)
export const resellerContacts = pgTable('reseller_contacts', {
  id: serial('id').primaryKey(),
  resellerId: integer('reseller_id').references(() => resellers.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  title: text('title'), // Job title like "Sales Manager", "Account Manager", etc.
  email: text('email').notNull(),
  phone: text('phone'),
  isPrimary: boolean('is_primary').default(false), // Is this the primary contact for the reseller?
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Contracts table with lifecycle management
export const contracts = pgTable('contracts', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  resellerId: integer('reseller_id').references(() => resellers.id, { onDelete: 'set null' }),
  contractTerm: integer('contract_term').notNull().default(1), // in years
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  billingCycle: text('billing_cycle').notNull().default('annual'), // annual, monthly, quarterly
  billingStatus: text('billing_status').notNull().default('PENDING'), // PENDING, BILLED, RECEIVED, PAID, LATE, CANCELED
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  resellerMargin: decimal('reseller_margin', { precision: 5, scale: 2 }).default('0'),
  netAmount: decimal('net_amount', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Purchase Orders table for customer uploads
export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  contractId: integer('contract_id').references(() => contracts.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  poNumber: text('po_number').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Export types for TypeScript usage
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type Reseller = typeof resellers.$inferSelect
export type NewReseller = typeof resellers.$inferInsert

export type ResellerContact = typeof resellerContacts.$inferSelect
export type NewResellerContact = typeof resellerContacts.$inferInsert

export type Contract = typeof contracts.$inferSelect
export type NewContract = typeof contracts.$inferInsert

export type PurchaseOrder = typeof purchaseOrders.$inferSelect
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert

// Complex types for queries with relations
export type ContractWithRelations = Contract & {
  customer: Customer | null
  product: Product | null
  reseller: Reseller | null
}

export type CustomerWithReseller = Customer & {
  reseller: Reseller | null
}

export type ResellerWithContacts = Reseller & {
  contacts: ResellerContact[]
  primaryContact: ResellerContact | null
  customers: Customer[]
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

export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  MANAGER: 'manager',
  SALES: 'sales',
  SUPPORT: 'support',
  FINANCE: 'finance',
  VIEWER: 'viewer'
} as const

export const CustomerStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_APPROVAL: 'pending_approval'
} as const