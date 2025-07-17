import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { apiClient, type Reseller, type ContractWithRelations } from '../../lib/api'
import { getErrorMessage } from '../../lib/api'

interface ResellerContractsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reseller: Reseller | null
}

export function ResellerContractsDialog({ open, onOpenChange, reseller }: ResellerContractsDialogProps) {
  const [contracts, setContracts] = useState<ContractWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (open && reseller) {
      loadResellerContracts()
    }
  }, [open, reseller])

  const loadResellerContracts = async () => {
    if (!reseller) return
    
    try {
      setLoading(true)
      setError('')
      
      const response = await apiClient.getContracts()
      
      if (response.success && response.data) {
        // Filter contracts for this specific reseller
        const resellerContracts = response.data.filter(
          contract => contract.resellerId === reseller.id
        )
        setContracts(resellerContracts)
      } else {
        setError(response.error || 'Failed to load contracts')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'late':
        return 'bg-red-100 text-red-800'
      case 'canceled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (!reseller) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Contracts for {reseller.name}
          </DialogTitle>
          <DialogDescription>
            View all contracts where this reseller is involved
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading contracts...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!loading && !error && contracts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No contracts found for this reseller.</p>
            </div>
          )}

          {!loading && !error && contracts.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Found {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
              </div>
              
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">Contract #{contract.id}</h4>
                      <Badge className={getStatusColor(contract.billingStatus)}>
                        {contract.billingStatus}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(contract.netAmount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {contract.billingCycle}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <div className="font-medium">
                        {contract.customer ? `${contract.customer.firstName} ${contract.customer.lastName}` : `Customer #${contract.customerId}`}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Product:</span>
                      <div className="font-medium">
                        {contract.product?.name || `Product #${contract.productId}`}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Contract Term:</span>
                      <div className="font-medium">{contract.contractTerm} year{contract.contractTerm !== 1 ? 's' : ''}</div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Reseller Margin:</span>
                      <div className="font-medium">{contract.resellerMargin}%</div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <div className="font-medium">{formatDate(contract.startDate)}</div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">End Date:</span>
                      <div className="font-medium">{formatDate(contract.endDate)}</div>
                    </div>

                    {contract.notes && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Notes:</span>
                        <div className="font-medium">{contract.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}