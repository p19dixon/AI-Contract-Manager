import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomerAccessPage } from '../CustomerAccessPage'
import { api } from '../../../lib/api'

// Mock the API module
jest.mock('../../../lib/api')

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

const mockApi = api as jest.Mocked<typeof api>

// Mock window methods
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

describe('CustomerAccessPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Customer Access Management Workflow', () => {
    it('should handle complete customer access lifecycle', async () => {
      // Initial state: empty access list, customers available
      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@company.com',
                customerType: 'partner'
              }
            ]
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithQueryClient(<CustomerAccessPage />)

      // Should show empty state initially
      await waitFor(() => {
        expect(screen.getByText('No customers have portal access yet')).toBeInTheDocument()
      })

      // Click Grant Access button
      const grantAccessButton = screen.getByText('Grant Access')
      fireEvent.click(grantAccessButton)

      // Should show grant access form
      await waitFor(() => {
        expect(screen.getByText('Grant Customer Portal Access')).toBeInTheDocument()
      })

      // Select customer
      const customerSelect = screen.getByText('Select a customer')
      fireEvent.click(customerSelect)

      const customerOption = screen.getByText('John Doe - john@company.com (partner)')
      fireEvent.click(customerOption)

      // Fill form
      const emailInput = screen.getByLabelText('Login Email')
      const passwordInput = screen.getByLabelText('Initial Password')

      fireEvent.change(emailInput, { target: { value: 'john.portal@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Mock successful API response
      mockApi.post.mockResolvedValue({ success: true })

      // Update API responses for after granting access
      const customerWithAccess = {
        id: 1,
        customerId: 1,
        userId: 1,
        canLogin: true,
        loginEmail: 'john.portal@example.com',
        lastLoginAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        customer: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@company.com',
          customerType: 'partner'
        },
        user: {
          id: 1,
          email: 'john.portal@example.com',
          name: 'John Doe',
          isActive: true
        }
      }

      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [customerWithAccess] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({ data: [] })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Grant Access' })
      fireEvent.click(submitButton)

      // Verify API call
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/admin/customer-access', {
          customerId: 1,
          email: 'john.portal@example.com',
          password: 'password123'
        })
      })

      // After successful submission, the list should update
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Login: john.portal@example.com')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
      })
    })

    it('should handle access status management workflow', async () => {
      const customerWithAccess = {
        id: 1,
        customerId: 1,
        userId: 1,
        canLogin: true,
        loginEmail: 'john.portal@example.com',
        lastLoginAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        customer: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@company.com',
          customerType: 'partner'
        },
        user: {
          id: 1,
          email: 'john.portal@example.com',
          name: 'John Doe',
          isActive: true
        }
      }

      // Initial state with active customer
      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [customerWithAccess] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({ data: [] })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithQueryClient(<CustomerAccessPage />)

      // Should show customer with active status
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
      })

      // Test suspending access
      mockApi.put.mockResolvedValue({ success: true })

      const suspendButton = screen.getByRole('button', { name: 'Suspend' })
      fireEvent.click(suspendButton)

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalledWith('/admin/customer-access/1/status', { canLogin: false })
      })

      // Update mock to reflect suspended state
      const suspendedCustomer = { ...customerWithAccess, canLogin: false }
      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [suspendedCustomer] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({ data: [] })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      // Should now show suspended status and activate button
      await waitFor(() => {
        expect(screen.getByText('Suspended')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument()
      })
    })

    it('should handle password reset workflow', async () => {
      const customerWithAccess = {
        id: 1,
        customerId: 1,
        userId: 1,
        canLogin: true,
        loginEmail: 'john.portal@example.com',
        lastLoginAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        customer: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@company.com',
          customerType: 'partner'
        },
        user: {
          id: 1,
          email: 'john.portal@example.com',
          name: 'John Doe',
          isActive: true
        }
      }

      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [customerWithAccess] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({ data: [] })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithQueryClient(<CustomerAccessPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Test password reset
      mockApi.put.mockResolvedValue({ success: true })

      const resetPasswordButton = screen.getByRole('button', { name: 'Reset Password' })
      fireEvent.click(resetPasswordButton)

      await waitFor(() => {
        expect(window.prompt).toHaveBeenCalledWith('Enter new password (min 8 characters):')
        expect(mockApi.put).toHaveBeenCalledWith('/admin/customer-access/1/password', { password: 'newpassword123' })
        expect(window.alert).toHaveBeenCalledWith('Password reset successfully')
      })
    })

    it('should handle access revocation workflow', async () => {
      const customerWithAccess = {
        id: 1,
        customerId: 1,
        userId: 1,
        canLogin: true,
        loginEmail: 'john.portal@example.com',
        lastLoginAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        customer: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@company.com',
          customerType: 'partner'
        },
        user: {
          id: 1,
          email: 'john.portal@example.com',
          name: 'John Doe',
          isActive: true
        }
      }

      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [customerWithAccess] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({ data: [] })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithQueryClient(<CustomerAccessPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Test revoking access
      mockApi.delete.mockResolvedValue({ success: true })

      const revokeButton = screen.getByRole('button', { name: 'Revoke Access' })
      fireEvent.click(revokeButton)

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to revoke access for John Doe?')
        expect(mockApi.delete).toHaveBeenCalledWith('/admin/customer-access/1')
      })

      // Update mock to reflect revoked access (customer moved back to available list)
      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@company.com',
                customerType: 'partner'
              }
            ]
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      // Should now show empty access list
      await waitFor(() => {
        expect(screen.getByText('No customers have portal access yet')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Workflows', () => {
    it('should handle form validation errors gracefully', async () => {
      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@company.com',
                customerType: 'partner'
              }
            ]
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithQueryClient(<CustomerAccessPage />)

      // Open grant access form
      const grantAccessButton = screen.getByText('Grant Access')
      fireEvent.click(grantAccessButton)

      await waitFor(() => {
        expect(screen.getByText('Grant Customer Portal Access')).toBeInTheDocument()
      })

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: 'Grant Access' })
      fireEvent.click(submitButton)

      // Form should prevent submission (HTML5 validation)
      // No API call should be made
      expect(mockApi.post).not.toHaveBeenCalled()
    })

    it('should handle API errors during access granting', async () => {
      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: [] })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({
            data: [
              {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@company.com',
                customerType: 'partner'
              }
            ]
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithQueryClient(<CustomerAccessPage />)

      // Open grant access form and fill it
      const grantAccessButton = screen.getByText('Grant Access')
      fireEvent.click(grantAccessButton)

      await waitFor(() => {
        const customerSelect = screen.getByText('Select a customer')
        fireEvent.click(customerSelect)
      })

      const customerOption = screen.getByText('John Doe - john@company.com (partner)')
      fireEvent.click(customerOption)

      const emailInput = screen.getByLabelText('Login Email')
      const passwordInput = screen.getByLabelText('Initial Password')

      fireEvent.change(emailInput, { target: { value: 'john.portal@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Mock API error
      mockApi.post.mockRejectedValue(new Error('Email already in use'))

      const submitButton = screen.getByRole('button', { name: 'Grant Access' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalled()
      })

      // Form should remain open on error
      await waitFor(() => {
        expect(screen.getByText('Grant Customer Portal Access')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filter Workflows', () => {
    it('should handle search functionality correctly', async () => {
      const customers = [
        {
          id: 1,
          customerId: 1,
          userId: 1,
          canLogin: true,
          loginEmail: 'john.portal@example.com',
          lastLoginAt: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          customer: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@company.com',
            customerType: 'partner'
          }
        },
        {
          id: 2,
          customerId: 2,
          userId: 2,
          canLogin: true,
          loginEmail: 'jane.portal@example.com',
          lastLoginAt: null,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          customer: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@company.com',
            customerType: 'reseller'
          }
        }
      ]

      mockApi.get.mockImplementation((endpoint) => {
        if (endpoint === '/admin/customer-access') {
          return Promise.resolve({ data: customers })
        }
        if (endpoint === '/admin/customers-without-access') {
          return Promise.resolve({ data: [] })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      renderWithQueryClient(<CustomerAccessPage />)

      // Should show both customers initially
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('2 customers with access')).toBeInTheDocument()
      })

      // Search for John
      const searchInput = screen.getByPlaceholderText('Search customers...')
      fireEvent.change(searchInput, { target: { value: 'John' } })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
        expect(screen.getByText('1 customer with access')).toBeInTheDocument()
      })

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('2 customers with access')).toBeInTheDocument()
      })
    })
  })
})