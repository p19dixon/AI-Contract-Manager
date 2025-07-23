#!/bin/bash

# Mac Mini Deployment Script for Contracts SaaS
# This script sets up a clean system with all necessary fixes

set -e

echo "========================================"
echo "Mac Mini Deployment Script"
echo "Contracts SaaS Application"
echo "========================================"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check system requirements
check_requirements() {
    echo "🔍 Checking system requirements..."
    echo ""
    
    local all_good=true
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✓ Node.js: $NODE_VERSION${NC}"
    else
        echo -e "${RED}✗ Node.js not installed${NC}"
        all_good=false
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✓ npm: $NPM_VERSION${NC}"
    else
        echo -e "${RED}✗ npm not installed${NC}"
        all_good=false
    fi
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version)
        echo -e "${GREEN}✓ Docker: $DOCKER_VERSION${NC}"
    else
        echo -e "${RED}✗ Docker not installed${NC}"
        all_good=false
    fi
    
    # Check Docker Compose
    if command_exists docker-compose || (command_exists docker && docker compose version >/dev/null 2>&1); then
        if command_exists docker-compose; then
            COMPOSE_VERSION=$(docker-compose --version)
        else
            COMPOSE_VERSION=$(docker compose version)
        fi
        echo -e "${GREEN}✓ Docker Compose: $COMPOSE_VERSION${NC}"
    else
        echo -e "${RED}✗ Docker Compose not installed${NC}"
        all_good=false
    fi
    
    echo ""
    
    if [ "$all_good" = false ]; then
        echo -e "${YELLOW}⚠️  Some requirements are missing.${NC}"
        echo ""
        echo "Please install missing dependencies:"
        echo "- Node.js: https://nodejs.org/ (v18+ recommended)"
        echo "- Docker Desktop: https://www.docker.com/products/docker-desktop/"
        echo ""
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met!${NC}"
    echo ""
}

# Apply TypeScript fixes
apply_typescript_fixes() {
    echo "🔧 Applying TypeScript fixes..."
    echo ""
    
    # Fix React imports
    echo "Removing unused React imports..."
    find client/src -name "*.tsx" -type f -exec sed -i '' '/^import React from '\''react'\''$/d' {} \;
    
    # Fix React.useEffect to useEffect
    sed -i '' 's/React\.useEffect/useEffect/g' client/src/pages/admin/SystemSettingsPage.tsx
    
    # Fix imports that use React.useState
    sed -i '' "s/import React, { useState }/import { useState }/g" client/src/pages/CustomerManagementPage.tsx
    sed -i '' "s/import React, { useState }/import { useState }/g" client/src/pages/CustomerPortal.tsx
    sed -i '' "s/import React, { useState }/import { useState }/g" client/src/pages/admin/UserManagementPage.tsx
    sed -i '' "s/import React, { useState }/import { useState, useEffect }/g" client/src/pages/admin/SystemSettingsPage.tsx
    
    # Fix unused imports in dialogs
    sed -i '' 's/import { Card, CardContent, CardDescription, CardHeader, CardTitle }/import { Card, CardContent }/g' client/src/components/dialogs/AnalyticsDialog.tsx
    
    # Fix unused colIndex parameters
    sed -i '' 's/columns\.map((column, colIndex) => {/columns.map((column) => {/g' client/src/components/ui/data-table.tsx
    sed -i '' 's/columns\.map((column, colIndex) => {/columns.map((column) => {/g' client/src/components/ui/data-table-final.tsx
    
    # Fix ContractWizard test imports
    sed -i '' 's/import { render, screen, fireEvent, waitFor }/import { render, screen, waitFor }/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    sed -i '' 's/import ContractWizard from/import { ContractWizard } from/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    
    # Fix test props
    sed -i '' 's/isOpen={true}/open={true}/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    sed -i '' 's/onCancel={mockOnCancel}/onSuccess={mockOnSuccess}/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    
    # Fix the mock setup in ContractWizard.test.tsx
    perl -i -pe 's/jest\.mock\([^)]+\)/jest.mock('\''..\/..\/..\/lib\/api'\'', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  },
  getErrorMessage: jest.fn().mockReturnValue('\''Test error'\'')
}))/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    
    # Fix mock API calls
    sed -i '' 's/mockApi\.getCustomers/;(api.apiClient.get as jest.Mock)/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    sed -i '' 's/mockApi\.getProducts/;(api.apiClient.get as jest.Mock)/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    sed -i '' 's/mockApi\.getResellers/;(api.apiClient.get as jest.Mock)/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    sed -i '' 's/mockApi\.createContract/;(api.apiClient.post as jest.Mock)/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    
    # Fix mock implementations
    perl -i -pe 's/mockResolvedValue\(\{ success: true, data: mockCustomers \}\)/.mockImplementation((url: string) => {
      if (url === '\''\/customers'\'') return Promise.resolve(mockCustomers)
      if (url === '\''\/products'\'') return Promise.resolve(mockProducts)
      if (url === '\''\/resellers'\'') return Promise.resolve(mockResellers)
      return Promise.resolve([])
    })/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    
    # Fix the onOpenChange prop addition
    perl -i -pe 's/open=\{true\}\s*\n\s*onSuccess/open={true}\n          onOpenChange={() => {}}\n          onSuccess/g' client/src/components/wizards/__tests__/ContractWizard.test.tsx
    
    # Fix cacheTime to gcTime
    sed -i '' 's/cacheTime: 0/gcTime: 0/g' client/src/pages/admin/CustomerAccessPage.tsx
    
    # Fix formatCurrency call
    sed -i '' 's/formatCurrency(parseFloat(contract.netAmount))/formatCurrency(contract.netAmount)/g' client/src/pages/ContractsPage.tsx
    
    # Remove unused Input import
    sed -i '' '/^import { Input } from '\''..\/components\/ui\/input'\''$/d' client/src/pages/CustomerManagementPage.tsx
    
    # Fix CustomerRegister data typing
    sed -i '' 's/onSuccess: (data)/onSuccess: (data: any)/g' client/src/pages/CustomerRegister.tsx
    
    # Fix setupTests.ts by replacing it with correct version
    cat > client/src/setupTests.ts << 'EOF'
import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

// Make jest available globally
global.jest = jest

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
}
global.localStorage = localStorageMock as any

// Mock sessionStorage
const sessionStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
}
global.sessionStorage = sessionStorageMock as any
EOF
    
    # Fix CustomerAccessPage data access
    sed -i '' "s/customersResponse?.data/customersResponse/g" client/src/pages/admin/CustomerAccessPage.tsx
    
    # Remove onSuccess/onError from useQuery
    sed -i '' '/onSuccess: (data)/,/},/d' client/src/pages/CustomerManagementPage.tsx
    sed -i '' '/onError: (error)/,/}/d' client/src/pages/CustomerManagementPage.tsx
    
    echo -e "${GREEN}✅ TypeScript fixes applied!${NC}"
    echo ""
}

# Fix complex TypeScript issues with proper replacements
fix_complex_issues() {
    echo "🔧 Fixing complex TypeScript issues..."
    
    # Create a temporary fix file for CustomerManagementPage
    cat > /tmp/customer-mgmt-fix.txt << 'EOF'
  // Fetch customers based on active tab
  const { data: customersResponse, isLoading } = useQuery<Customer[]>({
    queryKey: ['staff-customers', activeTab],
    queryFn: () => {
      const params = activeTab === 'all' ? '' : `?status=${activeTab}`
      console.log('Fetching customers with params:', params)
      return api.get<Customer[]>(`/staff/customers${params}`)
    }
  })

  // Handle both direct array response and wrapped response
  const customers = customersResponse || []

  // Fetch staff members
  const { data: staffResponse } = useQuery<any[]>({
    queryKey: ['staff-members'],
    queryFn: () => api.get<any[]>('/staff/staff')
  })
  
  // Handle both direct array response and wrapped response
  const staff = staffResponse || []
EOF
    
    # Apply the fix
    if [ -f client/src/pages/CustomerManagementPage.tsx ]; then
        # This is a complex replacement, using a marker approach
        sed -i '' '/\/\/ Fetch customers based on/,/const staff = staffResponse/c\
  // Fetch customers based on active tab\
  const { data: customersResponse, isLoading } = useQuery<Customer[]>({\
    queryKey: ['\''staff-customers'\'', activeTab],\
    queryFn: () => {\
      const params = activeTab === '\''all'\'' ? '\'''\'' : `?status=${activeTab}`\
      console.log('\''Fetching customers with params:'\'', params)\
      return api.get<Customer[]>(`/staff/customers${params}`)\
    }\
  })\
\
  // Handle both direct array response and wrapped response\
  const customers = customersResponse || []\
\
  // Fetch staff members\
  const { data: staffResponse } = useQuery<any[]>({\
    queryKey: ['\''staff-members'\''],\
    queryFn: () => api.get<any[]>('\''/staff/staff'\'')\
  })\
  \
  // Handle both direct array response and wrapped response\
  const staff = staffResponse || []' client/src/pages/CustomerManagementPage.tsx
    fi
    
    # Fix map functions with proper types
    sed -i '' 's/{customers?.map((customer)/{customers?.map((customer: Customer)/g' client/src/pages/CustomerManagementPage.tsx
    sed -i '' 's/{staff?.map((member)/{staff?.map((member: any)/g' client/src/pages/CustomerManagementPage.tsx
    
    # Fix other files
    sed -i '' 's/const { data: contracts } = useQuery({/const { data: contracts } = useQuery<any[]>({/g' client/src/pages/CustomerPortal.tsx
    sed -i '' 's/{contracts?.data &&/{contracts &&/g' client/src/pages/CustomerPortal.tsx
    sed -i '' 's/{contracts.data.map/{contracts.map/g' client/src/pages/CustomerPortal.tsx
    
    # Add proper typing to useQuery calls
    sed -i '' 's/const { data: accessResponse, isLoading } = useQuery({/const { data: accessResponse, isLoading } = useQuery<CustomerAccess[]>({/g' client/src/pages/admin/CustomerAccessPage.tsx
    sed -i '' 's/const { data: customersResponse, error: customersError, isLoading: customersLoading } = useQuery({/const { data: customersResponse, error: customersError, isLoading: customersLoading } = useQuery<Customer[]>({/g' client/src/pages/admin/CustomerAccessPage.tsx
    sed -i '' 's/queryFn: () => api.get('\''\/admin\/customer-access'\'')/queryFn: () => api.get<CustomerAccess[]>('\''\/admin\/customer-access'\'')/g' client/src/pages/admin/CustomerAccessPage.tsx
    sed -i '' 's/queryFn: () => api.get('\''\/admin\/customers-without-access'\'')/queryFn: () => api.get<Customer[]>('\''\/admin\/customers-without-access'\'')/g' client/src/pages/admin/CustomerAccessPage.tsx
    
    # Fix SystemSettingsPage
    sed -i '' 's/const { data: settingsResponse, isLoading } = useQuery({/const { data: settingsResponse, isLoading } = useQuery<SystemSettings>({/g' client/src/pages/admin/SystemSettingsPage.tsx
    sed -i '' 's/queryFn: () => api.get('\''\/admin\/settings'\'')/queryFn: () => api.get<SystemSettings>('\''\/admin\/settings'\'')/g' client/src/pages/admin/SystemSettingsPage.tsx
    
    # Fix UserManagementPage
    sed -i '' 's/const { data: usersResponse, isLoading } = useQuery({/const { data: usersResponse, isLoading } = useQuery<User[]>({/g' client/src/pages/admin/UserManagementPage.tsx
    sed -i '' 's/queryFn: () => api.get('\''\/admin\/users'\'')/queryFn: () => api.get<User[]>('\''\/admin\/users'\'')/g' client/src/pages/admin/UserManagementPage.tsx
    
    # Add Customer import to CustomerAccessPage
    sed -i '' "s/import { api }/import { api, type Customer }/g" client/src/pages/admin/CustomerAccessPage.tsx
    
    # Fix UserManagementPage
    sed -i '' 's/const users = usersResponse?.data || usersResponse || \[\]/const users = usersResponse || \[\]/g' client/src/pages/admin/UserManagementPage.tsx
    
    # Fix SystemSettingsPage
    sed -i '' 's/if (settingsResponse?.data)/if (settingsResponse)/g' client/src/pages/admin/SystemSettingsPage.tsx
    sed -i '' 's/setSettings(settingsResponse.data)/setSettings(settingsResponse)/g' client/src/pages/admin/SystemSettingsPage.tsx
    
    # Remove unused Staff interface
    perl -i -pe 'BEGIN{undef $/;} s/interface Staff \{[^}]*\}\n\n//smg' client/src/pages/CustomerManagementPage.tsx
    
    echo -e "${GREEN}✅ Complex TypeScript fixes applied!${NC}"
    echo ""
}

# Main deployment process
main() {
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ] && [ ! -f "deployment/docker-compose.yml" ]; then
        echo -e "${RED}Error: This script must be run from the project root or deployment directory${NC}"
        exit 1
    fi
    
    # If we're in deployment dir, go to project root
    if [ -f "docker-compose.yml" ] && [ -d "../client" ]; then
        cd ..
    fi
    
    check_requirements
    
    # Apply all fixes
    apply_typescript_fixes
    fix_complex_issues
    
    # Now run the standard setup
    echo "🚀 Running standard setup..."
    echo ""
    
    cd deployment
    ./setup.sh
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}✅ Deployment Complete!${NC}"
    echo "========================================"
    echo ""
    echo "Your Contracts SaaS application is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Edit the .env file: vi ../.env"
    echo "2. Start the application: ../start.sh"
    echo "3. Access at: http://localhost:3000"
    echo ""
    echo "Default admin credentials:"
    echo "Email: admin@caplocations.com"
    echo "Password: admin123"
    echo ""
}

# Run main function
main "$@"