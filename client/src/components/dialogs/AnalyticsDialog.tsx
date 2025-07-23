import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { apiClient, type ContractWithRelations } from '../../lib/api'
import { getErrorMessage } from '../../lib/api'

interface AnalyticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'contracts' | 'revenue' | 'renewals' | 'overdue'
  title: string
  description: string
}

export function AnalyticsDialog({ open, onOpenChange, type, title, description }: AnalyticsDialogProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [contracts, setContracts] = useState<ContractWithRelations[]>([])

  useEffect(() => {
    if (open) {
      loadDetailedData()
    }
  }, [open, type])

  const loadDetailedData = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.getContracts()
      
      if (response.success && response.data) {
        let filteredContracts = response.data
        
        switch (type) {
          case 'contracts':
            // Show all contracts
            break
          case 'revenue':
            // Show only paid/received contracts
            filteredContracts = response.data.filter(contract => 
              contract.billingStatus === 'PAID' || contract.billingStatus === 'RECEIVED'
            )
            break
          case 'renewals':
            // Show pending contracts
            filteredContracts = response.data.filter(contract => 
              contract.billingStatus === 'PENDING'
            )
            break
          case 'overdue':
            // Show late contracts
            filteredContracts = response.data.filter(contract => 
              contract.billingStatus === 'LATE'
            )
            break
        }
        
        setContracts(filteredContracts)
      } else {
        setError(response.error || 'Failed to load data')
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'LATE':
        return 'bg-red-100 text-red-800'
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold cap-text-green">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading detailed analytics...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {contracts.length} {contracts.length === 1 ? 'Contract' : 'Contracts'}
              </h3>
              <div className="text-sm text-muted-foreground">
                Total Value: {formatCurrency(
                  contracts.reduce((sum, contract) => sum + parseFloat(contract.netAmount || '0'), 0).toString()
                )}
              </div>
            </div>

            <div className="grid gap-3">
              {contracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No contracts found for this category.
                </div>
              ) : (
                contracts.map((contract) => (
                  <Card key={contract.id} className="card-modern">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">
                              Contract #{contract.id}
                            </h4>
                            <Badge className={`text-xs ${getBillingStatusColor(contract.billingStatus)}`}>
                              {contract.billingStatus}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Customer:</span> {contract.customer ? 
                                (contract.customer.company || 'Individual Customer') : 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Contact:</span> {contract.customer ? 
                                `${contract.customer.firstName} ${contract.customer.lastName}` : 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Product:</span> {contract.product?.name || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Value:</span> {formatCurrency(contract.netAmount || '0')}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Start:</span> {formatDate(contract.startDate)}
                            </div>
                            <div>
                              <span className="font-medium">End:</span> {formatDate(contract.endDate)}
                            </div>
                            <div>
                              <span className="font-medium">Billing:</span> {contract.billingCycle}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}