import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { FormDialog } from '../ui/form-dialog'
import { apiClient, type ContractWithRelations, type Customer, type Product, type Reseller } from '../../lib/api'
import { getErrorMessage } from '../../lib/api'

const contractSchema = z.object({
  customerId: z.number().min(1, 'Customer is required'),
  productId: z.number().min(1, 'Product is required'),
  resellerId: z.number().optional(),
  contractTerm: z.number().min(1, 'Contract term must be at least 1 year').default(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  billingCycle: z.enum(['annual', 'monthly', 'quarterly']).default('annual'),
  billingStatus: z.enum(['PENDING', 'BILLED', 'RECEIVED', 'PAID', 'LATE', 'CANCELED']).default('PENDING'),
  amount: z.string().min(1, 'Amount is required'),
  resellerMargin: z.string().optional(),
  netAmount: z.string().min(1, 'Net amount is required'),
  notes: z.string().optional()
})

type ContractFormData = z.infer<typeof contractSchema>

interface ContractFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract?: ContractWithRelations | null
  onSuccess: () => void
}

export function ContractForm({ open, onOpenChange, contract, onSuccess }: ContractFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: contract ? {
      customerId: contract.customerId,
      productId: contract.productId,
      resellerId: contract.resellerId || undefined,
      contractTerm: contract.contractTerm,
      startDate: contract.startDate,
      endDate: contract.endDate,
      billingCycle: contract.billingCycle as 'annual' | 'monthly' | 'quarterly',
      billingStatus: contract.billingStatus as 'PENDING' | 'BILLED' | 'RECEIVED' | 'PAID' | 'LATE' | 'CANCELED',
      amount: contract.amount,
      resellerMargin: contract.resellerMargin || '',
      netAmount: contract.netAmount,
      notes: contract.notes || ''
    } : {
      customerId: 0,
      productId: 0,
      resellerId: undefined,
      contractTerm: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingCycle: 'annual',
      billingStatus: 'PENDING',
      amount: '',
      resellerMargin: '',
      netAmount: '',
      notes: ''
    }
  })

  const amount = watch('amount')
  const resellerMargin = watch('resellerMargin')

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true)
        const [customersRes, productsRes, resellersRes] = await Promise.all([
          apiClient.getCustomers(),
          apiClient.getProducts(),
          apiClient.getResellers()
        ])

        if (customersRes.success && customersRes.data) {
          setCustomers(customersRes.data)
          console.log('Loaded customers:', customersRes.data.length)
        } else {
          console.error('Failed to load customers:', customersRes.error)
        }
        
        if (productsRes.success && productsRes.data) {
          setProducts(productsRes.data)
          console.log('Loaded products:', productsRes.data.length)
        } else {
          console.error('Failed to load products:', productsRes.error)
        }
        
        if (resellersRes.success && resellersRes.data) {
          setResellers(resellersRes.data)
          console.log('Loaded resellers:', resellersRes.data.length)
        } else {
          console.error('Failed to load resellers:', resellersRes.error)
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load form data. Please try again.')
      } finally {
        setLoadingData(false)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // Reset form when contract changes
  useEffect(() => {
    if (contract) {
      reset({
        customerId: contract.customerId,
        productId: contract.productId,
        resellerId: contract.resellerId || undefined,
        contractTerm: contract.contractTerm,
        startDate: contract.startDate,
        endDate: contract.endDate,
        billingCycle: contract.billingCycle as 'annual' | 'monthly' | 'quarterly',
        billingStatus: contract.billingStatus as 'PENDING' | 'BILLED' | 'RECEIVED' | 'PAID' | 'LATE' | 'CANCELED',
        amount: contract.amount,
        resellerMargin: contract.resellerMargin || '',
        netAmount: contract.netAmount,
        notes: contract.notes || ''
      })
    }
  }, [contract, reset])

  // Auto-calculate net amount
  useEffect(() => {
    if (amount && resellerMargin) {
      const grossAmount = parseFloat(amount)
      const marginPercent = parseFloat(resellerMargin)
      if (!isNaN(grossAmount) && !isNaN(marginPercent)) {
        const netAmount = grossAmount * (1 - marginPercent / 100)
        setValue('netAmount', netAmount.toFixed(2))
      }
    } else if (amount && !resellerMargin) {
      setValue('netAmount', amount)
    }
  }, [amount, resellerMargin, setValue])

  const onSubmit = async (data: ContractFormData) => {
    try {
      setLoading(true)
      setError('')

      let response
      if (contract) {
        response = await apiClient.updateContract(contract.id, data)
      } else {
        response = await apiClient.createContract(data)
      }

      if (response.success) {
        onSuccess()
        onOpenChange(false)
        reset()
      } else {
        setError(response.error || 'Operation failed')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    reset()
    setError('')
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={contract ? 'Edit Contract' : 'Create New Contract'}
      description={contract ? 'Update contract details' : 'Create a new contract between customer and product'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="text-center py-4">Loading data...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer</Label>
                <select
                  id="customerId"
                  {...register('customerId', { valueAsNumber: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={0}>Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="text-sm text-red-600">{errors.customerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productId">Product</Label>
                <select
                  id="productId"
                  {...register('productId', { valueAsNumber: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={0}>Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (${product.basePrice})
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <p className="text-sm text-red-600">{errors.productId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resellerId">Reseller (Optional)</Label>
              <select
                id="resellerId"
                {...register('resellerId', { 
                  setValueAs: (value) => value === '' || value === '0' ? undefined : Number(value)
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">No Reseller</option>
                {resellers.map((reseller) => (
                  <option key={reseller.id} value={reseller.id}>
                    {reseller.name} ({reseller.marginPercentage}% margin)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractTerm">Contract Term (Years)</Label>
                <Input
                  id="contractTerm"
                  type="number"
                  min="1"
                  {...register('contractTerm', { valueAsNumber: true })}
                />
                {errors.contractTerm && (
                  <p className="text-sm text-red-600">{errors.contractTerm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingCycle">Billing Cycle</Label>
                <select
                  id="billingCycle"
                  {...register('billingCycle')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="annual">Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Gross Amount</Label>
                <Input
                  id="amount"
                  {...register('amount')}
                  placeholder="1000.00"
                />
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resellerMargin">Reseller Margin %</Label>
                <Input
                  id="resellerMargin"
                  {...register('resellerMargin')}
                  placeholder="15.00"
                />
                {errors.resellerMargin && (
                  <p className="text-sm text-red-600">{errors.resellerMargin.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="netAmount">Net Amount</Label>
              <Input
                id="netAmount"
                {...register('netAmount')}
                placeholder="850.00"
                readOnly
                className="bg-gray-50"
              />
              {errors.netAmount && (
                <p className="text-sm text-red-600">{errors.netAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingStatus">Billing Status</Label>
              <select
                id="billingStatus"
                {...register('billingStatus')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="PENDING">Pending</option>
                <option value="BILLED">Billed</option>
                <option value="RECEIVED">Received</option>
                <option value="PAID">Paid</option>
                <option value="LATE">Late</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional contract notes..."
                rows={3}
              />
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || loadingData}>
            {loading ? 'Saving...' : contract ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}