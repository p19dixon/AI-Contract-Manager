import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'
import { api } from '../../lib/api'

interface ContractFormProps {
  onClose: () => void
  onSubmit: () => void
}

interface Product {
  id: number
  name: string
  description: string
  category: string
  basePrice: string
  isActive: boolean
}

interface ContractFormData {
  productId: number
  contractTerm: number
  billingCycle: string
  notes: string
}

export function ContractForm({ onClose, onSubmit }: ContractFormProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    productId: 0,
    contractTerm: 1,
    billingCycle: 'annual',
    notes: ''
  })
  const [errors, setErrors] = useState<string[]>([])

  const { data: products } = useQuery<{ data: Product[] }>({
    queryKey: ['customer-products'],
    queryFn: () => api.get('/customer-portal/products')
  })

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      return api.post('/customer-portal/contracts', data)
    },
    onSuccess: () => {
      onSubmit()
    },
    onError: (error: any) => {
      setErrors([error.message || 'Failed to create contract'])
    }
  })

  const handleInputChange = (field: keyof ContractFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validate form
    const newErrors: string[] = []
    
    if (!formData.productId) newErrors.push('Please select a product')
    if (formData.contractTerm < 1) newErrors.push('Contract term must be at least 1 year')

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    createContractMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Order New License</CardTitle>
              <CardDescription>
                Create a new contract for a product license
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select 
                value={formData.productId.toString()} 
                onValueChange={(value) => handleInputChange('productId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.data?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - ${product.basePrice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractTerm">Contract Term (years) *</Label>
                <Input
                  id="contractTerm"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.contractTerm}
                  onChange={(e) => handleInputChange('contractTerm', parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingCycle">Billing Cycle</Label>
                <Select 
                  value={formData.billingCycle} 
                  onValueChange={(value) => handleInputChange('billingCycle', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                type="text"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information or requirements"
              />
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createContractMutation.isPending}
              >
                {createContractMutation.isPending ? 'Creating...' : 'Create Contract'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}