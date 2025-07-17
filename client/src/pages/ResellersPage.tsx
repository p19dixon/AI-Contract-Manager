import { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { DataTable, Column, TableActions } from '../components/ui/data-table'
import { Button } from '../components/ui/button'
import { ResellerForm } from '../components/forms/ResellerForm'
import { ResellerContractsDialog } from '../components/dialogs/ResellerContractsDialog'
import { ContractWizard } from '../components/wizards/ContractWizard'
import { apiClient, type Reseller } from '../lib/api'
import { getErrorMessage } from '../lib/api'

export function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null)
  const [showContractsDialog, setShowContractsDialog] = useState(false)
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null)
  const [showContractWizard, setShowContractWizard] = useState(false)
  const [contractReseller, setContractReseller] = useState<Reseller | null>(null)

  const loadResellers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.getResellers()
      
      if (response.success && response.data) {
        setResellers(response.data)
      } else {
        setError(response.error || 'Failed to load resellers')
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
      <DataTable
        data={resellers}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search resellers..."
        onAdd={() => {
          setEditingReseller(null)
          setShowForm(true)
        }}
        addButtonText="New Reseller"
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