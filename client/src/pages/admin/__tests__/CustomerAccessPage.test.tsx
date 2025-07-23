import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomerAccessPage } from '../CustomerAccessPage'
import { api } from '../../../lib/api'

// Mock the API module
jest.mock('../../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}))

// Mock the Layout component
jest.mock('../../../components/layout/Layout', () => ({
  Layout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="layout">
      <h1>{title}</h1>
      {children}
    </div>
  )
}))

// Mock wouter
jest.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

// Mock window.confirm and window.prompt
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true)
})

Object.defineProperty(window, 'prompt', {
  writable: true,
  value: jest.fn(() => 'newpassword123')
})

Object.defineProperty(window, 'alert', {
  writable: true,
  value: jest.fn()
})

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockApiPost = api.post as jest.MockedFunction<typeof api.post>
const mockApiPut = api.put as jest.MockedFunction<typeof api.put>
const mockApiDelete = api.delete as jest.MockedFunction<typeof api.delete>

// Mock data
const mockCustomerAccess = [
  {
    id: 1,
    customerId: 1,
    userId: 1,
    canLogin: true,
    loginEmail: 'john@example.com',
    lastLoginAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    customer: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      customerType: 'partner'
    },
    user: {
      id: 1,
      email: 'john@example.com',
      name: 'John Doe',
      isActive: true
    }
  },
  {
    id: 2,
    customerId: 2,
    userId: 2,
    canLogin: false,
    loginEmail: 'jane@example.com',
    lastLoginAt: null,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    customer: {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@company.com',
      customerType: 'reseller'
    },
    user: {
      id: 2,
      email: 'jane@example.com',
      name: 'Jane Smith',
      isActive: false
    }
  }
]

const mockCustomersWithoutAccess = [
  {
    id: 3,
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@company.com',
    customerType: 'individual'
  },
  {
    id: 4,
    firstName: 'Alice',
    lastName: 'Brown',
    email: 'alice@company.com',
    customerType: 'solution_provider'
  }
]

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('CustomerAccessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiGet.mockImplementation((endpoint) => {
      if (endpoint === '/admin/customer-access') {
        return Promise.resolve({ data: mockCustomerAccess })
      }
      if (endpoint === '/admin/customers-without-access') {
        return Promise.resolve({ data: mockCustomersWithoutAccess })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  describe('Initial Render', () => {
    it('renders the page title and description', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      expect(screen.getByText('Customer Access Management')).toBeInTheDocument()
      expect(screen.getByText('Manage customer portal access')).toBeInTheDocument()
    })

    it('renders the breadcrumb navigation', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Customer Access')).toBeInTheDocument()
      expect(screen.getByText('Back to Admin')).toBeInTheDocument()
    })

    it('renders the info card with guidelines', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      expect(screen.getByText('About Customer Access')).toBeInTheDocument()
      expect(screen.getByText(/Customer Access controls who can log into the customer portal/)).toBeInTheDocument()
      expect(screen.getByText(/This is separate from the customer records used in contracts/)).toBeInTheDocument()
      expect(screen.getByText(/Revoking access does NOT delete the customer or their contracts/)).toBeInTheDocument()
      expect(screen.getByText(/Each customer can have one portal login account/)).toBeInTheDocument()
    })

    it('shows loading state initially', () => {
      mockApiGet.mockImplementation(() => new Promise(() => {})) // Never resolves
      renderWithQueryClient(<CustomerAccessPage />)
      
      expect(screen.getByTestId('layout')).toBeInTheDocument()
      // Loading spinner should be present
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Customer Access List', () => {
    it('displays customers with portal access', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })

      expect(screen.getByText('Contact: john.doe@company.com')).toBeInTheDocument()
      expect(screen.getByText('Login: john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Contact: jane.smith@company.com')).toBeInTheDocument()
      expect(screen.getByText('Login: jane@example.com')).toBeInTheDocument()
    })

    it('displays customer types correctly', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Partner')).toBeInTheDocument()
        expect(screen.getByText('Reseller')).toBeInTheDocument()
      })
    })

    it('displays access status correctly', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        const activeBadges = screen.getAllByText('Active')
        const suspendedBadges = screen.getAllByText('Suspended')
        expect(activeBadges).toHaveLength(1)
        expect(suspendedBadges).toHaveLength(1)
      })
    })

    it('displays last login date when available', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Last login: 1/15/2024')).toBeInTheDocument()
      })
    })

    it('shows customer count badge', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('2 customers with access')).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('filters customers by search term', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search customers...')
      fireEvent.change(searchInput, { target: { value: 'John' } })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    it('updates customer count after filtering', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('2 customers with access')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search customers...')
      fireEvent.change(searchInput, { target: { value: 'John' } })

      await waitFor(() => {
        expect(screen.getByText('1 customer with access')).toBeInTheDocument()
      })
    })

    it('shows no results message when search yields no matches', async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search customers...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      await waitFor(() => {
        expect(screen.getByText('No customers have portal access yet')).toBeInTheDocument()
      })
    })
  })

  describe('Grant Access Form', () => {
    beforeEach(async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Grant Access')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Grant Access'))
    })

    it('shows grant access form when button is clicked', async () => {
      await waitFor(() => {
        expect(screen.getByText('Grant Customer Portal Access')).toBeInTheDocument()
        expect(screen.getByText('Allow a customer to log into the customer portal')).toBeInTheDocument()
      })
    })

    it('displays available customers in dropdown', async () => {
      await waitFor(() => {
        const select = screen.getByText('Select a customer')
        fireEvent.click(select)
      })

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson - bob@company.com (individual)')).toBeInTheDocument()
        expect(screen.getByText('Alice Brown - alice@company.com (solution_provider)')).toBeInTheDocument()
      })
    })

    it('submits form with valid data', async () => {
      mockApiPost.mockResolvedValue({ success: true })

      await waitFor(() => {
        const select = screen.getByText('Select a customer')
        fireEvent.click(select)
      })

      const customerOption = screen.getByText('Bob Johnson - bob@company.com (individual)')
      fireEvent.click(customerOption)

      const emailInput = screen.getByLabelText('Login Email')
      const passwordInput = screen.getByLabelText('Initial Password')

      fireEvent.change(emailInput, { target: { value: 'bob.portal@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const submitButton = screen.getByRole('button', { name: 'Grant Access' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith('/admin/customer-access', {
          customerId: 3,
          email: 'bob.portal@example.com',
          password: 'password123'
        })
      })
    })

    it('cancels form when cancel button is clicked', async () => {
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Grant Customer Portal Access')).not.toBeInTheDocument()
      })
    })
  })

  describe('Customer Actions', () => {
    beforeEach(async () => {
      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('toggles customer access status', async () => {
      mockApiPut.mockResolvedValue({ success: true })

      const suspendButton = screen.getByRole('button', { name: 'Suspend' })
      fireEvent.click(suspendButton)

      await waitFor(() => {
        expect(mockApiPut).toHaveBeenCalledWith('/admin/customer-access/1/status', { canLogin: false })
      })
    })

    it('activates suspended customer', async () => {
      mockApiPut.mockResolvedValue({ success: true })

      const activateButton = screen.getByRole('button', { name: 'Activate' })
      fireEvent.click(activateButton)

      await waitFor(() => {
        expect(mockApiPut).toHaveBeenCalledWith('/admin/customer-access/2/status', { canLogin: true })
      })
    })

    it('resets customer password', async () => {
      mockApiPut.mockResolvedValue({ success: true })

      const resetPasswordButton = screen.getAllByRole('button', { name: 'Reset Password' })[0]
      fireEvent.click(resetPasswordButton)

      await waitFor(() => {
        expect(window.prompt).toHaveBeenCalledWith('Enter new password (min 8 characters):')
        expect(mockApiPut).toHaveBeenCalledWith('/admin/customer-access/1/password', { password: 'newpassword123' })
        expect(window.alert).toHaveBeenCalledWith('Password reset successfully')
      })
    })

    it('validates password length on reset', async () => {
      ;(window.prompt as jest.Mock).mockReturnValue('short')

      const resetPasswordButton = screen.getAllByRole('button', { name: 'Reset Password' })[0]
      fireEvent.click(resetPasswordButton)

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Password must be at least 8 characters')
        expect(mockApiPut).not.toHaveBeenCalled()
      })
    })

    it('revokes customer access with confirmation', async () => {
      mockApiDelete.mockResolvedValue({ success: true })

      const revokeButton = screen.getAllByRole('button', { name: 'Revoke Access' })[0]
      fireEvent.click(revokeButton)

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to revoke access for John Doe?')
        expect(mockApiDelete).toHaveBeenCalledWith('/admin/customer-access/1')
      })
    })

    it('cancels revoke when confirmation is denied', async () => {
      ;(window.confirm as jest.Mock).mockReturnValue(false)

      const revokeButton = screen.getAllByRole('button', { name: 'Revoke Access' })[0]
      fireEvent.click(revokeButton)

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled()
        expect(mockApiDelete).not.toHaveBeenCalled()
      })
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no customers have access', async () => {
      mockApiGet.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({ data: mockCustomersWithoutAccess })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithQueryClient(<CustomerAccessPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No customers have portal access yet')).toBeInTheDocument()
        expect(screen.getByText('0 customers with access')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockApiGet.mockRejectedValue(new Error('API Error'))

      renderWithQueryClient(<CustomerAccessPage />)
      
      // The component should still render but might show empty state
      await waitFor(() => {
        expect(screen.getByText('Customer Access Management')).toBeInTheDocument()
      })
    })
  })
})