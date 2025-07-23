// API client for authentication and data operations

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string[]
}

export interface User {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface UpdateProfileData {
  name?: string
  email?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

// Additional entity types
export interface Customer {
  id: number
  firstName: string
  lastName: string
  company?: string
  email: string
  phone?: string
  customerType: string
  resellerId?: number
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  name: string
  description?: string
  category: string
  basePrice: string
  isBundle: boolean
  bundleProducts?: string
  originalPrice?: string
  discountPercentage?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Reseller {
  id: number
  name: string
  email: string
  phone?: string
  marginPercentage: string
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ResellerContact {
  id: number
  resellerId: number
  firstName: string
  lastName: string
  title?: string
  email: string
  phone?: string
  isPrimary: boolean
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Contract {
  id: number
  customerId: number
  productId: number
  resellerId?: number
  contractTerm: number
  startDate: string
  endDate: string
  billingCycle: string
  billingStatus: string
  amount: string
  resellerMargin?: string
  netAmount: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ContractWithRelations extends Contract {
  customer?: Customer
  product?: Product
  reseller?: Reseller
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = '/api' // Proxied through Vite
    this.token = this.getStoredToken()
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private setStoredToken(token: string | null): void {
    if (token) {
      localStorage.setItem('auth_token', token)
      this.token = token
    } else {
      localStorage.removeItem('auth_token')
      this.token = null
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`)
        // Preserve the full response data for detailed error handling
        ;(error as any).response = { data }
        throw error
      }

      return data
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Authentication methods
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.success && response.data?.token) {
      this.setStoredToken(response.data.token)
    }

    return response
  }

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.success && response.data?.token) {
      this.setStoredToken(response.data.token)
    }

    return response
  }

  async logout(): Promise<void> {
    this.setStoredToken(null)
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me')
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getAuthStatus(): Promise<ApiResponse<{ isAuthenticated: boolean; user: User | null }>> {
    return this.request<{ isAuthenticated: boolean; user: User | null }>('/auth/status')
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }

  setToken(token: string): void {
    this.setStoredToken(token)
  }

  clearAuth(): void {
    this.setStoredToken(null)
  }

  // Customer methods
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    return this.request<Customer[]>('/customers')
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCustomer(id: number, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Customer>> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCustomer(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    })
  }

  // Product methods
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/products')
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProduct(id: number, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Reseller methods
  async getResellers(): Promise<ApiResponse<Reseller[]>> {
    return this.request<Reseller[]>('/resellers')
  }

  async createReseller(data: Omit<Reseller, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Reseller>> {
    return this.request<Reseller>('/resellers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateReseller(id: number, data: Partial<Omit<Reseller, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Reseller>> {
    return this.request<Reseller>(`/resellers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteReseller(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/resellers/${id}`, {
      method: 'DELETE',
    })
  }

  // Contract methods
  async getContracts(): Promise<ApiResponse<ContractWithRelations[]>> {
    return this.request<ContractWithRelations[]>('/contracts')
  }

  async createContract(data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Contract>> {
    return this.request<Contract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateContract(id: number, data: Partial<Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Contract>> {
    return this.request<Contract>(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteContract(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/contracts/${id}`, {
      method: 'DELETE',
    })
  }

  // Customer portal methods
  async get<T>(endpoint: string): Promise<T> {
    const response = await this.request<T>(endpoint)
    if (!response.success) {
      throw new Error(response.error || 'Request failed')
    }
    return response.data!
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.success) {
      throw new Error(response.error || 'Request failed')
    }
    return response.data!
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.success) {
      throw new Error(response.error || 'Request failed')
    }
    return response.data!
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
    })
    if (!response.success) {
      throw new Error(response.error || 'Request failed')
    }
    return response.data!
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export as 'api' for backward compatibility
export const api = apiClient

// Error handling utility
export function isApiError(error: unknown): error is Error {
  return error instanceof Error
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }
  return 'An unexpected error occurred'
}