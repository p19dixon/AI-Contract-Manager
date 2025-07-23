import { eq, desc, asc, and, or, like, sql, count } from 'drizzle-orm'
import { db } from './index.js'
import { 
  users, customers, products, resellers, contracts, purchaseOrders,
  type User, type Customer, type Product, type Reseller, type Contract, type ContractWithRelations,
  type NewUser, type NewCustomer, type NewProduct, type NewReseller, type NewContract,
  type PurchaseOrder, type NewPurchaseOrder
} from './schema.js'

// User operations
export const userStorage = {
  async create(user: NewUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning()
    return newUser
  },

  async findById(id: number): Promise<User | null> {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return user[0] || null
  },

  async findByEmail(email: string): Promise<User | null> {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user[0] || null
  },

  async update(id: number, updates: Partial<NewUser>): Promise<User | null> {
    const [updatedUser] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return updatedUser || null
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id))
    return result.count > 0
  },

  async updateLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id))
  },

  async setActive(id: number, isActive: boolean): Promise<User | null> {
    const [updatedUser] = await db.update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return updatedUser || null
  },

  async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    return await db.select().from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async count(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users)
    return result.count
  }
}

// Customer operations
export const customerStorage = {
  async create(customer: NewCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning()
    return newCustomer
  },

  async findById(id: number): Promise<Customer | null> {
    const customer = await db.select().from(customers).where(eq(customers.id, id)).limit(1)
    return customer[0] || null
  },

  async findAll(limit: number = 50, offset: number = 0): Promise<Customer[]> {
    return await db.select().from(customers)
      .orderBy(asc(customers.company), asc(customers.firstName), asc(customers.lastName))
      .limit(limit)
      .offset(offset)
  },

  async search(query: string, limit: number = 50): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(
        or(
          like(customers.firstName, `%${query}%`),
          like(customers.lastName, `%${query}%`),
          like(customers.company, `%${query}%`),
          like(customers.email, `%${query}%`),
          like(customers.phone, `%${query}%`)
        )
      )
      .orderBy(asc(customers.company), asc(customers.firstName), asc(customers.lastName))
      .limit(limit)
  },

  async update(id: number, updates: Partial<NewCustomer>): Promise<Customer | null> {
    const [updatedCustomer] = await db.update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning()
    return updatedCustomer || null
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id))
    return result.count > 0
  },

  async count(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(customers)
    return result.count
  },

  async findByUserId(userId: number): Promise<Customer | null> {
    const customer = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1)
    return customer[0] || null
  },

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await db.select().from(customers).where(eq(customers.email, email)).limit(1)
    return customer[0] || null
  },

  async enableLogin(id: number, userId: number): Promise<Customer | null> {
    const [updatedCustomer] = await db.update(customers)
      .set({ userId, canLogin: true, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning()
    return updatedCustomer || null
  },

  async updateStatus(id: number, status: string, updatedById?: number): Promise<Customer | null> {
    const updateData: any = { status, updatedAt: new Date() }
    if (status === 'active' && updatedById) {
      updateData.approvedAt = new Date()
      updateData.approvedById = updatedById
    }
    
    const [updatedCustomer] = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning()
    return updatedCustomer || null
  },

  async assignTo(id: number, assignedToId: number): Promise<Customer | null> {
    const [updatedCustomer] = await db.update(customers)
      .set({ assignedToId, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning()
    return updatedCustomer || null
  },

  async updateNotes(id: number, notes: string): Promise<Customer | null> {
    const [updatedCustomer] = await db.update(customers)
      .set({ notes, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning()
    return updatedCustomer || null
  },

  async findByStatus(status: string, limit: number = 50, offset: number = 0): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(eq(customers.status, status))
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async findAssignedTo(userId: number, limit: number = 50, offset: number = 0): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(eq(customers.assignedToId, userId))
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async findWithRelations(limit: number = 50, offset: number = 0): Promise<any[]> {
    // For now, let's use a simpler approach and do separate queries
    const customerList = await db.select().from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset)
    
    // Get assigned staff and approvers
    const customerIds = customerList.map(c => c.assignedToId).filter(Boolean)
    const approverIds = customerList.map(c => c.approvedById).filter(Boolean)
    const allUserIds = [...new Set([...customerIds, ...approverIds])]
    
    let staffMap = new Map()
    if (allUserIds.length > 0) {
      const staff = await db.select().from(users)
        .where(sql`${users.id} IN ${allUserIds}`)
      
      staff.forEach(user => {
        staffMap.set(user.id, user)
      })
    }
    
    return customerList.map(customer => ({
      ...customer,
      assignedTo: customer.assignedToId ? staffMap.get(customer.assignedToId) : null,
      approvedBy: customer.approvedById ? staffMap.get(customer.approvedById) : null
    }))
  }
}

// Product operations
export const productStorage = {
  async create(product: NewProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning()
    return newProduct
  },

  async findById(id: number): Promise<Product | null> {
    const product = await db.select().from(products).where(eq(products.id, id)).limit(1)
    return product[0] || null
  },

  async findAll(limit: number = 50, offset: number = 0): Promise<Product[]> {
    return await db.select().from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async findActive(): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name))
  },

  async findByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.category, category), eq(products.isActive, true)))
      .orderBy(asc(products.name))
  },

  async update(id: number, updates: Partial<NewProduct>): Promise<Product | null> {
    const [updatedProduct] = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    return updatedProduct || null
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id))
    return result.count > 0
  },

  async count(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(products)
    return result.count
  }
}

// Reseller operations
export const resellerStorage = {
  async create(reseller: NewReseller): Promise<Reseller> {
    const [newReseller] = await db.insert(resellers).values(reseller).returning()
    return newReseller
  },

  async findById(id: number): Promise<Reseller | null> {
    const reseller = await db.select().from(resellers).where(eq(resellers.id, id)).limit(1)
    return reseller[0] || null
  },

  async findAll(limit: number = 50, offset: number = 0): Promise<Reseller[]> {
    return await db.select().from(resellers)
      .orderBy(desc(resellers.createdAt))
      .limit(limit)
      .offset(offset)
  },

  async update(id: number, updates: Partial<NewReseller>): Promise<Reseller | null> {
    const [updatedReseller] = await db.update(resellers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellers.id, id))
      .returning()
    return updatedReseller || null
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(resellers).where(eq(resellers.id, id))
    return result.count > 0
  },

  async count(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(resellers)
    return result.count
  }
}

// Contract operations
export const contractStorage = {
  async create(contract: NewContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning()
    return newContract
  },

  async findById(id: number): Promise<Contract | null> {
    const contract = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1)
    return contract[0] || null
  },

  async findByIdWithRelations(id: number): Promise<ContractWithRelations | null> {
    const result = await db.select({
      id: contracts.id,
      customerId: contracts.customerId,
      productId: contracts.productId,
      resellerId: contracts.resellerId,
      contractTerm: contracts.contractTerm,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      billingCycle: contracts.billingCycle,
      billingStatus: contracts.billingStatus,
      amount: contracts.amount,
      resellerMargin: contracts.resellerMargin,
      netAmount: contracts.netAmount,
      notes: contracts.notes,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
      customer: customers,
      product: products,
      reseller: resellers
    })
    .from(contracts)
    .leftJoin(customers, eq(contracts.customerId, customers.id))
    .leftJoin(products, eq(contracts.productId, products.id))
    .leftJoin(resellers, eq(contracts.resellerId, resellers.id))
    .where(eq(contracts.id, id))
    .limit(1)

    return result[0] || null
  },

  async findAllWithRelations(limit: number = 50, offset: number = 0): Promise<ContractWithRelations[]> {
    return await db.select({
      id: contracts.id,
      customerId: contracts.customerId,
      productId: contracts.productId,
      resellerId: contracts.resellerId,
      contractTerm: contracts.contractTerm,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      billingCycle: contracts.billingCycle,
      billingStatus: contracts.billingStatus,
      amount: contracts.amount,
      resellerMargin: contracts.resellerMargin,
      netAmount: contracts.netAmount,
      notes: contracts.notes,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
      customer: customers,
      product: products,
      reseller: resellers
    })
    .from(contracts)
    .leftJoin(customers, eq(contracts.customerId, customers.id))
    .leftJoin(products, eq(contracts.productId, products.id))
    .leftJoin(resellers, eq(contracts.resellerId, resellers.id))
    .orderBy(asc(customers.company), asc(customers.firstName), asc(customers.lastName), desc(contracts.createdAt))
    .limit(limit)
    .offset(offset)
  },

  async findByStatus(status: string): Promise<ContractWithRelations[]> {
    return await db.select({
      id: contracts.id,
      customerId: contracts.customerId,
      productId: contracts.productId,
      resellerId: contracts.resellerId,
      contractTerm: contracts.contractTerm,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      billingCycle: contracts.billingCycle,
      billingStatus: contracts.billingStatus,
      amount: contracts.amount,
      resellerMargin: contracts.resellerMargin,
      netAmount: contracts.netAmount,
      notes: contracts.notes,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
      customer: customers,
      product: products,
      reseller: resellers
    })
    .from(contracts)
    .leftJoin(customers, eq(contracts.customerId, customers.id))
    .leftJoin(products, eq(contracts.productId, products.id))
    .leftJoin(resellers, eq(contracts.resellerId, resellers.id))
    .where(eq(contracts.billingStatus, status))
    .orderBy(desc(contracts.createdAt))
  },

  async update(id: number, updates: Partial<NewContract>): Promise<Contract | null> {
    const [updatedContract] = await db.update(contracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning()
    return updatedContract || null
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(contracts).where(eq(contracts.id, id))
    return result.count > 0
  },

  async count(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(contracts)
    return result.count
  },

  async countByStatus(status: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(contracts)
      .where(eq(contracts.billingStatus, status))
    return result.count
  },

  async getTotalRevenue(): Promise<string> {
    const [result] = await db.select({ 
      total: sql<string>`COALESCE(SUM(${contracts.netAmount}), 0)` 
    }).from(contracts)
    .where(eq(contracts.billingStatus, 'PAID'))
    
    return result.total || '0'
  },

  async getActiveRevenue(): Promise<string> {
    const [result] = await db.select({ 
      total: sql<string>`COALESCE(SUM(${contracts.netAmount}), 0)` 
    }).from(contracts)
    .where(
      or(
        eq(contracts.billingStatus, 'BILLED'),
        eq(contracts.billingStatus, 'RECEIVED'),
        eq(contracts.billingStatus, 'PAID')
      )
    )
    
    return result.total || '0'
  },

  async getOverduePayments(): Promise<{ count: number; amount: string }> {
    const [result] = await db.select({ 
      count: count(),
      amount: sql<string>`COALESCE(SUM(${contracts.netAmount}), 0)`
    }).from(contracts)
    .where(eq(contracts.billingStatus, 'LATE'))
    
    return {
      count: result.count,
      amount: result.amount || '0'
    }
  },

  async findByCustomerId(customerId: number): Promise<ContractWithRelations[]> {
    return await db.select({
      id: contracts.id,
      customerId: contracts.customerId,
      productId: contracts.productId,
      resellerId: contracts.resellerId,
      contractTerm: contracts.contractTerm,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      billingCycle: contracts.billingCycle,
      billingStatus: contracts.billingStatus,
      amount: contracts.amount,
      resellerMargin: contracts.resellerMargin,
      netAmount: contracts.netAmount,
      notes: contracts.notes,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
      customer: customers,
      product: products,
      reseller: resellers
    })
    .from(contracts)
    .leftJoin(customers, eq(contracts.customerId, customers.id))
    .leftJoin(products, eq(contracts.productId, products.id))
    .leftJoin(resellers, eq(contracts.resellerId, resellers.id))
    .where(eq(contracts.customerId, customerId))
    .orderBy(desc(contracts.createdAt))
  }
}

// Purchase Order operations
export const purchaseOrderStorage = {
  async create(purchaseOrder: NewPurchaseOrder): Promise<PurchaseOrder> {
    const [newPO] = await db.insert(purchaseOrders).values(purchaseOrder).returning()
    return newPO
  },

  async findById(id: number): Promise<PurchaseOrder | null> {
    const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1)
    return po[0] || null
  },

  async findByContractId(contractId: number): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders)
      .where(eq(purchaseOrders.contractId, contractId))
      .orderBy(desc(purchaseOrders.createdAt))
  },

  async findByCustomerId(customerId: number): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders)
      .where(eq(purchaseOrders.customerId, customerId))
      .orderBy(desc(purchaseOrders.createdAt))
  },

  async updateStatus(id: number, status: string, notes?: string): Promise<PurchaseOrder | null> {
    const [updatedPO] = await db.update(purchaseOrders)
      .set({ status, notes, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning()
    return updatedPO || null
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id))
    return result.count > 0
  }
}