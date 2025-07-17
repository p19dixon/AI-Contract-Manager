import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { FormDialog } from '../ui/form-dialog'
import { apiClient, type Product } from '../../lib/api'
import { getErrorMessage } from '../../lib/api'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  isBundle: z.boolean().default(false),
  bundleProducts: z.string().optional(),
  originalPrice: z.string().optional(),
  discountPercentage: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid discount format').optional(),
  isActive: z.boolean().default(true)
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSuccess: () => void
}

export function ProductForm({ open, onOpenChange, product, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [bundleTotal, setBundleTotal] = useState<number>(0)
  const [discountedPrice, setDiscountedPrice] = useState<number>(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description || '',
      category: product.category,
      basePrice: product.basePrice,
      isBundle: product.isBundle ?? false,
      bundleProducts: product.bundleProducts || '',
      originalPrice: product.originalPrice || '',
      discountPercentage: product.discountPercentage || '0',
      isActive: product.isActive ?? true
    } : {
      name: '',
      description: '',
      category: '',
      basePrice: '',
      isBundle: false,
      bundleProducts: '',
      originalPrice: '',
      discountPercentage: '0',
      isActive: true
    }
  })

  const isBundle = watch('isBundle')
  const discountPercentage = watch('discountPercentage')

  // Load available products for bundle creation
  useEffect(() => {
    if (open && isBundle) {
      loadAvailableProducts()
    }
  }, [open, isBundle])

  // Load existing bundle products if editing
  useEffect(() => {
    if (product && product.isBundle && product.bundleProducts) {
      try {
        const productIds = JSON.parse(product.bundleProducts)
        const existingProducts = availableProducts.filter(p => 
          productIds.includes(p.id) && p.id !== product.id
        )
        setSelectedProducts(existingProducts)
      } catch (err) {
        console.error('Error parsing bundle products:', err)
      }
    }
  }, [product, availableProducts])

  // Calculate bundle total when products change
  useEffect(() => {
    const total = selectedProducts.reduce((sum, product) => sum + parseFloat(product.basePrice), 0)
    setBundleTotal(total)
    setValue('originalPrice', total.toFixed(2))
    
    const discount = parseFloat(discountPercentage || '0')
    const discounted = total * (1 - discount / 100)
    setDiscountedPrice(discounted)
    setValue('basePrice', discounted.toFixed(2))
  }, [selectedProducts, discountPercentage, setValue])

  const loadAvailableProducts = async () => {
    try {
      const response = await apiClient.getProducts()
      if (response.success && response.data) {
        // Filter out bundle products and current product being edited
        const nonBundleProducts = response.data.filter(p => 
          !p.isBundle && p.isActive && p.id !== product?.id
        )
        setAvailableProducts(nonBundleProducts)
      }
    } catch (err) {
      console.error('Error loading products:', err)
    }
  }

  const handleProductToggle = (productToToggle: Product) => {
    const isSelected = selectedProducts.some(p => p.id === productToToggle.id)
    
    if (isSelected) {
      setSelectedProducts(prev => prev.filter(p => p.id !== productToToggle.id))
    } else {
      setSelectedProducts(prev => [...prev, productToToggle])
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true)
      setError('')

      // For bundles, set the bundleProducts as JSON array of IDs
      if (isBundle) {
        data.bundleProducts = JSON.stringify(selectedProducts.map(p => p.id))
        if (!data.discountPercentage) {
          data.discountPercentage = '0'
        }
      }

      let response
      if (product) {
        response = await apiClient.updateProduct(product.id, data)
      } else {
        response = await apiClient.createProduct(data)
      }

      if (response.success) {
        onSuccess()
        onOpenChange(false)
        reset()
        setSelectedProducts([])
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
    setSelectedProducts([])
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={product ? 'Edit Product' : 'Add New Product'}
      description={product ? 'Update product information' : 'Create a new product in the catalog'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Premium Data License"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Comprehensive data licensing solution..."
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...register('category')}
              placeholder="Data Licensing"
            />
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {!isBundle && (
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price</Label>
              <Input
                id="basePrice"
                {...register('basePrice')}
                placeholder="99.99"
              />
              {errors.basePrice && (
                <p className="text-sm text-red-600">{errors.basePrice.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isBundle"
            {...register('isBundle')}
            className="h-4 w-4"
          />
          <Label htmlFor="isBundle">Product Bundle</Label>
        </div>

        {isBundle && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium mb-3 block">Select Products for Bundle</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableProducts.map(product => (
                  <div key={product.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      id={`product-${product.id}`}
                      checked={selectedProducts.some(p => p.id === product.id)}
                      onChange={() => handleProductToggle(product)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span>{product.name}</span>
                        <span className="text-sm text-gray-500">${product.basePrice}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium mb-2">Bundle Pricing</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Selected Products:</span>
                    <span>{selectedProducts.length} products</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Original Price:</span>
                    <span>${bundleTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="space-y-1">
                      <Label htmlFor="discountPercentage">Discount %</Label>
                      <Input
                        id="discountPercentage"
                        {...register('discountPercentage')}
                        placeholder="10"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      {errors.discountPercentage && (
                        <p className="text-xs text-red-600">{errors.discountPercentage.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Bundle Price</Label>
                      <div className="p-2 bg-gray-100 rounded text-lg font-medium">
                        ${discountedPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="h-4 w-4"
          />
          <Label htmlFor="isActive">Active Product</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : product ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}