import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { FormDialog } from '../ui/form-dialog'
import { apiClient, type Customer } from '../../lib/api'
import { getErrorMessage } from '../../lib/api'

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  customerType: z.string().default('individual'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onSuccess: () => void
}

export function CustomerForm({ open, onOpenChange, customer, onSuccess }: CustomerFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      company: customer.company || '',
      email: customer.email,
      phone: customer.phone || '',
      customerType: customer.customerType || 'individual',
      street: customer.street || '',
      city: customer.city || '',
      state: customer.state || '',
      zipCode: customer.zipCode || '',
      country: customer.country || ''
    } : {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      phone: '',
      customerType: 'individual',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    }
  })

  // Reset form when customer prop changes
  useEffect(() => {
    if (customer) {
      reset({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        company: customer.company || '',
        email: customer.email,
        phone: customer.phone || '',
        customerType: customer.customerType || 'individual',
        street: customer.street || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        country: customer.country || ''
      })
    } else {
      reset({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        customerType: 'individual',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      })
    }
  }, [customer, reset])

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setLoading(true)
      setError('')

      let response
      if (customer) {
        response = await apiClient.updateCustomer(customer.id, data)
      } else {
        response = await apiClient.createCustomer(data)
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
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      description={customer ? 'Update customer information' : 'Create a new customer record'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            {...register('company')}
            placeholder="Company Name"
          />
          {errors.company && (
            <p className="text-sm text-red-600">{errors.company.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="john.doe@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerType">Customer Type</Label>
          <select
            id="customerType"
            {...register('customerType')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="individual">Individual</option>
            <option value="partner">Partner</option>
            <option value="reseller">Reseller</option>
            <option value="solution provider">Solution Provider</option>
          </select>
          {errors.customerType && (
            <p className="text-sm text-red-600">{errors.customerType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            {...register('street')}
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register('city')}
              placeholder="New York"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              {...register('state')}
              placeholder="NY"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              {...register('zipCode')}
              placeholder="10001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="USA"
            />
          </div>
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
            {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}