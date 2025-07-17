import { Route, Switch, Redirect } from 'wouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { ContractsPage } from './pages/ContractsPage'
import { CustomersPage } from './pages/CustomersPage'
import { ProductsPage } from './pages/ProductsPage'
import { ResellersPage } from './pages/ResellersPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      
      <Route path="/" nest>
        <ProtectedRoute fallback={<Redirect to="/auth" />}>
          <Switch>
            <Route path="/contracts">
              <ContractsPage />
            </Route>
            <Route path="/customers">
              <CustomersPage />
            </Route>
            <Route path="/products">
              <ProductsPage />
            </Route>
            <Route path="/resellers">
              <ResellersPage />
            </Route>
            <Route path="/">
              <DashboardPage />
            </Route>
          </Switch>
        </ProtectedRoute>
      </Route>

      {/* Catch all route */}
      <Route>
        {isAuthenticated ? <Redirect to="/" /> : <Redirect to="/auth" />}
      </Route>
    </Switch>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App