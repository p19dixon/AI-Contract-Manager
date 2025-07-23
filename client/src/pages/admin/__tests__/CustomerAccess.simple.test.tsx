import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the API module
const mockApi = {
  get: () => Promise.resolve({ data: [] }),
  post: () => Promise.resolve({ success: true }),
  put: () => Promise.resolve({ success: true }),
  delete: () => Promise.resolve({ success: true }),
}

jest.mock('../../../lib/api', () => ({
  api: mockApi
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
  Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock window methods
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: () => true
})

Object.defineProperty(window, 'prompt', {
  writable: true,
  value: () => 'newpassword123'
})

Object.defineProperty(window, 'alert', {
  writable: true,
  value: () => {}
})

// Import the component after mocks
import { CustomerAccessPage } from '../CustomerAccessPage'

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

describe('CustomerAccessPage - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the page title', async () => {
    renderWithQueryClient(<CustomerAccessPage />)
    
    expect(screen.getByText('Customer Access Management')).toBeInTheDocument()
  })

  it('renders the layout component', () => {
    renderWithQueryClient(<CustomerAccessPage />)
    
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  it('shows the about section', async () => {
    renderWithQueryClient(<CustomerAccessPage />)
    
    expect(screen.getByText('About Customer Access')).toBeInTheDocument()
  })

  it('shows grant access button', async () => {
    renderWithQueryClient(<CustomerAccessPage />)
    
    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Grant Access')).toBeInTheDocument()
  })

  it('shows search input', async () => {
    renderWithQueryClient(<CustomerAccessPage />)
    
    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument()
  })
})