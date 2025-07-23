import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatCurrency } from '../../lib/utils'

interface Product {
  id: number
  name: string
  description: string
  category: string
  basePrice: string
  isBundle: boolean
  bundleProducts?: string
  originalPrice?: string
  discountPercentage?: string
  isActive: boolean
}

interface ProductCatalogProps {
  products: Product[]
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'full file':
        return 'bg-blue-100 text-blue-800'
      case 'lite':
        return 'bg-green-100 text-green-800'
      case 'online':
        return 'bg-purple-100 text-purple-800'
      case 'proposed':
        return 'bg-yellow-100 text-yellow-800'
      case 'anchors & tenants':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="mt-1">
                  {product.description}
                </CardDescription>
              </div>
              <Badge className={getCategoryColor(product.category)}>
                {product.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pricing */}
              <div>
                {product.isBundle && product.originalPrice && product.discountPercentage ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(product.basePrice)}
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Bundle
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                      <span className="text-green-600 font-medium">
                        {product.discountPercentage}% off
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(product.basePrice)}
                  </div>
                )}
              </div>

              {/* Bundle Products */}
              {product.isBundle && product.bundleProducts && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Includes:
                  </p>
                  <div className="text-sm text-gray-600">
                    {/* This would need to be parsed from JSON and matched with product names */}
                    <p>Multiple products bundled together</p>
                  </div>
                </div>
              )}

              {/* Order Button */}
              <Button className="w-full" size="sm">
                Order License
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}