import { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { DataTable, Column, TableActions } from '../components/ui/data-table'
import { Button } from '../components/ui/button'
import { ContractWizard } from '../components/wizards/ContractWizard'
import { ContractForm } from '../components/forms/ContractForm'
import { apiClient, type ContractWithRelations } from '../lib/api'
import { getErrorMessage } from '../lib/api'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showWizard, setShowWizard] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingContract, setEditingContract] = useState<ContractWithRelations | null>(null)

  const loadContracts = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.getContracts()
      
      if (response.success && response.data) {
        setContracts(response.data)
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
        await loadContracts() // Reload the list
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
          ? `${contract.customer.firstName} ${contract.customer.lastName}`
          : 'Unknown Customer'
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
      <DataTable
        data={contracts}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search contracts..."
        onAdd={() => {
          setShowWizard(true)
        }}
        addButtonText="New Contract"
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