#!/bin/bash

# Contract Manager Server Check Script
echo "🔍 Checking Contract Manager System Status..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if servers are running
FRONTEND_RUNNING=$(lsof -ti:3000 | wc -l)
BACKEND_RUNNING=$(lsof -ti:3002 | wc -l)

echo "📊 Frontend (port 3000): $([ $FRONTEND_RUNNING -gt 0 ] && echo "✅ RUNNING" || echo "❌ NOT RUNNING")"
echo "🔧 Backend (port 3002): $([ $BACKEND_RUNNING -gt 0 ] && echo "✅ RUNNING" || echo "❌ NOT RUNNING")"

# Check saved PIDs
if [ -f logs/server.pid ]; then
    SERVER_PID=$(cat logs/server.pid)
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "📋 Server PID: $SERVER_PID (active)"
    else
        echo "📋 Server PID: $SERVER_PID (inactive)"
    fi
fi

if [ -f logs/client.pid ]; then
    CLIENT_PID=$(cat logs/client.pid)
    if ps -p $CLIENT_PID > /dev/null 2>&1; then
        echo "📋 Client PID: $CLIENT_PID (active)"
    else
        echo "📋 Client PID: $CLIENT_PID (inactive)"
    fi
fi

echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3002"
echo "   Health: http://localhost:3002/health"

# Show recent logs if available
if [ -f logs/server.log ]; then
    echo ""
    echo "📝 Recent server log:"
    tail -3 logs/server.log
fi