import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { FormDialog } from '../ui/form-dialog'
import { apiClient, type Reseller } from '../../lib/api'
import { getErrorMessage } from '../../lib/api'

const resellerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  marginPercentage: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid margin percentage format')
})

type ResellerFormData = z.infer<typeof resellerSchema>

interface ResellerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reseller?: Reseller | null
  onSuccess: () => void
}

export function ResellerForm({ open, onOpenChange, reseller, onSuccess }: ResellerFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ResellerFormData>({
    resolver: zodResolver(resellerSchema),
    defaultValues: reseller ? {
      name: reseller.name,
      email: reseller.email,
      phone: reseller.phone || '',
      marginPercentage: reseller.marginPercentage
    } : {
      name: '',
      email: '',
      phone: '',
      marginPercentage: '15.00'
    }
  })

  const onSubmit = async (data: ResellerFormData) => {
    try {
      setLoading(true)
      setError('')

      let response
      if (reseller) {
        response = await apiClient.updateReseller(reseller.id, data)
      } else {
        response = await apiClient.createReseller(data)
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
      title={reseller ? 'Edit Reseller' : 'Add New Reseller'}
      description={reseller ? 'Update reseller information' : 'Create a new reseller partner'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Company Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Acme Reseller Corp"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="contact@acmereseller.com"
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
          <Label htmlFor="marginPercentage">Margin Percentage</Label>
          <div className="relative">
            <Input
              id="marginPercentage"
              {...register('marginPercentage')}
              placeholder="15.00"
            />
            <span className="absolute right-3 top-2.5 text-sm text-gray-500">%</span>
          </div>
          {errors.marginPercentage && (
            <p className="text-sm text-red-600">{errors.marginPercentage.message}</p>
          )}
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
            {loading ? 'Saving...' : reseller ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}