import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'
import { api } from '../../lib/api'

interface Contract {
  id: number
  product: {
    name: string
  }
  startDate: string
  endDate: string
  billingStatus: string
  netAmount: string
}

export function PurchaseOrderUpload() {
  const [selectedContract, setSelectedContract] = useState<string>('')
  const [poNumber, setPoNumber] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const queryClient = useQueryClient()

  const { data: contracts } = useQuery<{ data: Contract[] }>({
    queryKey: ['customer-contracts'],
    queryFn: () => api.get('/customer-portal/contracts')
  })

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/customer-portal/purchase-orders', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      return response.json()
    },
    onSuccess: () => {
      setUploadSuccess(true)
      setUploadError('')
      setSelectedContract('')
      setPoNumber('')
      setFile(null)
      // Refresh the dashboard data
      queryClient.invalidateQueries({ queryKey: ['customer-portal-dashboard'] })
    },
    onError: (error: Error) => {
      setUploadError(error.message)
      setUploadSuccess(false)
    },
    onSettled: () => {
      setIsUploading(false)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedContract || !poNumber || !file) {
      setUploadError('Please fill in all fields and select a file')
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess(false)

    const formData = new FormData()
    formData.append('contractId', selectedContract)
    formData.append('poNumber', poNumber)
    formData.append('poFile', file)

    uploadMutation.mutate(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB')
        return
      }
      
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ]
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setUploadError('Only PDF, Word documents, and images are allowed')
        return
      }
      
      setFile(selectedFile)
      setUploadError('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Purchase Order</CardTitle>
        <CardDescription>
          Upload a purchase order document for one of your contracts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract">Contract</Label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.data.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id.toString()}>
                      {contract.product?.name || 'Unknown Product'} - {contract.startDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poNumber">PO Number</Label>
              <Input
                id="poNumber"
                type="text"
                placeholder="Enter PO number"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Purchase Order File</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-gray-500">
              Supported formats: PDF, Word documents, images (max 10MB)
            </p>
          </div>

          {uploadError && (
            <Alert variant="destructive">
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert>
              <AlertDescription>
                Purchase order uploaded successfully! It will be reviewed by our team.
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isUploading} className="w-full">
            {isUploading ? 'Uploading...' : 'Upload Purchase Order'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}