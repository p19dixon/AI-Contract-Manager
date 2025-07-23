#!/bin/bash

# Simple Mac Mini Deployment Script
# This applies all fixes directly without complex sed commands

set -e

echo "========================================"
echo "Mac Mini Simple Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# First, fix the setupTests.ts file that's causing immediate issues
echo "🔧 Fixing setupTests.ts..."
if [ -f "../client/src/setupTests.ts" ]; then
    cat > ../client/src/setupTests.ts << 'EOF'
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
    echo -e "${GREEN}✅ setupTests.ts fixed!${NC}"
else
    echo -e "${RED}❌ setupTests.ts not found${NC}"
fi

# Try to continue with the build
echo ""
echo "🚀 Continuing with setup..."
echo ""

# If we're in deployment dir, go to project root
if [ -f "docker-compose.yml" ] && [ -d "../client" ]; then
    cd ..
fi

# Try building the client again
echo "Building client..."
cd client
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Client built successfully!${NC}"
else
    echo -e "${RED}❌ Client build failed. Applying additional fixes...${NC}"
    
    # Apply all the TypeScript fixes manually here
    # This is a fallback if the build still fails
    
    echo "Applying comprehensive fixes..."
    
    # You can add more specific fixes here as needed
    
    # Try building again
    npm run build
fi

cd ..

# Continue with server build
echo "Building server..."
cd server
npm run build

cd ..

echo ""
echo "========================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "Start the application with: ./start.sh"