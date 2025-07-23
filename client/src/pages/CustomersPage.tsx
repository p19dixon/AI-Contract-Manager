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
      width: '16',
      hideOnMobile: true
    },
    {
      key: 'company',
      header: 'Company',
      width: '48',
      render: (_, customer) => customer.company || 'N/A'
    },
    {
      key: 'firstName',
      header: 'Contact',
      width: '48',
      render: (_, customer) => `${customer.firstName} ${customer.lastName}`
    },
    {
      key: 'email',
      header: 'Email',
      width: '64',
      hideOnMobile: true
    },
    {
      key: 'phone',
      header: 'Phone',
      width: '32',
      render: (phone) => phone || 'N/A',
      hideOnMobile: true
    },
    {
      key: 'customerType',
      header: 'Type',
      width: '24',
      render: (type) => (
        <Badge variant={getCustomerTypeVariant(type)}>
          {formatCustomerType(type)}
        </Badge>
      )
    },
    {
      key: 'city',
      header: 'Location',
      width: '40',
      render: (_, customer) => {
        const location = [customer.city, customer.state, customer.country]
          .filter(Boolean)
          .join(', ')
        return location || 'N/A'
      },
      hideOnMobile: true
    },
    {
      key: 'createdAt',
      header: 'Created',
      width: '24',
      render: (date) => formatDate(date),
      hideOnMobile: true
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
        cardRenderer={(customer) => (
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">
                  {customer.company || 'Individual'}
                </h3>
                <p className="text-gray-600">
                  {customer.firstName} {customer.lastName}
                </p>
              </div>
              <Badge variant={getCustomerTypeVariant(customer.customerType)}>
                {formatCustomerType(customer.customerType)}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Email:</span>
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                  {customer.email}
                </a>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                    {customer.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Location:</span>
                <span>
                  {[customer.city, customer.state, customer.country]
                    .filter(Boolean)
                    .join(', ') || 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1"
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
                className="flex-1"
                onClick={() => {
                  setSelectedCustomer(customer)
                  setShowContractsDialog(true)
                }}
              >
                Contracts
              </Button>
              <Button 
                size="sm" 
                variant="default"
                className="flex-1"
                onClick={() => {
                  setContractCustomer(customer)
                  setShowContractWizard(true)
                }}
              >
                + Contract
              </Button>
            </div>
          </div>
        )}
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