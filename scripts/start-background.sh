#!/bin/bash

# Contract Manager Background Startup Script
echo "🚀 Starting Contract Manager System in background..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "npm.*dev" 2>/dev/null
pkill -f "tsx.*watch" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the servers in background
echo "🔧 Starting backend server..."
cd "$DIR/server" && npm run dev > "$DIR/logs/server.log" 2>&1 &
SERVER_PID=$!

echo "📊 Starting frontend server..."
cd "$DIR/client" && npm run dev > "$DIR/logs/client.log" 2>&1 &
CLIENT_PID=$!

# Save PIDs to files for easy stopping later
echo $SERVER_PID > "$DIR/logs/server.pid"
echo $CLIENT_PID > "$DIR/logs/client.pid"

echo "✅ Servers started in background!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3002"
echo "📋 Server PID: $SERVER_PID"
echo "📋 Client PID: $CLIENT_PID"
echo ""
echo "📝 Logs:"
echo "   Server: logs/server.log"
echo "   Client: logs/client.log"
echo ""
echo "🛑 To stop servers, run: ./stop-background.sh"
echo "📊 To check status, run: ./status.sh"