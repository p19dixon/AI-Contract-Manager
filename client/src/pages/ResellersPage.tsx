import React, { useState, useEffect, useRef } from 'react'
import { Layout } from '../components/layout/Layout'
import { DataTable, Column, TableActions } from '../components/ui/data-table'
import { Button } from '../components/ui/button'
import { ResellerForm } from '../components/forms/ResellerForm'
import { ResellerContractsDialog } from '../components/dialogs/ResellerContractsDialog'
import { ContractWizard } from '../components/wizards/ContractWizard'
import { apiClient, type Reseller, type ContractWithRelations } from '../lib/api'
import { getErrorMessage } from '../lib/api'
import { ChevronDown, ChevronRight } from 'lucide-react'

// Interface for grouped resellers
interface GroupedReseller {
  resellerId: number
  resellerName: string
  resellerEmail: string
  resellerPhone: string
  marginPercentage: string
  contracts: ContractWithRelations[]
  customersCount: number
  totalContracts: number
  totalValue: number
  statusCounts: { [key: string]: number }
  isExpanded: boolean
}

export function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [groupedResellers, setGroupedResellers] = useState<GroupedReseller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null)
  const [showContractsDialog, setShowContractsDialog] = useState(false)
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null)
  const [showContractWizard, setShowContractWizard] = useState(false)
  const [contractReseller, setContractReseller] = useState<Reseller | null>(null)
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped')
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    reseller: 250,
    customers: 120,
    contracts: 120,
    totalValue: 150,
    margin: 120,
    status: 250
  })
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Group resellers with their contracts and customers
  const groupResellersByPerformance = (resellers: Reseller[], contracts: ContractWithRelations[]): GroupedReseller[] => {
    const groups: { [key: number]: GroupedReseller } = {}
    
    // Initialize groups for all resellers
    resellers.forEach(reseller => {
      groups[reseller.id] = {
        resellerId: reseller.id,
        resellerName: reseller.name,
        resellerEmail: reseller.email,
        resellerPhone: reseller.phone || '',
        marginPercentage: reseller.marginPercentage,
        contracts: [],
        customersCount: 0,
        totalContracts: 0,
        totalValue: 0,
        statusCounts: {},
        isExpanded: false
      }
    })
    
    // Add contracts to their respective resellers
    contracts.forEach(contract => {
      if (contract.resellerId && groups[contract.resellerId]) {
        groups[contract.resellerId].contracts.push(contract)
        groups[contract.resellerId].totalContracts += 1
        groups[contract.resellerId].totalValue += parseFloat(contract.netAmount || '0')
        
        // Count statuses
        const status = contract.billingStatus
        groups[contract.resellerId].statusCounts[status] = (groups[contract.resellerId].statusCounts[status] || 0) + 1
      }
    })
    
    // Calculate unique customers count for each reseller
    Object.values(groups).forEach(group => {
      const uniqueCustomers = new Set(group.contracts.map(c => c.customerId))
      group.customersCount = uniqueCustomers.size
    })
    
    // Sort by total value descending, then by name
    return Object.values(groups).sort((a, b) => {
      if (b.totalValue !== a.totalValue) {
        return b.totalValue - a.totalValue
      }
      return a.resellerName.localeCompare(b.resellerName)
    })
  }

  // Toggle expand/collapse for a reseller group
  const toggleGroupExpansion = (resellerId: number) => {
    setGroupedResellers(prev => 
      prev.map(group => 
        group.resellerId === resellerId 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }

  // Format status counts for display
  const formatStatusSummary = (statusCounts: { [key: string]: number }) => {
    const statusEntries = Object.entries(statusCounts)
    if (statusEntries.length === 0) return 'No contracts'
    
    return statusEntries
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .map(([status, count]) => `${status}: ${count}`)
      .join(', ')
  }

  // Handle resize start for custom table
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    setIsResizing(true)
    setResizingColumn(columnKey)
    startXRef.current = e.clientX
    startWidthRef.current = columnWidths[columnKey]
    
    // Add visual feedback
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  // Handle resize for custom table
  const handleResize = (e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return
    
    const deltaX = e.clientX - startXRef.current
    const newWidth = Math.max(1, startWidthRef.current + deltaX) // Allow shrinking to 1px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }

  // Handle resize end for custom table
  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizingColumn(null)
    
    // Remove visual feedback
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', handleResizeEnd)
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [])

  const loadResellers = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load both resellers and contracts
      const [resellersResponse, contractsResponse] = await Promise.all([
        apiClient.getResellers(),
        apiClient.getContracts()
      ])
      
      if (resellersResponse.success && resellersResponse.data) {
        setResellers(resellersResponse.data)
        
        if (contractsResponse.success && contractsResponse.data) {
          setGroupedResellers(groupResellersByPerformance(resellersResponse.data, contractsResponse.data))
        } else {
          setGroupedResellers(groupResellersByPerformance(resellersResponse.data, []))
        }
      } else {
        setError(resellersResponse.error || 'Failed to load resellers')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResellers()
  }, [])

  const handleDelete = async (reseller: Reseller) => {
    if (!confirm(`Are you sure you want to delete "${reseller.name}"?`)) {
      return
    }

    try {
      const response = await apiClient.deleteReseller(reseller.id)
      
      if (response.success) {
        await loadResellers() // Reload the list
      } else {
        alert(response.error || 'Failed to delete reseller')
      }
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const formatPercentage = (percentage: string) => {
    return `${parseFloat(percentage).toFixed(1)}%`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US')
  }

  const columns: Column<Reseller>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '16'
    },
    {
      key: 'name',
      header: 'Reseller Name'
    },
    {
      key: 'email',
      header: 'Email'
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (phone) => phone || 'N/A'
    },
    {
      key: 'marginPercentage',
      header: 'Margin %',
      render: (margin) => formatPercentage(margin)
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (date) => formatDate(date)
    }
  ]


  if (error) {
    return (
      <Layout title="Resellers" description="Manage your reseller network">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadResellers}>
            Try Again
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Resellers"
      description="Manage your reseller network and commission structure"
    >
      <div className="space-y-4">
        {/* View Mode Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grouped')}
            >
              Performance View
            </Button>
            <Button
              variant={viewMode === 'individual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('individual')}
            >
              Individual View
            </Button>
          </div>
          <Button onClick={() => { setEditingReseller(null); setShowForm(true) }}>
            New Reseller
          </Button>
        </div>

        {/* Grouped Performance View */}
        {viewMode === 'grouped' && (
          <div className="space-y-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groupedResellers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No resellers found. Add your first reseller to get started.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b overflow-x-auto">
                  <table className="border-collapse" style={{ minWidth: 'max-content' }}>
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="relative text-left font-medium text-sm text-gray-700" style={{ width: `${columnWidths.reseller}px` }}>
                          <div className="px-4 py-3 break-words">Reseller</div>
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                            style={{
                              width: '3px',
                              backgroundColor: resizingColumn === 'reseller' ? '#3b82f6' : '#e5e7eb'
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'reseller')}
                            title="Drag to resize column"
                          />
                        </th>
                        <th className="relative text-center font-medium text-sm text-gray-700" style={{ width: `${columnWidths.customers}px` }}>
                          <div className="px-4 py-3 break-words">Customers</div>
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                            style={{
                              width: '3px',
                              backgroundColor: resizingColumn === 'customers' ? '#3b82f6' : '#e5e7eb'
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'customers')}
                            title="Drag to resize column"
                          />
                        </th>
                        <th className="relative text-center font-medium text-sm text-gray-700" style={{ width: `${columnWidths.contracts}px` }}>
                          <div className="px-4 py-3 break-words">Contracts</div>
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                            style={{
                              width: '3px',
                              backgroundColor: resizingColumn === 'contracts' ? '#3b82f6' : '#e5e7eb'
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'contracts')}
                            title="Drag to resize column"
                          />
                        </th>
                        <th className="relative text-right font-medium text-sm text-gray-700" style={{ width: `${columnWidths.totalValue}px` }}>
                          <div className="px-4 py-3 break-words">Total Value</div>
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                            style={{
                              width: '3px',
                              backgroundColor: resizingColumn === 'totalValue' ? '#3b82f6' : '#e5e7eb'
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'totalValue')}
                            title="Drag to resize column"
                          />
                        </th>
                        <th className="relative text-center font-medium text-sm text-gray-700" style={{ width: `${columnWidths.margin}px` }}>
                          <div className="px-4 py-3 break-words">Margin %</div>
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                            style={{
                              width: '3px',
                              backgroundColor: resizingColumn === 'margin' ? '#3b82f6' : '#e5e7eb'
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'margin')}
                            title="Drag to resize column"
                          />
                        </th>
                        <th className="relative text-left font-medium text-sm text-gray-700" style={{ width: `${columnWidths.status}px` }}>
                          <div className="px-4 py-3 break-words">Status Summary</div>
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                            style={{
                              width: '3px',
                              backgroundColor: resizingColumn === 'status' ? '#3b82f6' : '#e5e7eb'
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'status')}
                            title="Drag to resize column"
                          />
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>
                
                {/* Rows */}
                <div className="overflow-x-auto">
                  <table className="border-collapse" style={{ minWidth: 'max-content' }}>
                    <tbody>
                    {groupedResellers.map((group, index) => (
                      <React.Fragment key={group.resellerId}>
                        {/* Reseller Group Row */}
                        <tr className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                          <td className="relative" style={{ width: `${columnWidths.reseller}px` }}>
                            <div className="flex items-center space-x-2 px-4 py-3">
                              <button
                                onClick={() => toggleGroupExpansion(group.resellerId)}
                                className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                              >
                                {group.isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium break-words">{group.resellerName}</div>
                                <div className="text-sm text-gray-600 break-words">{group.resellerEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-4 py-3" style={{ width: `${columnWidths.customers}px` }}>
                            <div className="font-medium">{group.customersCount}</div>
                            <div className="text-xs text-gray-500">customers</div>
                          </td>
                          <td className="text-center px-4 py-3" style={{ width: `${columnWidths.contracts}px` }}>
                            <div className="font-medium">{group.totalContracts}</div>
                            <div className="text-xs text-gray-500">contracts</div>
                          </td>
                          <td className="text-right px-4 py-3" style={{ width: `${columnWidths.totalValue}px` }}>
                            <div className="font-medium break-words">{formatCurrency(group.totalValue)}</div>
                            <div className="text-xs text-gray-500">revenue</div>
                          </td>
                          <td className="text-center px-4 py-3" style={{ width: `${columnWidths.margin}px` }}>
                            <div className="font-medium">{formatPercentage(group.marginPercentage)}</div>
                            <div className="text-xs text-gray-500">commission</div>
                          </td>
                          <td className="text-sm px-4 py-3" style={{ width: `${columnWidths.status}px` }}>
                            <div className="break-words">{formatStatusSummary(group.statusCounts)}</div>
                          </td>
                        </tr>
                    
                        {/* Expanded Contracts */}
                        {group.isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50 border-b">
                              <div className="p-4">
                                <h4 className="font-medium mb-3 text-gray-700">
                                  Contracts for {group.resellerName}
                                </h4>
                                <DataTable
                            data={group.contracts}
                            columns={[
                              { key: 'id', header: 'ID', width: '16' },
                              { 
                                key: 'customer', 
                                header: 'Customer', 
                                render: (_, contract) => contract.customer ? 
                                  (contract.customer.company || 'Individual Customer') : 'Unknown Customer'
                              },
                              { 
                                key: 'customer' as keyof ContractWithRelations, 
                                header: 'Contact', 
                                render: (_, contract) => contract.customer ? 
                                  `${contract.customer.firstName} ${contract.customer.lastName}` : 'Unknown Contact'
                              },
                              { 
                                key: 'product', 
                                header: 'Product', 
                                render: (_, contract) => contract.product?.name || 'Unknown Product'
                              },
                              { 
                                key: 'billingStatus', 
                                header: 'Status', 
                                render: (status) => <span className={`px-2 py-1 rounded text-xs ${
                                  status === 'PAID' ? 'bg-green-100 text-green-800' :
                                  status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  status === 'LATE' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{status}</span>
                              },
                              { 
                                key: 'netAmount', 
                                header: 'Amount', 
                                render: (amount) => formatCurrency(parseFloat(amount))
                              }
                            ]}
                            loading={false}
                            searchable={false}
                            emptyMessage="No contracts found"
                            actions={(contract) => (
                              <TableActions>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    // Find the reseller from the contract
                                    const reseller = resellers.find(r => r.id === contract.resellerId)
                                    setSelectedReseller(reseller || null)
                                    setShowContractsDialog(true)
                                  }}
                                >
                                  View Details
                                </Button>
                              </TableActions>
                            )}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Individual View */}
        {viewMode === 'individual' && (
          <DataTable
            data={resellers}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Search resellers..."
            emptyMessage="No resellers found. Add your first reseller to get started."
            actions={(reseller) => (
              <TableActions>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setEditingReseller(reseller)
                    setShowForm(true)
                  }}
                >
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedReseller(reseller)
                    setShowContractsDialog(true)
                  }}
                >
                  View Contracts
                </Button>
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => {
                    setContractReseller(reseller)
                    setShowContractWizard(true)
                  }}
                >
                  + Contract
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(reseller)}
                >
                  Delete
                </Button>
              </TableActions>
            )}
          />
        )}
      </div>

      <ResellerForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) {
            setEditingReseller(null)
          }
        }}
        reseller={editingReseller}
        onSuccess={loadResellers}
      />

      <ResellerContractsDialog
        open={showContractsDialog}
        onOpenChange={(open) => {
          setShowContractsDialog(open)
          if (!open) {
            setSelectedReseller(null)
          }
        }}
        reseller={selectedReseller}
      />

      <ContractWizard
        open={showContractWizard}
        onOpenChange={(open) => {
          setShowContractWizard(open)
          if (!open) {
            setContractReseller(null)
          }
        }}
        prefilledReseller={contractReseller}
        onSuccess={() => {
          setShowContractWizard(false)
          setContractReseller(null)
        }}
      />
    </Layout>
  )
}