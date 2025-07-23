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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Metrics Cards */}
            <Card 
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-blue-500 to-blue-600"
              onClick={() => {
                setAnalyticsType('contracts')
                setAnalyticsTitle('Total Contracts')
                setAnalyticsDescription('All contracts in the system')
                setShowAnalyticsDialog(true)
              }}
            >
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">
                    Total Contracts
                  </CardTitle>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-6 w-6 text-white"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {loading ? (
                      <div className="h-8 w-20 bg-white/20 animate-pulse rounded"></div>
                    ) : (
                      metrics.totalContracts
                    )}
                  </div>
                  <p className="text-sm text-white/80 mt-1">
                    Active contracts
                  </p>
                  <div className="mt-4 flex items-center text-xs text-white/70">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>+12% from last month</span>
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card 
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-green-500 to-emerald-600"
              onClick={() => {
                setAnalyticsType('revenue')
                setAnalyticsTitle('Active Revenue')
                setAnalyticsDescription('Revenue from paid and received contracts')
                setShowAnalyticsDialog(true)
              }}
            >
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">
                    Active Revenue
                  </CardTitle>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-6 w-6 text-white"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {loading ? (
                      <div className="h-8 w-32 bg-white/20 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(metrics.activeRevenue)
                    )}
                  </div>
                  <p className="text-sm text-white/80 mt-1">
                    From paid contracts
                  </p>
                  <div className="mt-4 flex items-center text-xs text-white/70">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>+23% revenue growth</span>
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card 
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-amber-500 to-orange-600"
              onClick={() => {
                setAnalyticsType('renewals')
                setAnalyticsTitle('Pending Renewals')
                setAnalyticsDescription('Contracts with pending payment status')
                setShowAnalyticsDialog(true)
              }}
            >
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">
                    Pending Renewals
                  </CardTitle>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-6 w-6 text-white"
                    >
                      <path d="M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12z" />
                      <path d="M12 8v4l2 2" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {loading ? (
                      <div className="h-8 w-16 bg-white/20 animate-pulse rounded"></div>
                    ) : (
                      metrics.pendingRenewals
                    )}
                  </div>
                  <p className="text-sm text-white/80 mt-1">
                    Need attention
                  </p>
                  <div className="mt-4 flex items-center text-xs text-white/70">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Action required</span>
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card 
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-red-500 to-rose-600"
              onClick={() => {
                setAnalyticsType('overdue')
                setAnalyticsTitle('Overdue Payments')
                setAnalyticsDescription('Contracts with late payment status')
                setShowAnalyticsDialog(true)
              }}
            >
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">
                    Overdue Payments
                  </CardTitle>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-6 w-6 text-white"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {loading ? (
                      <div className="h-8 w-32 bg-white/20 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(metrics.overduePayments)
                    )}
                  </div>
                  <p className="text-sm text-white/80 mt-1">
                    {metrics.overduePayments > 0 ? 'Past due amount' : 'All payments on track'}
                  </p>
                  <div className="mt-4 flex items-center text-xs text-white/70">
                    {metrics.overduePayments > 0 ? (
                      <>
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Immediate action needed</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>All clear</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/contracts" className="block">
                <Button className="h-auto p-4 sm:p-6 flex flex-col items-center text-center w-full btn-modern cap-gradient-primary hover:shadow-lg text-white border-0 min-h-[120px]">
                  <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 break-words">
                    Contracts ({loading ? '...' : metrics.totalContracts})
                  </div>
                  <div className="text-xs sm:text-sm text-white/90 break-words">
                    Create and manage contracts
                  </div>
                </Button>
              </Link>
              <Link href="/customers" className="block">
                <Button variant="outline" className="h-auto p-4 sm:p-6 flex flex-col items-center text-center w-full btn-modern hover:bg-primary/5 hover:border-primary/20 hover:shadow-md min-h-[120px]">
                  <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 break-words">
                    Customers ({loading ? '...' : metrics.totalCustomers})
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    Manage customer relationships
                  </div>
                </Button>
              </Link>
              <Link href="/products" className="block">
                <Button variant="outline" className="h-auto p-4 sm:p-6 flex flex-col items-center text-center w-full btn-modern hover:bg-primary/5 hover:border-primary/20 hover:shadow-md min-h-[120px]">
                  <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 break-words">
                    Products ({loading ? '...' : metrics.totalProducts})
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    Manage product catalog
                  </div>
                </Button>
              </Link>
              <Link href="/resellers" className="block">
                <Button variant="outline" className="h-auto p-4 sm:p-6 flex flex-col items-center text-center w-full btn-modern hover:bg-primary/5 hover:border-primary/20 hover:shadow-md min-h-[120px]">
                  <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 break-words">
                    Resellers ({loading ? '...' : metrics.totalResellers})
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
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