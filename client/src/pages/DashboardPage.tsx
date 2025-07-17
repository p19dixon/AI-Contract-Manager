import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ContractWizard } from '../components/wizards/ContractWizard'
import { AnalyticsDialog } from '../components/dialogs/AnalyticsDialog'
import { apiClient } from '../lib/api'
import { getErrorMessage } from '../lib/api'

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState<string>('')
  const [showContractWizard, setShowContractWizard] = useState(false)
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [analyticsType, setAnalyticsType] = useState<'contracts' | 'revenue' | 'renewals' | 'overdue'>('contracts')
  const [analyticsTitle, setAnalyticsTitle] = useState('')
  const [analyticsDescription, setAnalyticsDescription] = useState('')
  const [metrics, setMetrics] = useState({
    totalContracts: 0,
    activeRevenue: 0,
    pendingRenewals: 0,
    overduePayments: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalResellers: 0
  })

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [contractsRes, customersRes, productsRes, resellersRes] = await Promise.all([
        apiClient.getContracts(),
        apiClient.getCustomers(),
        apiClient.getProducts(),
        apiClient.getResellers()
      ])

      let totalContracts = 0
      let activeRevenue = 0
      let pendingRenewals = 0
      let overduePayments = 0

      if (contractsRes.success && contractsRes.data) {
        totalContracts = contractsRes.data.length
        
        contractsRes.data.forEach(contract => {
          const amount = parseFloat(contract.netAmount || '0')
          if (contract.billingStatus === 'PAID' || contract.billingStatus === 'RECEIVED') {
            activeRevenue += amount
          }
          if (contract.billingStatus === 'PENDING') {
            pendingRenewals += 1
          }
          if (contract.billingStatus === 'LATE') {
            overduePayments += amount
          }
        })
      }

      setMetrics({
        totalContracts,
        activeRevenue,
        pendingRenewals,
        overduePayments,
        totalCustomers: customersRes.success && customersRes.data ? customersRes.data.length : 0,
        totalProducts: productsRes.success && productsRes.data ? productsRes.data.length : 0,
        totalResellers: resellersRes.success && resellersRes.data ? resellersRes.data.length : 0
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Layout>
      <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Metrics Cards */}
            <Card 
              className="card-modern hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              onClick={() => {
                setAnalyticsType('contracts')
                setAnalyticsTitle('Total Contracts')
                setAnalyticsDescription('All contracts in the system')
                setShowAnalyticsDialog(true)
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Contracts
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-primary"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="m22 21-3-3" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : metrics.totalContracts}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active contracts in system
                </p>
              </CardContent>
            </Card>

            <Card 
              className="card-modern hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              onClick={() => {
                setAnalyticsType('revenue')
                setAnalyticsTitle('Active Revenue')
                setAnalyticsDescription('Revenue from paid and received contracts')
                setShowAnalyticsDialog(true)
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Revenue
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-success"
                  >
                    <path d="M12 2v20m8-10H4" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : formatCurrency(metrics.activeRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From paid contracts
                </p>
              </CardContent>
            </Card>

            <Card 
              className="card-modern hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              onClick={() => {
                setAnalyticsType('renewals')
                setAnalyticsTitle('Pending Renewals')
                setAnalyticsDescription('Contracts with pending payment status')
                setShowAnalyticsDialog(true)
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Renewals
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-warning"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : metrics.pendingRenewals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Contracts pending payment
                </p>
              </CardContent>
            </Card>

            <Card 
              className="card-modern hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              onClick={() => {
                setAnalyticsType('overdue')
                setAnalyticsTitle('Overdue Payments')
                setAnalyticsDescription('Contracts with late payment status')
                setShowAnalyticsDialog(true)
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue Payments
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-destructive"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : formatCurrency(metrics.overduePayments)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.overduePayments > 0 ? 'Requiring attention' : 'No overdue payments'}
                </p>
              </CardContent>
            </Card>
          </div>

        {/* Welcome Card */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome to your <span className="text-primary">Dashboard</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1 font-normal">
                  Manage your contract portfolio efficiently
                </p>
              </div>
              <Button 
                onClick={() => setShowContractWizard(true)}
                className="btn-modern cap-gradient-primary hover:shadow-lg text-white"
              >
                + Create New Contract
              </Button>
            </CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `Manage ${metrics.totalContracts} contracts, ${metrics.totalCustomers} customers, ${metrics.totalProducts} products, and ${metrics.totalResellers} resellers from here.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/contracts">
                <Button className="justify-start h-auto p-6 flex-col w-full btn-modern cap-gradient-primary hover:shadow-lg text-white border-0">
                  <div className="text-lg font-semibold mb-2">Contracts ({loading ? '...' : metrics.totalContracts})</div>
                  <div className="text-sm text-white/90">
                    Create and manage contracts
                  </div>
                </Button>
              </Link>
              <Link href="/customers">
                <Button variant="outline" className="justify-start h-auto p-6 flex-col w-full btn-modern hover:bg-primary/5 hover:border-primary/20 hover:shadow-md">
                  <div className="text-lg font-semibold mb-2">Customers ({loading ? '...' : metrics.totalCustomers})</div>
                  <div className="text-sm text-muted-foreground">
                    Manage customer relationships
                  </div>
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="justify-start h-auto p-6 flex-col w-full btn-modern hover:bg-primary/5 hover:border-primary/20 hover:shadow-md">
                  <div className="text-lg font-semibold mb-2">Products ({loading ? '...' : metrics.totalProducts})</div>
                  <div className="text-sm text-muted-foreground">
                    Manage product catalog
                  </div>
                </Button>
              </Link>
              <Link href="/resellers">
                <Button variant="outline" className="justify-start h-auto p-6 flex-col w-full btn-modern hover:bg-primary/5 hover:border-primary/20 hover:shadow-md">
                  <div className="text-lg font-semibold mb-2">Resellers ({loading ? '...' : metrics.totalResellers})</div>
                  <div className="text-sm text-muted-foreground">
                    Manage reseller network
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <ContractWizard
        open={showContractWizard}
        onOpenChange={setShowContractWizard}
        onSuccess={() => {
          setShowContractWizard(false)
          loadDashboardData() // Refresh dashboard metrics
        }}
      />

      <AnalyticsDialog
        open={showAnalyticsDialog}
        onOpenChange={setShowAnalyticsDialog}
        type={analyticsType}
        title={analyticsTitle}
        description={analyticsDescription}
      />
    </Layout>
  )
}