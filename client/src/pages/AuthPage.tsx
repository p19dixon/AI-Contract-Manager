import { useState } from 'react'
import { useLocation } from 'wouter'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import { Button } from '../components/ui/button'

interface AuthPageProps {
  onSuccess?: () => void
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contract Management System
          </h1>
          <p className="text-gray-600">
            Manage your data licensing contracts with ease
          </p>
        </div>

        {isLogin ? (
          <LoginForm
            onSuccess={onSuccess}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm
            onSuccess={onSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}

        {/* Customer Registration Link */}
        <div className="text-center border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">
            Are you a customer looking to access your contracts?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/customer-register')}
            className="w-full"
          >
            Customer Registration
          </Button>
        </div>
      </div>
    </div>
  )
}