import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { Link } from 'wouter'
import { api, type Customer } from '../../lib/api'

interface CustomerAccess {
  id: number
  customerId: number
  userId: number
  canLogin: boolean
  loginEmail: string
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: number
    firstName: string
    lastName: string
    email: string
    customerType: string
    company?: string
  }
  user?: {
    id: number
    email: string
    name: string
    isActive: boolean
  }
}

const customerTypes = [
  { value: 'partner', label: 'Partner', color: 'bg-blue-100 text-blue-800' },
  { value: 'reseller', label: 'Reseller', color: 'bg-purple-100 text-purple-800' },
  { value: 'solution_provider', label: 'Solution Provider', color: 'bg-green-100 text-green-800' },
  { value: 'individual', label: 'Individual', color: 'bg-gray-100 text-gray-800' }
]

export function CustomerAccessPage() {
  const [showGrantAccess, setShowGrantAccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [accessEmail, setAccessEmail] = useState('')
  const [accessPassword, setAccessPassword] = useState('')

  const queryClient = useQueryClient()

  // Fetch customer access list
  const { data: accessResponse, isLoading } = useQuery<CustomerAccess[]>({
    queryKey: ['customer-access'],
    queryFn: () => api.get<CustomerAccess[]>('/admin/customer-access')
  })

  // Fetch customers without access
  const { data: customersResponse, error: customersError, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['customers-without-access'],
    queryFn: () => api.get<Customer[]>('/admin/customers-without-access'),
    staleTime: 0, // Always fetch fresh data
    gcTime: 0  // Don't cache
  })

  const customerAccess = accessResponse || []
  const customersWithoutAccess = customersResponse || []

  // Debug logging
  console.log('DEBUG - customersResponse:', customersResponse)
  console.log('DEBUG - customersResponse type:', typeof customersResponse)
  console.log('DEBUG - customersWithoutAccess:', customersWithoutAccess)
  console.log('DEBUG - customersError:', customersError)
  console.log('DEBUG - customersLoading:', customersLoading)

  // Grant access mutation
  const grantAccessMutation = useMutation({
    mutationFn: (data: { customerId: number; email: string; password: string }) => 
      api.post('/admin/customer-access', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-access'] })
      queryClient.invalidateQueries({ queryKey: ['customers-without-access'] })
      setShowGrantAccess(false)
      resetForm()
    }
  })

  // Revoke access mutation
  const revokeAccessMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/customer-access/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-access'] })
      queryClient.invalidateQueries({ queryKey: ['customers-without-access'] })
    }
  })

  // Toggle access status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, canLogin }: { id: number; canLogin: boolean }) => 
      api.put(`/admin/customer-access/${id}/status`, { canLogin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-access'] })
    }
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => 
      api.put(`/admin/customer-access/${id}/password`, { password }),
    onSuccess: () => {
      alert('Password reset successfully')
    }
  })

  const resetForm = () => {
    setSelectedCustomer('')
    setAccessEmail('')
    setAccessPassword('')
  }

  const handleGrantAccess = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCustomer && accessEmail && accessPassword) {
      grantAccessMutation.mutate({
        customerId: parseInt(selectedCustomer),
        email: accessEmail,
        password: accessPassword
      })
    }
  }

  const handleRevoke = (access: CustomerAccess) => {
    if (confirm(`Are you sure you want to revoke access for ${access.customer.firstName} ${access.customer.lastName}?`)) {
      revokeAccessMutation.mutate(access.id)
    }
  }

  const handlePasswordReset = (access: CustomerAccess) => {
    const newPassword = prompt('Enter new password (min 8 characters):')
    if (newPassword && newPassword.length >= 8) {
      resetPasswordMutation.mutate({ id: access.id, password: newPassword })
    } else if (newPassword) {
      alert('Password must be at least 8 characters')
    }
  }

  const getCustomerTypeInfo = (type: string) => {
    return customerTypes.find(t => t.value === type) || customerTypes[3]
  }

  const filteredAccess = customerAccess.filter((access: CustomerAccess) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      access.customer.firstName.toLowerCase().includes(searchLower) ||
      access.customer.lastName.toLowerCase().includes(searchLower) ||
      access.customer.email.toLowerCase().includes(searchLower) ||
      access.loginEmail.toLowerCase().includes(searchLower) ||
      access.customer.customerType.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <Layout title="Customer Access Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Customer Access Management" description="Manage customer portal access">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/admin">
                  <a className="text-gray-500 hover:text-gray-700">Admin</a>
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-900 font-medium">Customer Access</span>
                </div>
              </li>
            </ol>
          </nav>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Admin
            </Button>
          </Link>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About Customer Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Customer Access controls who can log into the customer portal</p>
              <p>• This is separate from the customer records used in contracts</p>
              <p>• Revoking access does NOT delete the customer or their contracts</p>
              <p>• Each customer can have one portal login account</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Badge variant="outline">
              {filteredAccess.length} customer{filteredAccess.length !== 1 ? 's' : ''} with access
            </Badge>
          </div>
          <Button onClick={() => setShowGrantAccess(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Grant Access
          </Button>
        </div>

        {/* Grant Access Form */}
        {showGrantAccess && (
          <Card>
            <CardHeader>
              <CardTitle>Grant Customer Portal Access</CardTitle>
              <CardDescription>
                Allow a customer to log into the customer portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGrantAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customersLoading && (
                        <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                      )}
                      {customersError && (
                        <SelectItem value="error" disabled>
                          Error loading customers: {(customersError as any)?.message || 'Unknown error'}
                        </SelectItem>
                      )}
                      {!customersLoading && !customersError && customersWithoutAccess.length === 0 && (
                        <SelectItem value="none" disabled>No customers available for portal access</SelectItem>
                      )}
                      {customersWithoutAccess.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.firstName} {customer.lastName} - {customer.email} ({customer.customerType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Login Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accessEmail}
                      onChange={(e) => setAccessEmail(e.target.value)}
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Initial Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowGrantAccess(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Grant Access
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Customer Access List */}
        <Card>
          <CardHeader>
            <CardTitle>Customers with Portal Access</CardTitle>
            <CardDescription>Manage customer portal login access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAccess.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No customers have portal access yet
                </p>
              ) : (
                filteredAccess.map((access: CustomerAccess) => {
                  const typeInfo = getCustomerTypeInfo(access.customer.customerType)
                  return (
                    <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium">
                              {access.customer.firstName} {access.customer.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Contact: {access.customer.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              Login: {access.loginEmail}
                            </p>
                            {access.lastLoginAt && (
                              <p className="text-sm text-gray-500">
                                Last login: {new Date(access.lastLoginAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          <Badge variant={access.canLogin ? 'default' : 'secondary'}>
                            {access.canLogin ? 'Active' : 'Suspended'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ 
                            id: access.id, 
                            canLogin: !access.canLogin 
                          })}
                        >
                          {access.canLogin ? 'Suspend' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePasswordReset(access)}
                        >
                          Reset Password
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRevoke(access)}
                        >
                          Revoke Access
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}