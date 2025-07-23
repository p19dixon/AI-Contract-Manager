import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription } from '../components/ui/alert'
import { api } from '../lib/api'

interface CustomerRegisterForm {
  firstName: string
  lastName: string
  company: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  customerType: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export function CustomerRegister() {
  const [, setLocation] = useLocation()
  const [formData, setFormData] = useState<CustomerRegisterForm>({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    customerType: 'individual',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  })
  const [errors, setErrors] = useState<string[]>([])

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<CustomerRegisterForm, 'confirmPassword'>) => {
      return api.post('/auth/customer-register', data)
    },
    onSuccess: (data: any) => {
      // Store the token
      localStorage.setItem('token', data.data.token)
      // Redirect to customer portal
      setLocation('/customer-portal')
    },
    onError: (error: any) => {
      setErrors(error.response?.data?.details || [error.response?.data?.error || 'Registration failed'])
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validate form
    const newErrors: string[] = []
    
    if (!formData.firstName.trim()) newErrors.push('First name is required')
    if (!formData.lastName.trim()) newErrors.push('Last name is required')
    if (!formData.email.trim()) newErrors.push('Email is required')
    if (!formData.password) newErrors.push('Password is required')
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match')
    }
    if (formData.password.length < 8) {
      newErrors.push('Password must be at least 8 characters')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    const { confirmPassword, ...submitData } = formData
    registerMutation.mutate(submitData)
  }

  const handleInputChange = (field: keyof CustomerRegisterForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Customer Registration</CardTitle>
          <CardDescription>
            Create your account to access the customer portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Your company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerType">Customer Type</Label>
                <Select value={formData.customerType} onValueChange={(value) => handleInputChange('customerType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="reseller">Reseller</SelectItem>
                    <SelectItem value="solution_provider">Solution Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Address Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Password</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
              </p>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setLocation('/login')}
                  className="text-blue-600 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}