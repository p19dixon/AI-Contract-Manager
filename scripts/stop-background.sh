#!/bin/bash

# Contract Manager Background Stop Script
echo "🛑 Stopping Contract Manager System..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Stop servers using saved PIDs
if [ -f logs/server.pid ]; then
    SERVER_PID=$(cat logs/server.pid)
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "🔧 Stopping backend server (PID: $SERVER_PID)..."
        kill $SERVER_PID
    fi
    rm logs/server.pid
fi

if [ -f logs/client.pid ]; then
    CLIENT_PID=$(cat logs/client.pid)
    if ps -p $CLIENT_PID > /dev/null 2>&1; then
        echo "📊 Stopping frontend server (PID: $CLIENT_PID)..."
        kill $CLIENT_PID
    fi
    rm logs/client.pid
fi

# Clean up any remaining processes
echo "🧹 Cleaning up remaining processes..."
pkill -f "npm.*dev" 2>/dev/null
pkill -f "tsx.*watch" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ Servers stopped!"