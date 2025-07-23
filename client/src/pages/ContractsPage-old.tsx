import React, { useState, useEffect, useRef } from 'react'
import { Layout } from '../components/layout/Layout'
import { DataTable, Column, TableActions } from '../components/ui/data-table'
import { Button } from '../components/ui/button'
import { ContractWizard } from '../components/wizards/ContractWizard'
import { ContractForm } from '../components/forms/ContractForm'
import { apiClient, type ContractWithRelations } from '../lib/api'
import { getErrorMessage } from '../lib/api'
import { ChevronDown, ChevronRight } from 'lucide-react'

// Interface for grouped contracts
interface GroupedContract {
  customerId: number
  customerName: string
  company: string
  contact: string
  contracts: ContractWithRelations[]
  totalValue: number
  totalCount: number
  statusCounts: { [key: string]: number }
  isExpanded: boolean
}

// Create a simple badge component since we don't have it yet
const BadgeComponent = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'destructive' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<ContractWithRelations[]>([])
  const [groupedContracts, setGroupedContracts] = useState<GroupedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showWizard, setShowWizard] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingContract, setEditingContract] = useState<ContractWithRelations | null>(null)
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped')
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    customer: 300,
    contracts: 120,
    totalValue: 150,
    status: 250
  })
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Group contracts by customer
  const groupContractsByCustomer = (contracts: ContractWithRelations[]): GroupedContract[] => {
    const groups: { [key: number]: GroupedContract } = {}
    
    contracts.forEach(contract => {
      const customerId = contract.customerId
      if (!groups[customerId]) {
        groups[customerId] = {
          customerId,
          customerName: contract.customer?.company || 'Individual Customer',
          company: contract.customer?.company || 'Individual Customer',
          contact: contract.customer ? `${contract.customer.firstName} ${contract.customer.lastName}` : 'Unknown Contact',
          contracts: [],
          totalValue: 0,
          totalCount: 0,
          statusCounts: {},
          isExpanded: false
        }
      }
      
      groups[customerId].contracts.push(contract)
      groups[customerId].totalCount += 1
      groups[customerId].totalValue += parseFloat(contract.netAmount || '0')
      
      // Count statuses
      const status = contract.billingStatus
      groups[customerId].statusCounts[status] = (groups[customerId].statusCounts[status] || 0) + 1
    })
    
    // Sort by company name, then by contact name
    return Object.values(groups).sort((a, b) => {
      if (a.company !== b.company) {
        return a.company.localeCompare(b.company)
      }
      return a.contact.localeCompare(b.contact)
    })
  }

  // Toggle expand/collapse for a customer group
  const toggleGroupExpansion = (customerId: number) => {
    setGroupedContracts(prev => 
      prev.map(group => 
        group.customerId === customerId 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }

  // Format status counts for display
  const formatStatusSummary = (statusCounts: { [key: string]: number }) => {
    const statusEntries = Object.entries(statusCounts)
    if (statusEntries.length === 0) return ''
    
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

  const loadContracts = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.getContracts()
      
      if (response.success && response.data) {
        setContracts(response.data)
        setGroupedContracts(groupContractsByCustomer(response.data))
      } else {
        setError(response.error || 'Failed to load contracts')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
  }, [])

  const handleDelete = async (contract: ContractWithRelations) => {
    if (!confirm(`Are you sure you want to delete contract #${contract.id}?`)) {
      return
    }

    try {
      const response = await apiClient.deleteContract(contract.id)
      
      if (response.success) {
        await loadContracts() // Reload the list and regenerate grouped data
      } else {
        alert(response.error || 'Failed to delete contract')
      }
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const getBillingStatusVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success'
      case 'BILLED':
      case 'RECEIVED':
        return 'warning'
      case 'LATE':
      case 'CANCELED':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US')
  }

  const columns: Column<ContractWithRelations>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '16'
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_, contract) => 
        contract.customer 
          ? contract.customer.company || 'Individual Customer'
          : 'Unknown Customer'
    },
    {
      key: 'customer' as keyof ContractWithRelations,
      header: 'Contact',
      render: (_, contract) => 
        contract.customer 
          ? `${contract.customer.firstName} ${contract.customer.lastName}`
          : 'Unknown Contact'
    },
    {
      key: 'product',
      header: 'Product',
      render: (_, contract) => 
        contract.product?.name || 'Unknown Product'
    },
    {
      key: 'billingStatus',
      header: 'Status',
      render: (status) => (
        <BadgeComponent variant={getBillingStatusVariant(status)}>
          {status}
        </BadgeComponent>
      )
    },
    {
      key: 'netAmount',
      header: 'Amount',
      render: (amount) => formatCurrency(amount)
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (date) => formatDate(date)
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (date) => formatDate(date)
    },
    {
      key: 'billingCycle',
      header: 'Billing Cycle',
      render: (cycle) => cycle.charAt(0).toUpperCase() + cycle.slice(1)
    }
  ]


  if (error) {
    return (
      <Layout title="Contracts" description="Manage your data licensing contracts">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadContracts}>
            Try Again
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Contracts"
      description="Manage your data licensing contracts and track billing status"
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
              Grouped View
            </Button>
            <Button
              variant={viewMode === 'individual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('individual')}
            >
              Individual View
            </Button>
          </div>
          <Button onClick={() => setShowWizard(true)}>
            New Contract
          </Button>
        </div>

        {/* Grouped View */}
        {viewMode === 'grouped' && (
          <div className="space-y-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groupedContracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No contracts found. Create your first contract to get started.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b overflow-x-auto">
                  <table className="border-collapse" style={{ minWidth: 'max-content' }}>
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="relative text-left font-medium text-sm text-gray-700" style={{ width: `${columnWidths.customer}px` }}>
                          <div className="px-4 py-3 truncate">Customer</div>
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                            style={{
                              width: '3px',
                              backgroundColor: resizingColumn === 'customer' ? '#3b82f6' : '#e5e7eb'
                            }}
                            onMouseDown={(e) => handleResizeStart(e, 'customer')}
                            title="Drag to resize column"
                          />
                        </th>
                        <th className="relative text-center font-medium text-sm text-gray-700" style={{ width: `${columnWidths.contracts}px` }}>
                          <div className="px-4 py-3 truncate">Contracts</div>
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
                          <div className="px-4 py-3 truncate">Total Value</div>
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
                        <th className="relative text-left font-medium text-sm text-gray-700" style={{ width: `${columnWidths.status}px` }}>
                          <div className="px-4 py-3 truncate">Status Summary</div>
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
                    {groupedContracts.map((group, index) => (
                      <React.Fragment key={group.customerId}>
                        {/* Customer Group Row */}
                        <tr className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                          <td className="relative" style={{ width: `${columnWidths.customer}px` }}>
                            <div className="flex items-center space-x-2 px-4 py-3">
                              <button
                                onClick={() => toggleGroupExpansion(group.customerId)}
                                className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                              >
                                {group.isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{group.company}</div>
                                <div className="text-sm text-gray-600 truncate">{group.contact}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-4 py-3" style={{ width: `${columnWidths.contracts}px` }}>
                            <div className="font-medium">{group.totalCount}</div>
                            <div className="text-xs text-gray-500">contracts</div>
                          </td>
                          <td className="text-right px-4 py-3" style={{ width: `${columnWidths.totalValue}px` }}>
                            <div className="font-medium truncate">{formatCurrency(group.totalValue.toString())}</div>
                            <div className="text-xs text-gray-500">combined</div>
                          </td>
                          <td className="text-sm px-4 py-3" style={{ width: `${columnWidths.status}px` }}>
                            <div className="truncate">{formatStatusSummary(group.statusCounts)}</div>
                          </td>
                        </tr>
                    
                        {/* Expanded Contracts */}
                        {group.isExpanded && (
                          <tr>
                            <td colSpan={4} className="bg-gray-50 border-b">
                              <div className="p-4">
                                <h4 className="font-medium mb-3 text-gray-700">
                                  Contracts for {group.company} ({group.contact})
                                </h4>
                                <DataTable
                                  data={group.contracts}
                                  columns={columns}
                                  loading={false}
                                  searchable={false}
                                  emptyMessage="No contracts found"
                                  actions={(contract) => (
                                    <TableActions>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                          setEditingContract(contract)
                                          setShowEditForm(true)
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => handleDelete(contract)}
                                      >
                                        Delete
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
            data={contracts}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Search contracts..."
            emptyMessage="No contracts found. Create your first contract to get started."
            actions={(contract) => (
              <TableActions>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setEditingContract(contract)
                    setShowEditForm(true)
                  }}
                >
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(contract)}
                >
                  Delete
                </Button>
              </TableActions>
            )}
          />
        )}
      </div>

      <ContractWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSuccess={() => {
          setShowWizard(false)
          loadContracts()
        }}
      />

      <ContractForm
        open={showEditForm}
        onOpenChange={(open) => {
          setShowEditForm(open)
          if (!open) {
            setEditingContract(null)
          }
        }}
        contract={editingContract}
        onSuccess={() => {
          setShowEditForm(false)
          setEditingContract(null)
          loadContracts()
        }}
      />
    </Layout>
  )
}