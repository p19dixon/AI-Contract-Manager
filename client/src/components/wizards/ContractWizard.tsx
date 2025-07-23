import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { CustomerForm } from '../forms/CustomerForm'
import { ResellerForm } from '../forms/ResellerForm'
import { apiClient, type Customer, type Product, type Reseller } from '../../lib/api'
import { getErrorMessage } from '../../lib/api'

interface ContractWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  // Pre-filled context from entry point
  prefilledCustomer?: Customer | null
  prefilledProduct?: Product | null
  prefilledReseller?: Reseller | null
}

type WizardStep = 'customer' | 'product-reseller' | 'contract-details'

interface ContractData {
  customerId?: number
  productId?: number
  resellerId?: number
  contractTerm: number
  startDate: string
  endDate: string
  billingCycle: 'annual' | 'monthly' | 'quarterly'
  billingStatus: string
  amount: string
  resellerMargin: string
  netAmount: string
  notes: string
}

export function ContractWizard({ 
  open, 
  onOpenChange, 
  onSuccess,
  prefilledCustomer,
  prefilledProduct,
  prefilledReseller
}: ContractWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('customer')
  const [contractData, setContractData] = useState<ContractData>({
    contractTerm: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billingCycle: 'annual',
    billingStatus: 'PENDING',
    amount: '',
    resellerMargin: '',
    netAmount: '',
    notes: ''
  })

  // Entity data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [showResellerForm, setShowResellerForm] = useState(false)

  // Load data on open
  useEffect(() => {
    if (open) {
      loadData()
      // Set prefilled data when wizard opens
      if (prefilledCustomer?.id) {
        setSelectedCustomer(prefilledCustomer)
        setCurrentStep('product-reseller')
      } else {
        setSelectedCustomer(null)
        setCurrentStep('customer')
      }
      if (prefilledProduct?.id) {
        setSelectedProduct(prefilledProduct)
      }
      if (prefilledReseller?.id) {
        setSelectedReseller(prefilledReseller)
      }
    }
  }, [open, prefilledCustomer, prefilledProduct, prefilledReseller])

  const loadData = async () => {
    try {
      setError('')
      const [customersRes, productsRes, resellersRes] = await Promise.all([
        apiClient.getCustomers(),
        apiClient.getProducts(),
        apiClient.getResellers()
      ])

      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data)
      } else {
        console.warn('Failed to load customers:', customersRes.error)
        setCustomers([])
      }

      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data)
      } else {
        console.warn('Failed to load products:', productsRes.error)
        setProducts([])
      }

      if (resellersRes.success && resellersRes.data) {
        setResellers(resellersRes.data)
      } else {
        console.warn('Failed to load resellers:', resellersRes.error)
        setResellers([])
      }
    } catch (err) {
      console.error('Error loading wizard data:', err)
      setError(getErrorMessage(err))
      setCustomers([])
      setProducts([])
      setResellers([])
    }
  }

  // Auto-calculate amounts when product, reseller, or margin changes
  useEffect(() => {
    if (selectedProduct?.basePrice && contractData.amount) {
      const baseAmount = parseFloat(contractData.amount) || parseFloat(selectedProduct.basePrice) || 0
      const margin = parseFloat(contractData.resellerMargin) || 0
      const netAmount = baseAmount * (1 - margin / 100)
      
      setContractData(prev => ({
        ...prev,
        amount: baseAmount.toString(),
        netAmount: netAmount.toFixed(2)
      }))
    }
  }, [selectedProduct?.basePrice, contractData.resellerMargin, contractData.amount])

  const handleNext = () => {
    if (currentStep === 'customer' && selectedCustomer?.id) {
      setContractData(prev => ({ ...prev, customerId: selectedCustomer.id }))
      setCurrentStep('product-reseller')
    } else if (currentStep === 'product-reseller' && selectedProduct?.id) {
      setContractData(prev => ({ 
        ...prev, 
        productId: selectedProduct.id,
        resellerId: selectedReseller?.id,
        amount: selectedProduct.basePrice || '0',
        resellerMargin: selectedReseller?.marginPercentage || '0'
      }))
      setCurrentStep('contract-details')
    }
  }

  const handleBack = () => {
    if (currentStep === 'contract-details') {
      setCurrentStep('product-reseller')
    } else if (currentStep === 'product-reseller') {
      setCurrentStep('customer')
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')

      if (!selectedCustomer?.id || !selectedProduct?.id) {
        setError('Please ensure customer and product are selected')
        return
      }

      const contractPayload = {
        ...contractData,
        customerId: selectedCustomer.id,
        productId: selectedProduct.id,
        resellerId: selectedReseller?.id
      }

      const response = await apiClient.createContract(contractPayload)

      if (response.success) {
        onSuccess()
        onOpenChange(false)
        resetWizard()
      } else {
        setError(response.error || 'Failed to create contract')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const resetWizard = () => {
    setCurrentStep('customer')
    setSelectedCustomer(null)
    setSelectedProduct(null)
    setSelectedReseller(null)
    setContractData({
      contractTerm: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingCycle: 'annual',
      billingStatus: 'PENDING',
      amount: '',
      resellerMargin: '',
      netAmount: '',
      notes: ''
    })
    setError('')
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'customer': return 'Select Customer'
      case 'product-reseller': return 'Select Product & Reseller'
      case 'contract-details': return 'Contract Details'
      default: return 'Create Contract'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'customer': return 'Choose an existing customer or create a new one'
      case 'product-reseller': return 'Select the product and optionally choose a reseller'
      case 'contract-details': return 'Set contract terms, dates, and billing details'
      default: return ''
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getStepTitle()}</DialogTitle>
            <DialogDescription>{getStepDescription()}</DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 py-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'customer' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'customer' ? 'border-primary bg-primary text-primary-foreground' : 
                selectedCustomer?.id ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
              }`}>
                {selectedCustomer?.id ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium">Customer</span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-300"></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'product-reseller' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'product-reseller' ? 'border-primary bg-primary text-primary-foreground' : 
                selectedProduct?.id ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
              }`}>
                {selectedProduct?.id ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium">Product</span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-300"></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'contract-details' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'contract-details' ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-300'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Step 1: Customer Selection */}
            {currentStep === 'customer' && (
              <div className="space-y-4">
                {prefilledCustomer ? (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-900">Selected Customer</h4>
                    {prefilledCustomer.company && <p className="text-blue-800 font-medium">{prefilledCustomer.company}</p>}
                    <p className="text-blue-700">{prefilledCustomer.firstName} {prefilledCustomer.lastName}</p>
                    <p className="text-sm text-blue-600">{prefilledCustomer.email}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Select Customer</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCustomerForm(true)}
                      >
                        + New Customer
                      </Button>
                    </div>
                    
                    <select
                      value={selectedCustomer?.id || ''}
                      onChange={(e) => {
                        const customer = customers.find(c => c.id === parseInt(e.target.value))
                        setSelectedCustomer(customer || null)
                      }}
                      className="w-full p-3 border rounded-lg"
                    >
                      <option value="">Choose a customer...</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.company ? `${customer.company} (${customer.firstName} ${customer.lastName})` : `${customer.firstName} ${customer.lastName}`} ({customer.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Product & Reseller Selection */}
            {currentStep === 'product-reseller' && (
              <div className="space-y-6">
                {/* Product Selection */}
                <div className="space-y-3">
                  <Label>Select Product</Label>
                  {prefilledProduct ? (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium text-blue-900">{prefilledProduct.name}</h4>
                      <p className="text-blue-600">${prefilledProduct.basePrice}</p>
                    </div>
                  ) : (
                    <select
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const product = products.find(p => p.id === parseInt(e.target.value))
                        setSelectedProduct(product || null)
                      }}
                      className="w-full p-3 border rounded-lg"
                    >
                      <option value="">Choose a product...</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} (${product.basePrice})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Reseller Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Reseller (Optional)</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowResellerForm(true)}
                    >
                      + New Reseller
                    </Button>
                  </div>
                  
                  {prefilledReseller ? (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium text-blue-900">{prefilledReseller.name}</h4>
                      <p className="text-blue-600">{prefilledReseller.marginPercentage}% margin</p>
                    </div>
                  ) : (
                    <select
                      value={selectedReseller?.id || ''}
                      onChange={(e) => {
                        const reseller = resellers.find(r => r.id === parseInt(e.target.value))
                        setSelectedReseller(reseller || null)
                        setContractData(prev => ({ 
                          ...prev, 
                          resellerMargin: reseller?.marginPercentage || '0' 
                        }))
                      }}
                      className="w-full p-3 border rounded-lg"
                    >
                      <option value="">Direct sale (no reseller)</option>
                      {resellers.map(reseller => (
                        <option key={reseller.id} value={reseller.id}>
                          {reseller.name} ({reseller.marginPercentage}% margin)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Contract Details */}
            {currentStep === 'contract-details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={contractData.startDate}
                      onChange={(e) => setContractData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={contractData.endDate}
                      onChange={(e) => setContractData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contract Term (Years)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={contractData.contractTerm}
                      onChange={(e) => setContractData(prev => ({ ...prev, contractTerm: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label>Billing Cycle</Label>
                    <select
                      value={contractData.billingCycle}
                      onChange={(e) => setContractData(prev => ({ ...prev, billingCycle: e.target.value as any }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="annual">Annual</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Gross Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={contractData.amount}
                      onChange={(e) => setContractData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Net Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={contractData.netAmount}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={contractData.notes}
                    onChange={(e) => setContractData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional contract notes..."
                    rows={3}
                  />
                </div>

                {/* Contract Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Contract Summary</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Customer:</strong> {selectedCustomer ? (selectedCustomer.company || 'Individual Customer') : 'Not selected'}</p>
                    <p><strong>Contact:</strong> {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Not selected'}</p>
                    <p><strong>Product:</strong> {selectedProduct?.name || 'Not selected'}</p>
                    {selectedReseller?.name && <p><strong>Reseller:</strong> {selectedReseller.name} ({selectedReseller.marginPercentage}%)</p>}
                    <p><strong>Amount:</strong> ${contractData.netAmount || '0.00'} ({contractData.billingCycle})</p>
                    <p><strong>Term:</strong> {contractData.contractTerm} year{contractData.contractTerm !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div>
              {currentStep !== 'customer' && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              
              {currentStep === 'contract-details' ? (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Contract'}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={
                    (currentStep === 'customer' && !selectedCustomer?.id) ||
                    (currentStep === 'product-reseller' && !selectedProduct?.id)
                  }
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline Forms */}
      <CustomerForm
        open={showCustomerForm}
        onOpenChange={setShowCustomerForm}
        customer={null}
        onSuccess={() => {
          loadData()
          setShowCustomerForm(false)
        }}
      />

      <ResellerForm
        open={showResellerForm}
        onOpenChange={setShowResellerForm}
        reseller={null}
        onSuccess={() => {
          loadData()
          setShowResellerForm(false)
        }}
      />
    </>
  )
}