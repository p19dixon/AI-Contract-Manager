import { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { DataTable, Column, TableActions } from '../components/ui/data-table'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { CustomerForm } from '../components/forms/CustomerForm'
import { CustomerContractsDialog } from '../components/dialogs/CustomerContractsDialog'
import { ContractWizard } from '../components/wizards/ContractWizard'
import { apiClient, type Customer } from '../lib/api'
import { getErrorMessage } from '../lib/api'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [showContractsDialog, setShowContractsDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showContractWizard, setShowContractWizard] = useState(false)
  const [contractCustomer, setContractCustomer] = useState<Customer | null>(null)

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.getCustomers()
      
      if (response.success && response.data) {
        setCustomers(response.data)
      } else {
        setError(response.error || 'Failed to load customers')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) {
      return
    }

    try {
      const response = await apiClient.deleteCustomer(customer.id)
      
      if (response.success) {
        await loadCustomers() // Reload the list
      } else {
        alert(response.error || 'Failed to delete customer')
      }
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const getCustomerTypeVariant = (type: string) => {
    switch (type) {
      case 'partner':
        return 'success'
      case 'reseller':
        return 'warning'
      case 'solution_provider':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const formatCustomerType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US')
  }

  const columns: Column<Customer>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '16'
    },
    {
      key: 'firstName',
      header: 'Name',
      render: (_, customer) => `${customer.firstName} ${customer.lastName}`
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
      key: 'customerType',
      header: 'Type',
      render: (type) => (
        <Badge variant={getCustomerTypeVariant(type)}>
          {formatCustomerType(type)}
        </Badge>
      )
    },
    {
      key: 'city',
      header: 'Location',
      render: (_, customer) => {
        const location = [customer.city, customer.state, customer.country]
          .filter(Boolean)
          .join(', ')
        return location || 'N/A'
      }
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (date) => formatDate(date)
    }
  ]

  if (error) {
    return (
      <Layout title="Customers" description="Manage your customer relationships">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadCustomers}>
            Try Again
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Customers"
      description="Manage your customer relationships and contact information"
    >
      <DataTable
        data={customers}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search customers..."
        onAdd={() => {
          setEditingCustomer(null)
          setShowForm(true)
        }}
        addButtonText="New Customer"
        emptyMessage="No customers found. Add your first customer to get started."
        actions={(customer) => (
          <TableActions>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setEditingCustomer(customer)
                setShowForm(true)
              }}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setSelectedCustomer(customer)
                setShowContractsDialog(true)
              }}
            >
              View Contracts
            </Button>
            <Button 
              size="sm" 
              variant="default"
              onClick={() => {
                setContractCustomer(customer)
                setShowContractWizard(true)
              }}
            >
              + Contract
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleDelete(customer)}
            >
              Delete
            </Button>
          </TableActions>
        )}
      />

      <CustomerForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) {
            setEditingCustomer(null)
          }
        }}
        customer={editingCustomer}
        onSuccess={loadCustomers}
      />

      <CustomerContractsDialog
        open={showContractsDialog}
        onOpenChange={(open) => {
          setShowContractsDialog(open)
          if (!open) {
            setSelectedCustomer(null)
          }
        }}
        customer={selectedCustomer}
      />

      <ContractWizard
        open={showContractWizard}
        onOpenChange={(open) => {
          setShowContractWizard(open)
          if (!open) {
            setContractCustomer(null)
          }
        }}
        prefilledCustomer={contractCustomer}
        onSuccess={() => {
          setShowContractWizard(false)
          setContractCustomer(null)
        }}
      />
    </Layout>
  )
}