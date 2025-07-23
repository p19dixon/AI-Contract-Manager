import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { formatCurrency } from '../../lib/utils'

interface Contract {
  id: number
  customerId: number
  productId: number
  resellerId?: number
  contractTerm: number
  startDate: string
  endDate: string
  billingCycle: string
  billingStatus: string
  amount: string
  resellerMargin?: string
  netAmount: string
  notes?: string
  createdAt: string
  updatedAt: string
  customer?: {
    firstName: string
    lastName: string
    email: string
    customerType: string
  }
  product?: {
    name: string
    category: string
  }
  reseller?: {
    name: string
  }
}

interface ContractCardProps {
  contract: Contract
}

const getBillingStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'BILLED':
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

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'Paid'
    case 'BILLED':
      return 'Billed'
    case 'RECEIVED':
      return 'Payment Received'
    case 'PENDING':
      return 'Pending'
    case 'LATE':
      return 'Overdue'
    case 'CANCELED':
      return 'Canceled'
    default:
      return status
  }
}

export function ContractCard({ contract }: ContractCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {contract.product?.name || 'Unknown Product'}
            </CardTitle>
            <CardDescription className="mt-1">
              {contract.product?.category}
            </CardDescription>
          </div>
          <Badge className={getBillingStatusColor(contract.billingStatus)}>
            {getStatusLabel(contract.billingStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Contract Term:</span>
            <span className="font-medium">{contract.contractTerm} year(s)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Period:</span>
            <span className="font-medium">
              {contract.startDate} - {contract.endDate}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Billing Cycle:</span>
            <span className="font-medium capitalize">{contract.billingCycle}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-bold text-lg">
              {formatCurrency(contract.netAmount)}
            </span>
          </div>
          {contract.reseller && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reseller:</span>
              <span className="font-medium">{contract.reseller.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}