#!/bin/bash

# Contract Manager System - Status Script
echo "📊 Contract Manager System Status"
echo "=================================="

# Function to check port status
check_port_status() {
    local port=$1
    local service_name=$2
    local url=$3
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ $service_name: RUNNING on port $port"
        echo "   🔗 URL: $url"
        
        # Get process info
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t | head -1)
        local process_info=$(ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null)
        if [ -n "$process_info" ]; then
            echo "   📋 Process: $process_info"
        fi
    else
        echo "❌ $service_name: NOT RUNNING on port $port"
    fi
    echo ""
}

# Check system status
check_port_status 3000 "Frontend (React/Vite)" "http://localhost:3000"
check_port_status 3002 "Backend (Node.js/Express)" "http://localhost:3002"

# Check for any related processes
echo "🔍 Related Processes:"
echo "===================="

# Look for npm processes
npm_processes=$(pgrep -f "npm.*dev" 2>/dev/null)
if [ -n "$npm_processes" ]; then
    echo "📦 NPM Development Processes:"
    for pid in $npm_processes; do
        ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null
    done
    echo ""
fi

# Look for tsx processes
tsx_processes=$(pgrep -f "tsx.*watch" 2>/dev/null)
if [ -n "$tsx_processes" ]; then
    echo "⚡ TSX Watch Processes:"
    for pid in $tsx_processes; do
        ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null
    done
    echo ""
fi

# Look for vite processes
vite_processes=$(pgrep -f "vite" 2>/dev/null)
if [ -n "$vite_processes" ]; then
    echo "⚡ Vite Processes:"
    for pid in $vite_processes; do
        ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null
    done
    echo ""
fi

# Check database connection (if possible)
echo "🗄️  Database Status:"
echo "==================="
if command -v psql >/dev/null 2>&1 && [ -n "$DATABASE_URL" ]; then
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database: CONNECTED"
    else
        echo "❌ Database: CONNECTION FAILED"
    fi
else
    echo "ℹ️  Database: Unable to check (psql not available or DATABASE_URL not set)"
fi
echo ""

# System resources
echo "💻 System Resources:"
echo "==================="
echo "🖥️  Memory Usage:"
free -h 2>/dev/null || echo "   Memory info not available"
echo ""
echo "💾 Disk Usage (current directory):"
du -sh . 2>/dev/null || echo "   Disk usage info not available"
echo ""

# Quick links
echo "🔗 Quick Links:"
echo "==============="
echo "Frontend:        http://localhost:3000"
echo "Backend API:     http://localhost:3002"
echo "Health Check:    http://localhost:3002/health"
echo "Customer Portal: http://localhost:3000/customer-portal"
echo "Admin Portal:    http://localhost:3000/"
echo ""

echo "💡 Commands:"
echo "============"
echo "Start:   ./start.sh   or  npm run start"
echo "Stop:    ./stop.sh    or  npm run stop"
echo "Restart: ./restart.sh or  npm run restart"
echo "Status:  ./status.sh  or  npm run status"