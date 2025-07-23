import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { Link } from 'wouter'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

interface User {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

// Best practice roles for system management
const systemRoles = [
  { 
    value: 'admin', 
    label: 'Administrator',
    description: 'Full system access, user management, all configurations',
    color: 'bg-red-100 text-red-800'
  },
  { 
    value: 'manager', 
    label: 'Manager',
    description: 'Contract management, customer management, reports',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    value: 'sales', 
    label: 'Sales',
    description: 'Create/edit contracts, manage customers, view reports',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    value: 'support', 
    label: 'Support',
    description: 'View contracts/customers, handle customer inquiries',
    color: 'bg-green-100 text-green-800'
  },
  { 
    value: 'finance', 
    label: 'Finance',
    description: 'View contracts, billing management, financial reports',
    color: 'bg-yellow-100 text-yellow-800'
  },
  { 
    value: 'viewer', 
    label: 'Viewer',
    description: 'Read-only access to contracts and customers',
    color: 'bg-gray-100 text-gray-800'
  }
]

export function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer'
  })

  const queryClient = useQueryClient()

  // Fetch all users
  const { data: usersResponse, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get<User[]>('/admin/users')
  })

  const users = usersResponse || []

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowAddUser(false)
      resetForm()
    },
    onError: (error: any) => {
      console.error('Create user error:', error)
      const errorMessage = error.message || 'Unknown error occurred'
      
      // Try to extract detailed error information
      let detailedError = errorMessage
      try {
        // If the error response has details (from validation errors)
        if (error.response?.data?.details) {
          detailedError = `Validation failed: ${error.response.data.details.join(', ')}`
        } else if (error.response?.data?.error) {
          detailedError = error.response.data.error
        }
      } catch (e) {
        // Fall back to original error message
      }
      
      if (detailedError.includes('Email already in use')) {
        alert(`Email already exists: The email "${formData.email}" is already registered in the system. Please use a different email address.`)
      } else {
        alert(`Failed to create user: ${detailedError}`)
      }
    }
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => 
      api.put(`/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditingUser(null)
    }
  })

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      api.put(`/admin/users/${id}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'viewer'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form data being submitted:', formData)
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        data: { name: formData.name, email: formData.email, role: formData.role }
      })
    } else {
      createUserMutation.mutate(formData)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    })
    setShowAddUser(true)
  }

  const handleDelete = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id)
    }
  }

  const getRoleInfo = (role: string) => {
    return systemRoles.find(r => r.value === role) || systemRoles[5]
  }

  const filteredUsers = users.filter((user: User) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <Layout title="User Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="User Management" description="Manage system users and their roles">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                  Admin
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-900 font-medium">User Management</span>
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

        {/* Role Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Roles</CardTitle>
            <CardDescription>User roles and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemRoles.map(role => (
                <div key={role.value} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={role.color}>{role.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Badge variant="outline">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button onClick={() => {
            setEditingUser(null)
            resetForm()
            setShowAddUser(true)
          }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </Button>
        </div>

        {/* Add/Edit User Form */}
        {showAddUser && (
          <Card>
            <CardHeader>
              <CardTitle>{editingUser ? 'Edit User' : 'Add New User'}</CardTitle>
              <CardDescription>
                {editingUser ? 'Update user information' : 'Create a new system user'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  {!editingUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {systemRoles.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddUser(false)
                    setEditingUser(null)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                    {(createUserMutation.isPending || updateUserMutation.isPending) ? 'Processing...' : (editingUser ? 'Update User' : 'Create User')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>All users with system access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user: User) => {
                const roleInfo = getRoleInfo(user.role)
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.id !== currentUser?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate({ 
                              id: user.id, 
                              isActive: !user.isActive 
                            })}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(user)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}