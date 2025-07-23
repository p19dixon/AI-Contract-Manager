// User roles enum
export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  SALES: 'sales',
  SUPPORT: 'support',
  FINANCE: 'finance',
  VIEWER: 'viewer',
  USER: 'user',
  CUSTOMER: 'customer'
} as const

// Define permissions for different actions
export const Permissions = {
  // Customer Management
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',
  CUSTOMER_APPROVE: 'customer.approve',
  CUSTOMER_SUSPEND: 'customer.suspend',
  CUSTOMER_ASSIGN: 'customer.assign',
  
  // Contract Management
  CONTRACT_READ: 'contract.read',
  CONTRACT_CREATE: 'contract.create',
  CONTRACT_UPDATE: 'contract.update',
  CONTRACT_DELETE: 'contract.delete',
  CONTRACT_APPROVE: 'contract.approve',
  
  // Product Management
  PRODUCT_READ: 'product.read',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  
  // Reseller Management
  RESELLER_READ: 'reseller.read',
  RESELLER_CREATE: 'reseller.create',
  RESELLER_UPDATE: 'reseller.update',
  RESELLER_DELETE: 'reseller.delete',
  
  // Purchase Order Management
  PO_READ: 'po.read',
  PO_APPROVE: 'po.approve',
  PO_REJECT: 'po.reject',
  
  // User Management
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // Analytics
  ANALYTICS_READ: 'analytics.read',
  
  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update'
} as const

// Define role-based permissions
export const RolePermissions = {
  [UserRole.ADMIN]: [
    // Full access to everything
    Permissions.CUSTOMER_READ,
    Permissions.CUSTOMER_CREATE,
    Permissions.CUSTOMER_UPDATE,
    Permissions.CUSTOMER_DELETE,
    Permissions.CUSTOMER_APPROVE,
    Permissions.CUSTOMER_SUSPEND,
    Permissions.CUSTOMER_ASSIGN,
    Permissions.CONTRACT_READ,
    Permissions.CONTRACT_CREATE,
    Permissions.CONTRACT_UPDATE,
    Permissions.CONTRACT_DELETE,
    Permissions.CONTRACT_APPROVE,
    Permissions.PRODUCT_READ,
    Permissions.PRODUCT_CREATE,
    Permissions.PRODUCT_UPDATE,
    Permissions.PRODUCT_DELETE,
    Permissions.RESELLER_READ,
    Permissions.RESELLER_CREATE,
    Permissions.RESELLER_UPDATE,
    Permissions.RESELLER_DELETE,
    Permissions.PO_READ,
    Permissions.PO_APPROVE,
    Permissions.PO_REJECT,
    Permissions.USER_READ,
    Permissions.USER_CREATE,
    Permissions.USER_UPDATE,
    Permissions.USER_DELETE,
    Permissions.ANALYTICS_READ,
    Permissions.SETTINGS_READ,
    Permissions.SETTINGS_UPDATE,
  ],
  
  [UserRole.MANAGER]: [
    // Management-level access
    Permissions.CUSTOMER_READ,
    Permissions.CUSTOMER_CREATE,
    Permissions.CUSTOMER_UPDATE,
    Permissions.CUSTOMER_APPROVE,
    Permissions.CUSTOMER_SUSPEND,
    Permissions.CUSTOMER_ASSIGN,
    Permissions.CONTRACT_READ,
    Permissions.CONTRACT_CREATE,
    Permissions.CONTRACT_UPDATE,
    Permissions.CONTRACT_APPROVE,
    Permissions.PRODUCT_READ,
    Permissions.PRODUCT_CREATE,
    Permissions.PRODUCT_UPDATE,
    Permissions.RESELLER_READ,
    Permissions.RESELLER_CREATE,
    Permissions.RESELLER_UPDATE,
    Permissions.PO_READ,
    Permissions.PO_APPROVE,
    Permissions.PO_REJECT,
    Permissions.USER_READ,
    Permissions.ANALYTICS_READ,
    Permissions.SETTINGS_READ,
  ],
  
  [UserRole.SALES]: [
    // Sales-focused permissions
    Permissions.CUSTOMER_READ,
    Permissions.CUSTOMER_CREATE,
    Permissions.CUSTOMER_UPDATE,
    Permissions.CONTRACT_READ,
    Permissions.CONTRACT_CREATE,
    Permissions.CONTRACT_UPDATE,
    Permissions.PRODUCT_READ,
    Permissions.RESELLER_READ,
    Permissions.RESELLER_CREATE,
    Permissions.RESELLER_UPDATE,
    Permissions.PO_READ,
    Permissions.ANALYTICS_READ,
  ],
  
  [UserRole.SUPPORT]: [
    // Support-focused permissions
    Permissions.CUSTOMER_READ,
    Permissions.CUSTOMER_UPDATE,
    Permissions.CONTRACT_READ,
    Permissions.CONTRACT_UPDATE,
    Permissions.PRODUCT_READ,
    Permissions.RESELLER_READ,
    Permissions.PO_READ,
    Permissions.PO_APPROVE,
    Permissions.PO_REJECT,
  ],
  
  [UserRole.FINANCE]: [
    // Finance-focused permissions
    Permissions.CUSTOMER_READ,
    Permissions.CONTRACT_READ,
    Permissions.PRODUCT_READ,
    Permissions.RESELLER_READ,
    Permissions.PO_READ,
    Permissions.PO_APPROVE,
    Permissions.ANALYTICS_READ,
  ],
  
  [UserRole.VIEWER]: [
    // View-only permissions
    Permissions.CUSTOMER_READ,
    Permissions.CONTRACT_READ,
    Permissions.PRODUCT_READ,
    Permissions.RESELLER_READ,
    Permissions.PO_READ,
    Permissions.ANALYTICS_READ,
  ],
  
  [UserRole.USER]: [
    // Basic user permissions
    Permissions.CUSTOMER_READ,
    Permissions.CONTRACT_READ,
    Permissions.PRODUCT_READ,
    Permissions.RESELLER_READ,
  ],
  
  [UserRole.CUSTOMER]: [
    // Customer portal permissions (handled separately)
  ]
}

// Helper function to check if user has permission
export function hasPermission(userRole: string, permission: string): boolean {
  const rolePermissions = RolePermissions[userRole as keyof typeof RolePermissions]
  return rolePermissions ? rolePermissions.includes(permission as any) : false
}

// Helper function to get all permissions for a role
export function getRolePermissions(userRole: string): string[] {
  return RolePermissions[userRole as keyof typeof RolePermissions] || []
}

// Role hierarchy for UI display
export const RoleHierarchy = {
  [UserRole.ADMIN]: {
    label: 'Administrator',
    description: 'Full system access and user management',
    level: 5,
    color: 'bg-red-100 text-red-800'
  },
  [UserRole.MANAGER]: {
    label: 'Manager',
    description: 'Customer and contract management',
    level: 4,
    color: 'bg-purple-100 text-purple-800'
  },
  [UserRole.SALES]: {
    label: 'Sales',
    description: 'Customer acquisition and relationship management',
    level: 3,
    color: 'bg-blue-100 text-blue-800'
  },
  [UserRole.SUPPORT]: {
    label: 'Support',
    description: 'Customer support and issue resolution',
    level: 2,
    color: 'bg-green-100 text-green-800'
  },
  [UserRole.FINANCE]: {
    label: 'Finance',
    description: 'Financial reporting and billing management',
    level: 2,
    color: 'bg-yellow-100 text-yellow-800'
  },
  [UserRole.VIEWER]: {
    label: 'Viewer',
    description: 'Read-only access to system data',
    level: 1,
    color: 'bg-gray-100 text-gray-800'
  },
  [UserRole.USER]: {
    label: 'User',
    description: 'Basic system access',
    level: 1,
    color: 'bg-gray-100 text-gray-800'
  },
  [UserRole.CUSTOMER]: {
    label: 'Customer',
    description: 'Customer portal access',
    level: 0,
    color: 'bg-yellow-100 text-yellow-800'
  }
}

// Customer statuses for UI display
export const CustomerStatusInfo = {
  active: {
    label: 'Active',
    description: 'Customer is active and can use services',
    color: 'bg-green-100 text-green-800'
  },
  inactive: {
    label: 'Inactive',
    description: 'Customer is temporarily inactive',
    color: 'bg-gray-100 text-gray-800'
  },
  suspended: {
    label: 'Suspended',
    description: 'Customer access is suspended',
    color: 'bg-red-100 text-red-800'
  },
  pending_approval: {
    label: 'Pending Approval',
    description: 'Customer registration awaiting approval',
    color: 'bg-yellow-100 text-yellow-800'
  }
}