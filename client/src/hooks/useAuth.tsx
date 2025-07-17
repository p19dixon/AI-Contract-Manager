import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient, type User, type LoginData, type RegisterData, getErrorMessage } from '../lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (data: { name?: string; email?: string }) => Promise<{ success: boolean; error?: string }>
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const response = await apiClient.getCurrentUser()
        if (response.success && response.data) {
          setUser(response.data)
        } else {
          // Invalid token, clear it
          apiClient.clearAuth()
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      apiClient.clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.login(data)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.register(data)
      
      if (response.success && response.data) {
        setUser(response.data.user)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const updateProfile = async (data: { name?: string; email?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.updateProfile(data)
      
      if (response.success && response.data) {
        setUser(response.data)
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Profile update failed' }
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.changePassword(data)
      
      if (response.success) {
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Password change failed' }
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      if (apiClient.isAuthenticated()) {
        const response = await apiClient.getCurrentUser()
        if (response.success && response.data) {
          setUser(response.data)
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking if user has specific role
export function useRole(requiredRole: string): boolean {
  const { user } = useAuth()
  return user?.role === requiredRole
}

// Hook for checking if user is admin
export function useIsAdmin(): boolean {
  return useRole('admin')
}