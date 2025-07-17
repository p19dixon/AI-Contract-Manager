import React, { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface ProtectedRouteProps {
  children: ReactNode
  requireRole?: string
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check role requirements
  if (requireRole && user.role !== requireRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
              {requireRole && ` Required role: ${requireRole}`}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requireRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requireRole={requireRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for conditional rendering based on auth state
export function useAuthGuard() {
  const { user, isAuthenticated, isLoading } = useAuth()

  const canAccess = (requireRole?: string) => {
    if (isLoading || !isAuthenticated || !user) {
      return false
    }

    if (requireRole && user.role !== requireRole) {
      return false
    }

    return true
  }

  const isAdmin = () => canAccess('admin')
  const isUser = () => canAccess('user')

  return {
    canAccess,
    isAdmin,
    isUser,
    isAuthenticated,
    isLoading,
    user
  }
}