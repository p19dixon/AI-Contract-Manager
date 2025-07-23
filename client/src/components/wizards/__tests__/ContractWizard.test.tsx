import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContractWizard } from '../ContractWizard'
import * as api from '../../../lib/api'

// Mock the API module
jest.mock('../../../lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  },
  getErrorMessage: jest.fn().mockReturnValue('Test error')
}))

// Mock data
const mockCustomers = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', company: 'Test Corp' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', company: 'Smith Inc' }
]

const mockProducts = [
  { id: 1, name: 'Product A', category: 'full file', basePrice: '1000.00' },
  { id: 2, name: 'Product B', category: 'lite', basePrice: '500.00' }
]

const mockResellers = [
  { id: 1, name: 'Reseller A', margin: '10.00' },
  { id: 2, name: 'Reseller B', margin: '15.00' }
]

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('ContractWizard Integration Tests', () => {
  const mockOnSuccess = jest.fn()
  const mockOnCancel = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup API mocks
    ;(api.apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/customers') return Promise.resolve(mockCustomers)
      if (url === '/products') return Promise.resolve(mockProducts)
      if (url === '/resellers') return Promise.resolve(mockResellers)
      return Promise.resolve([])
    })
    ;(api.apiClient.post as jest.Mock).mockResolvedValue({ 
      id: 1, customerId: 1, productId: 1, amount: '1000.00'
    })
  })

  it('should render the contract wizard with initial step', async () => {
    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Check if the wizard is rendered
    expect(screen.getByText(/contract wizard/i)).toBeInTheDocument()
    expect(screen.getByText(/step 1/i)).toBeInTheDocument()
    
    // Wait for data to load
    await waitFor(() => {
      expect(api.apiClient.get).toHaveBeenCalledWith('/customers')
      expect(api.apiClient.get).toHaveBeenCalledWith('/products')
      expect(api.apiClient.get).toHaveBeenCalledWith('/resellers')
    })
  })

  it('should complete the full contract creation flow', async () => {
    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Step 1: Select customer
    await user.click(screen.getByText('John Doe'))
    await user.click(screen.getByText(/next/i))

    // Step 2: Select product
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Product A'))
    await user.click(screen.getByText(/next/i))

    // Step 3: Contract details
    await waitFor(() => {
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    })
    
    // Fill in contract details
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)
    const amountInput = screen.getByLabelText(/amount/i)

    await user.clear(startDateInput)
    await user.type(startDateInput, '2024-01-01')
    
    await user.clear(endDateInput)
    await user.type(endDateInput, '2024-12-31')
    
    await user.clear(amountInput)
    await user.type(amountInput, '1000.00')

    // Step 4: Review and submit
    await user.click(screen.getByText(/next/i))
    
    await waitFor(() => {
      expect(screen.getByText(/review/i)).toBeInTheDocument()
    })

    // Verify contract details in review step
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Product A')).toBeInTheDocument()
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()

    // Submit the contract
    await user.click(screen.getByText(/create contract/i))

    // Verify API call and success callback
    await waitFor(() => {
      expect(api.apiClient.post).toHaveBeenCalledWith('/contracts', {
        customerId: 1,
        productId: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        amount: '1000.00',
        netAmount: '1000.00',
        contractTerm: 1,
        billingCycle: 'annual'
      })
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should handle contract creation with reseller', async () => {
    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Step 1: Select customer
    await user.click(screen.getByText('John Doe'))
    await user.click(screen.getByText(/next/i))

    // Step 2: Select product
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Product A'))
    await user.click(screen.getByText(/next/i))

    // Step 3: Contract details with reseller
    await waitFor(() => {
      expect(screen.getByLabelText(/reseller/i)).toBeInTheDocument()
    })
    
    // Select reseller
    const resellerSelect = screen.getByLabelText(/reseller/i)
    await user.click(resellerSelect)
    await user.click(screen.getByText('Reseller A'))

    // Fill in other details
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)
    const amountInput = screen.getByLabelText(/amount/i)

    await user.clear(startDateInput)
    await user.type(startDateInput, '2024-01-01')
    
    await user.clear(endDateInput)
    await user.type(endDateInput, '2024-12-31')
    
    await user.clear(amountInput)
    await user.type(amountInput, '1000.00')

    // Net amount should be calculated automatically
    await waitFor(() => {
      const netAmountInput = screen.getByLabelText(/net amount/i)
      expect(netAmountInput).toHaveValue('900.00') // 1000 - 100 (10% margin)
    })

    // Continue to review
    await user.click(screen.getByText(/next/i))
    
    await waitFor(() => {
      expect(screen.getByText(/review/i)).toBeInTheDocument()
    })

    // Submit the contract
    await user.click(screen.getByText(/create contract/i))

    // Verify API call includes reseller data
    await waitFor(() => {
      expect(api.apiClient.post).toHaveBeenCalledWith('/contracts', {
        customerId: 1,
        productId: 1,
        resellerId: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        amount: '1000.00',
        resellerMargin: '100.00',
        netAmount: '900.00',
        contractTerm: 1,
        billingCycle: 'annual'
      })
    })
  })

  it('should handle navigation between steps', async () => {
    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Step 1: Select customer
    await user.click(screen.getByText('John Doe'))
    await user.click(screen.getByText(/next/i))

    // Step 2: Select product
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Product A'))
    await user.click(screen.getByText(/next/i))

    // Step 3: Go back to step 2
    await user.click(screen.getByText(/back/i))
    
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument()
    })

    // Change product selection
    await user.click(screen.getByText('Product B'))
    await user.click(screen.getByText(/next/i))

    // Step 3: Contract details should reflect new product
    await waitFor(() => {
      const amountInput = screen.getByLabelText(/amount/i)
      expect(amountInput).toHaveValue('500.00') // Product B base price
    })
  })

  it('should handle form validation errors', async () => {
    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Step 1: Try to proceed without selecting customer
    await user.click(screen.getByText(/next/i))
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please select a customer/i)).toBeInTheDocument()
    })

    // Select customer and proceed
    await user.click(screen.getByText('John Doe'))
    await user.click(screen.getByText(/next/i))

    // Step 2: Try to proceed without selecting product
    await user.click(screen.getByText(/next/i))
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please select a product/i)).toBeInTheDocument()
    })

    // Select product and proceed
    await user.click(screen.getByText('Product A'))
    await user.click(screen.getByText(/next/i))

    // Step 3: Try to proceed with invalid dates
    await waitFor(() => {
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    })
    
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)

    await user.clear(startDateInput)
    await user.type(startDateInput, '2024-12-31')
    
    await user.clear(endDateInput)
    await user.type(endDateInput, '2024-01-01')

    await user.click(screen.getByText(/next/i))
    
    // Should show validation error for invalid date range
    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    ;(api.apiClient.post as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Complete the form quickly
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    await user.click(screen.getByText('John Doe'))
    await user.click(screen.getByText(/next/i))

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Product A'))
    await user.click(screen.getByText(/next/i))

    await waitFor(() => {
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    })
    
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)
    const amountInput = screen.getByLabelText(/amount/i)

    await user.clear(startDateInput)
    await user.type(startDateInput, '2024-01-01')
    
    await user.clear(endDateInput)
    await user.type(endDateInput, '2024-12-31')
    
    await user.clear(amountInput)
    await user.type(amountInput, '1000.00')

    await user.click(screen.getByText(/next/i))
    
    await waitFor(() => {
      expect(screen.getByText(/review/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/create contract/i))

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create contract/i)).toBeInTheDocument()
    })

    // Should not call onSuccess
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should handle wizard cancellation', async () => {
    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Click cancel button
    await user.click(screen.getByText(/cancel/i))

    // Should call onCancel
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should handle different billing cycles', async () => {
    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Complete steps 1 and 2
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    await user.click(screen.getByText('John Doe'))
    await user.click(screen.getByText(/next/i))

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Product A'))
    await user.click(screen.getByText(/next/i))

    // Step 3: Change billing cycle
    await waitFor(() => {
      expect(screen.getByLabelText(/billing cycle/i)).toBeInTheDocument()
    })
    
    const billingCycleSelect = screen.getByLabelText(/billing cycle/i)
    await user.click(billingCycleSelect)
    await user.click(screen.getByText('Monthly'))

    // Fill in other details
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)
    const amountInput = screen.getByLabelText(/amount/i)

    await user.clear(startDateInput)
    await user.type(startDateInput, '2024-01-01')
    
    await user.clear(endDateInput)
    await user.type(endDateInput, '2024-12-31')
    
    await user.clear(amountInput)
    await user.type(amountInput, '1000.00')

    // Continue to review and submit
    await user.click(screen.getByText(/next/i))
    
    await waitFor(() => {
      expect(screen.getByText(/review/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/create contract/i))

    // Verify API call includes monthly billing cycle
    await waitFor(() => {
      expect(api.apiClient.post).toHaveBeenCalledWith('/contracts',
        expect.objectContaining({
          billingCycle: 'monthly'
        })
      )
    })
  })

  it('should handle loading states', async () => {
    // Mock slow API response
    ;(api.apiClient.get as jest.Mock).mockReturnValue(new Promise(resolve => 
      setTimeout(() => resolve({ success: true, data: mockCustomers }), 100)
    ))

    render(
      <TestWrapper>
        <ContractWizard 
          open={true}
          onOpenChange={() => {}}
          onSuccess={mockOnSuccess} 
        />
      </TestWrapper>
    )

    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Loading should be gone
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })
})