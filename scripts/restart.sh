#!/bin/bash

# Contract Manager System - Restart Script
echo "🔄 Restarting Contract Manager System..."

# Stop the system first
echo "🛑 Stopping current processes..."
./stop.sh

# Wait a moment for cleanup
echo "⏳ Waiting for cleanup..."
sleep 3

# Start the system
echo "🚀 Starting system..."
./start.sh