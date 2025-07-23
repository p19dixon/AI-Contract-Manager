import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ContractCard } from '../components/contracts/ContractCard'
import { ContractForm } from '../components/contracts/ContractForm'
import { PurchaseOrderUpload } from '../components/customerPortal/PurchaseOrderUpload'
import { ProductCatalog } from '../components/customerPortal/ProductCatalog'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'

interface DashboardData {
  customer: {
    name: string
    email: string
    type: string
  }
  contracts: {
    all: Array<any>
    active: Array<any>
    pending: Array<any>
    total: number
    totalValue: string
  }
  products: Array<any>
  purchaseOrders: Array<any>
}

const getBillingStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'BILLED':
    case 'RECEIVED':
      return 'bg-blue-100 text-blue-800'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'LATE':
      return 'bg-red-100 text-red-800'
    case 'CANCELED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'Paid'
    case 'BILLED':
      return 'Billed'
    case 'RECEIVED':
      return 'Payment Received'
    case 'PENDING':
      return 'Pending'
    case 'LATE':
      return 'Overdue'
    case 'CANCELED':
      return 'Canceled'
    default:
      return status
  }
}

export function CustomerPortal() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [contractFilter, setContractFilter] = useState('all')
  const [showNewContractForm, setShowNewContractForm] = useState(false)

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['customer-portal-dashboard'],
    queryFn: () => api.get('/customer-portal/dashboard'),
    retry: false
  })

  const { data: contracts } = useQuery<any[]>({
    queryKey: ['customer-contracts', contractFilter],
    queryFn: () => api.get<any[]>(`/customer-portal/contracts?status=${contractFilter}`),
    enabled: activeTab === 'contracts'
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in as a customer to access this portal.</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return <div>No data available</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Portal</h1>
          <p className="text-gray-600">Welcome back, {dashboardData.customer.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{dashboardData.customer.email}</p>
          <Badge variant="outline" className="mt-1">
            {dashboardData.customer.type}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="contracts">My Contracts</TabsTrigger>
          <TabsTrigger value="products">Order Licenses</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.contracts.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.contracts.active.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.contracts.pending.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.contracts.totalValue)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Contracts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Contracts</CardTitle>
              <CardDescription>Your latest contract activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.contracts.all.slice(0, 5).map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{contract.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-500">
                        {contract.startDate} - {contract.endDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(contract.netAmount)}</p>
                      <Badge className={getBillingStatusColor(contract.billingStatus)}>
                        {getStatusLabel(contract.billingStatus)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          {/* Contract Filter */}
          <div className="flex gap-2">
            <Button
              variant={contractFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setContractFilter('all')}
            >
              All Contracts
            </Button>
            <Button
              variant={contractFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setContractFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={contractFilter === 'inactive' ? 'default' : 'outline'}
              onClick={() => setContractFilter('inactive')}
            >
              Inactive
            </Button>
          </div>

          {/* Contracts List */}
          {contracts && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts.map((contract: any) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Order New Licenses</h2>
            <Button onClick={() => setShowNewContractForm(true)}>
              Order License
            </Button>
          </div>

          {dashboardData.products && (
            <ProductCatalog products={dashboardData.products} />
          )}

          {showNewContractForm && (
            <ContractForm
              onClose={() => setShowNewContractForm(false)}
              onSubmit={() => {
                setShowNewContractForm(false)
                // Refresh data
                window.location.reload()
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
          </div>

          <PurchaseOrderUpload />

          {/* Purchase Orders List */}
          <div className="space-y-4">
            {dashboardData.purchaseOrders.map((po: any) => (
              <Card key={po.id}>
                <CardHeader>
                  <CardTitle className="text-lg">PO #{po.poNumber}</CardTitle>
                  <CardDescription>
                    Uploaded: {new Date(po.uploadedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{po.fileName}</p>
                      <p className="text-sm text-gray-500">
                        Size: {(po.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        po.status === 'approved' ? 'bg-green-100 text-green-800' :
                        po.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {po.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}