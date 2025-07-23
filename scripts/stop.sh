#!/bin/bash

# Contract Manager System - Stop Script
echo "🛑 Stopping Contract Manager System..."

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "🔍 Found $service_name running on port $port"
        local pids=$(lsof -Pi :$port -sTCP:LISTEN -t)
        for pid in $pids; do
            echo "🚫 Killing process $pid ($service_name)"
            kill -TERM $pid 2>/dev/null
            sleep 2
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                echo "⚡ Force killing process $pid"
                kill -KILL $pid 2>/dev/null
            fi
        done
        echo "✅ $service_name stopped"
    else
        echo "ℹ️  $service_name is not running on port $port"
    fi
}

# Kill processes by name (for npm/node processes)
kill_by_name() {
    local process_name=$1
    local pids=$(pgrep -f "$process_name")
    
    if [ -n "$pids" ]; then
        echo "🔍 Found processes matching '$process_name'"
        for pid in $pids; do
            echo "🚫 Killing process $pid ($process_name)"
            kill -TERM $pid 2>/dev/null
            sleep 1
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                echo "⚡ Force killing process $pid"
                kill -KILL $pid 2>/dev/null
            fi
        done
        echo "✅ Processes matching '$process_name' stopped"
    fi
}

# Stop frontend (port 3000)
kill_port 3000 "Frontend (React/Vite)"

# Stop backend (port 3002)
kill_port 3002 "Backend (Node.js/Express)"

# Kill any remaining npm/node processes related to the project
echo "🧹 Cleaning up remaining processes..."
kill_by_name "npm.*dev"
kill_by_name "tsx.*watch"
kill_by_name "vite"
kill_by_name "concurrently"

# Kill any node processes in the project directory
current_dir=$(pwd)
project_processes=$(pgrep -f "$current_dir")
if [ -n "$project_processes" ]; then
    echo "🔍 Found project-related processes"
    for pid in $project_processes; do
        # Check if it's actually a node process
        if ps -p $pid -o comm= | grep -q "node\|npm\|tsx"; then
            echo "🚫 Killing project process $pid"
            kill -TERM $pid 2>/dev/null
            sleep 1
            if kill -0 $pid 2>/dev/null; then
                kill -KILL $pid 2>/dev/null
            fi
        fi
    done
fi

echo ""
echo "✅ Contract Manager System stopped successfully!"
echo "💡 To start again, run: npm run start or ./start.sh"