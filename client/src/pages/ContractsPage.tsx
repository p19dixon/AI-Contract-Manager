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

export function ContractsPage() {
  const [contracts, setContracts] = useState<ContractWithRelations[]>([])
  const [groupedContracts, setGroupedContracts] = useState<GroupedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showWizard, setShowWizard] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingContract, setEditingContract] = useState<ContractWithRelations | null>(null)
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped')

  // Simple column widths state for grouped view
  const [columnWidths, setColumnWidths] = useState({
    customer: 300,
    contracts: 120,
    totalValue: 150,
    status: 250
  })
  const [resizing, setResizing] = useState<string | null>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

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
    if (statusEntries.length === 0) return 'No contracts'
    
    return statusEntries
      .sort(([,a], [,b]) => b - a)
      .map(([status, count]) => `${status}: ${count}`)
      .join(', ')
  }

  // Simple resize handlers
  const handleMouseDown = (column: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(column)
    startX.current = e.clientX
    startWidth.current = columnWidths[column as keyof typeof columnWidths]
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return
      
      const diff = e.clientX - startX.current
      const newWidth = Math.max(50, startWidth.current + diff)
      
      setColumnWidths(prev => ({
        ...prev,
        [resizing]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setResizing(null)
    }

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizing])

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
        await loadContracts()
      } else {
        alert(response.error || 'Failed to delete contract')
      }
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }

  const columns: Column<ContractWithRelations>[] = [
    { key: 'id', header: 'ID', width: '16' },
    { 
      key: 'customer' as keyof ContractWithRelations, 
      header: 'Customer', 
      render: (_, contract) => contract.customer ? (
        <div>
          <div className="font-medium">{contract.customer.company || 'Individual'}</div>
          <div className="text-sm text-gray-600">
            {contract.customer.firstName} {contract.customer.lastName}
          </div>
        </div>
      ) : 'Unknown Customer'
    },
    { 
      key: 'product' as keyof ContractWithRelations, 
      header: 'Product', 
      render: (_, contract) => contract.product?.name || 'Unknown Product'
    },
    { key: 'billingStatus', header: 'Status' },
    { 
      key: 'netAmount', 
      header: 'Amount', 
      render: (amount) => formatCurrency(amount)
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
          <div className="border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groupedContracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No contracts found. Create your first contract to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium relative" style={{ width: columnWidths.customer }}>
                        Customer
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize"
                          onMouseDown={handleMouseDown('customer')}
                        />
                      </th>
                      <th className="text-center p-4 font-medium relative" style={{ width: columnWidths.contracts }}>
                        Contracts
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize"
                          onMouseDown={handleMouseDown('contracts')}
                        />
                      </th>
                      <th className="text-right p-4 font-medium relative" style={{ width: columnWidths.totalValue }}>
                        Total Value
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize"
                          onMouseDown={handleMouseDown('totalValue')}
                        />
                      </th>
                      <th className="text-left p-4 font-medium relative" style={{ width: columnWidths.status }}>
                        Status Summary
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize"
                          onMouseDown={handleMouseDown('status')}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedContracts.map((group, index) => (
                      <React.Fragment key={group.customerId}>
                        <tr className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                          <td className="p-4" style={{ width: columnWidths.customer }}>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleGroupExpansion(group.customerId)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                {group.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              <div>
                                <div className="font-medium">{group.company}</div>
                                <div className="text-sm text-gray-600">{group.contact}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-4" style={{ width: columnWidths.contracts }}>
                            <div className="font-medium">{group.totalCount}</div>
                            <div className="text-xs text-gray-500">contracts</div>
                          </td>
                          <td className="text-right p-4" style={{ width: columnWidths.totalValue }}>
                            <div className="font-medium">{formatCurrency(group.totalValue.toString())}</div>
                            <div className="text-xs text-gray-500">combined</div>
                          </td>
                          <td className="p-4 text-sm" style={{ width: columnWidths.status }}>
                            {formatStatusSummary(group.statusCounts)}
                          </td>
                        </tr>
                        {group.isExpanded && (
                          <tr>
                            <td colSpan={4} className="bg-gray-50 p-4">
                              <h4 className="font-medium mb-3">
                                Contracts for {group.company}
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
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
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
            cardRenderer={(contract) => (
              <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {contract.customer?.company || 'Individual'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {contract.customer?.firstName} {contract.customer?.lastName}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    contract.billingStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                    contract.billingStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    contract.billingStatus === 'LATE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contract.billingStatus}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Product:</span>{' '}
                    <span className="font-medium">{contract.product?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>{' '}
                    <span className="font-medium">{formatCurrency(contract.netAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Term:</span>{' '}
                    <span>{contract.contractTerm} year(s) - {contract.billingCycle}</span>
                  </div>
                  {contract.reseller && (
                    <div>
                      <span className="text-gray-500">Reseller:</span>{' '}
                      <span>{contract.reseller.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t border-gray-100 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
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
                    className="flex-1"
                    onClick={() => handleDelete(contract)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
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

      {editingContract && (
        <ContractForm
          open={showEditForm}
          onOpenChange={(open) => {
            setShowEditForm(open)
            if (!open) setEditingContract(null)
          }}
          contract={editingContract}
          onSuccess={() => {
            setShowEditForm(false)
            setEditingContract(null)
            loadContracts()
          }}
        />
      )}
    </Layout>
  )
}