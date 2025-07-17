import { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { DataTable, Column, TableActions } from '../components/ui/data-table'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ProductForm } from '../components/forms/ProductForm'
import { apiClient, type Product } from '../lib/api'
import { getErrorMessage } from '../lib/api'

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.getProducts()
      
      if (response.success && response.data) {
        setProducts(response.data)
      } else {
        setError(response.error || 'Failed to load products')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return
    }

    try {
      const response = await apiClient.deleteProduct(product.id)
      
      if (response.success) {
        await loadProducts() // Reload the list
      } else {
        alert(response.error || 'Failed to delete product')
      }
    } catch (err) {
      alert(getErrorMessage(err))
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

  const columns: Column<Product>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '16'
    },
    {
      key: 'name',
      header: 'Product Name'
    },
    {
      key: 'category',
      header: 'Category',
      render: (category) => (
        <Badge variant="secondary">
          {category}
        </Badge>
      )
    },
    {
      key: 'basePrice',
      header: 'Base Price',
      render: (price) => formatCurrency(price)
    },
    {
      key: 'isBundle',
      header: 'Type',
      render: (isBundle) => (
        <Badge variant={isBundle ? 'warning' : 'default'}>
          {isBundle ? 'Bundle' : 'Individual'}
        </Badge>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (isActive) => (
        <Badge variant={isActive ? 'success' : 'destructive'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (description) => {
        if (!description) return 'N/A'
        return description.length > 50 
          ? `${description.substring(0, 50)}...`
          : description
      }
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (date) => formatDate(date)
    }
  ]

  if (error) {
    return (
      <Layout title="Products" description="Manage your product catalog">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadProducts}>
            Try Again
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Products"
      description="Manage your product catalog with pricing and categories"
    >
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search products..."
        onAdd={() => {
          setEditingProduct(null)
          setShowForm(true)
        }}
        addButtonText="New Product"
        emptyMessage="No products found. Add your first product to get started."
        actions={(product) => (
          <TableActions>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setEditingProduct(product)
                setShowForm(true)
              }}
            >
              Edit
            </Button>
            {product.isBundle && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => alert('View bundle contents coming soon!')}
              >
                Bundle
              </Button>
            )}
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleDelete(product)}
            >
              Delete
            </Button>
          </TableActions>
        )}
      />

      <ProductForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) {
            setEditingProduct(null)
          }
        }}
        product={editingProduct}
        onSuccess={loadProducts}
      />
    </Layout>
  )
}