#!/bin/bash

# Contract Manager System - Start Script
echo "🚀 Starting Contract Manager System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use. Checking what's running..."
        lsof -Pi :$port -sTCP:LISTEN
        return 1
    fi
    return 0
}

# Check if ports are available
echo "🔍 Checking if ports are available..."
if ! check_port 3000; then
    echo "❌ Frontend port 3000 is busy. Please stop any running processes or use 'npm run stop' first."
    exit 1
fi

if ! check_port 3002; then
    echo "❌ Backend port 3002 is busy. Please stop any running processes or use 'npm run stop' first."
    exit 1
fi

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if server node_modules exist
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

# Check if client node_modules exist
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Create uploads directory if it doesn't exist
mkdir -p server/uploads/purchase-orders

# Start the development servers
echo "🏃 Starting development servers..."
echo "📊 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend will be available at: http://localhost:3002"
echo "📋 API documentation: http://localhost:3002/api"
echo ""
echo "💡 To stop the servers, press Ctrl+C or run: npm run stop"
echo ""

# Start both servers concurrently
npm run dev