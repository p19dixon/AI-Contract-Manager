import { pgTable, text, serial, timestamp, decimal, boolean, integer, date } from 'drizzle-orm/pg-core'

// Users table for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'), // user, admin
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
  email: text('email').notNull(),
  phone: text('phone'),
  customerType: text('customer_type').notNull().default('individual'), // partner, reseller, solution provider, individual
  street: text('street'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country').default('USA'),
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

// Export types for TypeScript usage
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type Reseller = typeof resellers.$inferSelect
export type NewReseller = typeof resellers.$inferInsert

export type Contract = typeof contracts.$inferSelect
export type NewContract = typeof contracts.$inferInsert

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

export const UserRole = {
  USER: 'user',
  ADMIN: 'admin'
} as const