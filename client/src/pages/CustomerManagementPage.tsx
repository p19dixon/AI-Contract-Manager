import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Layout } from '../components/layout/Layout'
import { Link } from 'wouter'
import { api } from '../lib/api'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  customerType: string
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  userId?: number
  canLogin: boolean
  status: string
  assignedToId?: number
  notes?: string
  approvedAt?: string
  approvedById?: number
  createdAt: string
  updatedAt: string
  assignedTo?: {
    id: number
    name: string
    email: string
    role: string
  }
  approvedBy?: {
    id: number
    name: string
    email: string
    role: string
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'suspended':
      return 'bg-red-100 text-red-800'
    case 'pending_approval':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    case 'suspended':
      return 'Suspended'
    case 'pending_approval':
      return 'Pending Approval'
    default:
      return status
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'manager':
      return 'bg-purple-100 text-purple-800'
    case 'sales':
      return 'bg-blue-100 text-blue-800'
    case 'support':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function CustomerManagementPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const queryClient = useQueryClient()

  // Fetch customers based on active tab
  const { data: customersResponse, isLoading } = useQuery<Customer[]>({
    queryKey: ['staff-customers', activeTab],
    queryFn: () => {
      const params = activeTab === 'all' ? '' : `?status=${activeTab}`
      console.log('Fetching customers with params:', params)
      return api.get<Customer[]>(`/staff/customers${params}`)
    }
  })

  // Handle both direct array response and wrapped response
  const customers = customersResponse || []

  // Fetch staff members
  const { data: staffResponse } = useQuery<any[]>({
    queryKey: ['staff-members'],
    queryFn: () => api.get<any[]>('/staff/staff')
  })
  
  // Handle both direct array response and wrapped response
  const staff = staffResponse || []

  // Fetch statistics
  const { data: stats } = useQuery<{ data: any }>({
    queryKey: ['customer-stats'],
    queryFn: () => api.get('/staff/stats')
  })

  // Update customer status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return api.put(`/staff/customers/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] })
      setShowStatusModal(false)
      setSelectedCustomer(null)
    }
  })

  // Assign customer to staff
  const assignMutation = useMutation({
    mutationFn: async ({ id, assignedToId }: { id: number; assignedToId: number }) => {
      return api.put(`/staff/customers/${id}/assign`, { assignedToId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-customers'] })
      setShowAssignModal(false)
      setSelectedCustomer(null)
    }
  })

  // Update customer notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return api.put(`/staff/customers/${id}/notes`, { notes })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-customers'] })
      setShowNotesModal(false)
      setSelectedCustomer(null)
    }
  })

  const handleStatusUpdate = (customer: Customer) => {
    setSelectedCustomer(customer)
    setNewStatus(customer.status)
    setShowStatusModal(true)
  }

  const handleAssign = (customer: Customer) => {
    setSelectedCustomer(customer)
    setAssignedTo(customer.assignedToId?.toString() || '')
    setShowAssignModal(true)
  }

  const handleNotes = (customer: Customer) => {
    setSelectedCustomer(customer)
    setNotes(customer.notes || '')
    setShowNotesModal(true)
  }

  const confirmStatusUpdate = () => {
    if (selectedCustomer) {
      updateStatusMutation.mutate({
        id: selectedCustomer.id,
        status: newStatus
      })
    }
  }

  const confirmAssign = () => {
    if (selectedCustomer && assignedTo) {
      assignMutation.mutate({
        id: selectedCustomer.id,
        assignedToId: parseInt(assignedTo)
      })
    }
  }

  const confirmNotes = () => {
    if (selectedCustomer) {
      updateNotesMutation.mutate({
        id: selectedCustomer.id,
        notes
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Layout 
      title="Customer Management" 
      description="Manage external customers, partners, and resellers"
    >
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
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
                  <span className="ml-4 text-gray-900 font-medium">Customer Management</span>
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

      {/* Statistics Cards */}
      {stats && stats.data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.data.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.data.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.data.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.data.suspended}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.data.inactive}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="space-y-4">
            {customers?.map((customer: Customer) => (
              <Card key={customer.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {customer.firstName} {customer.lastName}
                      </CardTitle>
                      <CardDescription>
                        {customer.email} • {customer.customerType}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(customer.status)}>
                        {getStatusLabel(customer.status)}
                      </Badge>
                      {customer.canLogin && (
                        <Badge variant="outline">Portal Access</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <p className="text-sm text-gray-600">{customer.phone || 'No phone'}</p>
                      <p className="text-sm text-gray-600">
                        {customer.street && customer.city ? 
                          `${customer.street}, ${customer.city}, ${customer.state} ${customer.zipCode}` : 
                          'No address'
                        }
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Assignment</h4>
                      {customer.assignedTo ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{customer.assignedTo.name}</span>
                          <Badge className={getRoleColor(customer.assignedTo.role)}>
                            {customer.assignedTo.role}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not assigned</span>
                      )}
                    </div>
                  </div>
                  
                  {customer.notes && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{customer.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(customer)}
                    >
                      Update Status
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssign(customer)}
                    >
                      Assign
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNotes(customer)}
                    >
                      Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Update Modal */}
      {showStatusModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update Customer Status</CardTitle>
              <CardDescription>
                Change status for {selectedCustomer.firstName} {selectedCustomer.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={confirmStatusUpdate}>
                    Update Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Customer</CardTitle>
              <CardDescription>
                Assign {selectedCustomer.firstName} {selectedCustomer.lastName} to a staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Assign to</label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff?.map((member: any) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={confirmAssign}>
                    Assign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update Notes</CardTitle>
              <CardDescription>
                Add or update notes for {selectedCustomer.firstName} {selectedCustomer.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes about this customer..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNotesModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={confirmNotes}>
                    Save Notes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </Layout>
  )
}