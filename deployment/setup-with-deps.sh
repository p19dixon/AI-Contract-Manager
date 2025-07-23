#!/bin/bash

# Enhanced setup script that checks for and helps install dependencies
# This script can detect missing dependencies and guide installation

set -e

echo "========================================"
echo "Contracts SaaS Enhanced Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get version
get_version() {
    local cmd=$1
    local version_flag=$2
    if command_exists "$cmd"; then
        $cmd $version_flag 2>/dev/null | head -n 1
    else
        echo "Not installed"
    fi
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "mac"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)

echo "🔍 Checking system requirements..."
echo ""

# Check Node.js
echo -n "Node.js: "
NODE_VERSION=$(get_version "node" "--version")
if [[ "$NODE_VERSION" == "Not installed" ]]; then
    echo -e "${RED}✗ Not installed${NC}"
    NODE_OK=false
else
    # Extract major version number
    MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✓ $NODE_VERSION${NC}"
        NODE_OK=true
    else
        echo -e "${YELLOW}⚠ $NODE_VERSION (requires v18+)${NC}"
        NODE_OK=false
    fi
fi

# Check npm
echo -n "npm: "
NPM_VERSION=$(get_version "npm" "--version")
if [[ "$NPM_VERSION" == "Not installed" ]]; then
    echo -e "${RED}✗ Not installed${NC}"
else
    echo -e "${GREEN}✓ $NPM_VERSION${NC}"
fi

# Check Docker
echo -n "Docker: "
DOCKER_VERSION=$(get_version "docker" "--version")
if [[ "$DOCKER_VERSION" == "Not installed" ]]; then
    echo -e "${RED}✗ Not installed${NC}"
    DOCKER_OK=false
else
    echo -e "${GREEN}✓ $DOCKER_VERSION${NC}"
    DOCKER_OK=true
fi

# Check Docker Compose
echo -n "Docker Compose: "
if command_exists "docker-compose"; then
    COMPOSE_VERSION=$(get_version "docker-compose" "--version")
    echo -e "${GREEN}✓ $COMPOSE_VERSION${NC}"
    COMPOSE_OK=true
elif command_exists "docker" && docker compose version >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version)
    echo -e "${GREEN}✓ $COMPOSE_VERSION${NC}"
    COMPOSE_OK=true
else
    echo -e "${RED}✗ Not installed${NC}"
    COMPOSE_OK=false
fi

echo ""

# If all dependencies are met, proceed with regular setup
if [[ "$NODE_OK" == true && "$DOCKER_OK" == true && "$COMPOSE_OK" == true ]]; then
    echo -e "${GREEN}✅ All requirements met!${NC}"
    echo ""
    echo "Proceeding with setup..."
    echo ""
    
    # Run the regular setup
    if [ -f "./setup.sh" ]; then
        exec ./setup.sh
    else
        echo -e "${RED}Error: setup.sh not found${NC}"
        exit 1
    fi
fi

# Otherwise, offer to help install missing dependencies
echo -e "${YELLOW}⚠️  Some requirements are missing${NC}"
echo ""

# Check if installers directory exists
if [ -d "installers" ] && [ "$(ls -A installers 2>/dev/null)" ]; then
    echo "📦 Installer files found in ./installers/"
    INSTALLERS_AVAILABLE=true
else
    echo "📦 No installer files found locally"
    INSTALLERS_AVAILABLE=false
fi

echo ""
echo "Options:"
echo ""

if [[ "$INSTALLERS_AVAILABLE" == true ]]; then
    echo "1) View installation instructions for your platform"
    echo "2) Download fresh installers from the internet"
    echo "3) Exit and install manually"
else
    echo "1) Download installers from the internet"
    echo "2) Exit and install manually"
fi

echo ""
read -p "Choose an option: " choice

if [[ "$INSTALLERS_AVAILABLE" == true ]]; then
    case $choice in
        1)
            # Show platform-specific instructions
            case $OS in
                mac)
                    if [ -f "installers/mac/README.md" ]; then
                        echo ""
                        cat installers/mac/README.md
                    else
                        echo "Installation files are in installers/mac/"
                    fi
                    ;;
                windows)
                    if [ -f "installers/windows/README.md" ]; then
                        echo ""
                        cat installers/windows/README.md
                    else
                        echo "Installation files are in installers/windows/"
                    fi
                    ;;
                linux)
                    if [ -f "installers/linux/README.md" ]; then
                        echo ""
                        cat installers/linux/README.md
                    else
                        echo "Installation scripts are in installers/linux/"
                    fi
                    ;;
                *)
                    echo "Unknown OS. Please install manually."
                    ;;
            esac
            echo ""
            echo "After installing the missing dependencies, run this script again."
            ;;
        2)
            # Download installers
            if [ -f "./download-installers.sh" ]; then
                echo ""
                echo "Downloading installers..."
                ./download-installers.sh
                echo ""
                echo "Installers downloaded! Run this script again and choose option 1."
            else
                echo "download-installers.sh not found"
            fi
            ;;
        3)
            echo ""
            echo "Please install the missing dependencies manually:"
            echo ""
            if [[ "$NODE_OK" != true ]]; then
                echo "📥 Node.js 18+: https://nodejs.org/"
            fi
            if [[ "$DOCKER_OK" != true ]]; then
                echo "📥 Docker: https://www.docker.com/get-started"
            fi
            echo ""
            echo "After installation, run this script again."
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
else
    case $choice in
        1)
            # Download installers
            if [ -f "./download-installers.sh" ]; then
                echo ""
                echo "Downloading installers..."
                ./download-installers.sh
                echo ""
                echo "Installers downloaded! Run this script again."
            else
                echo "download-installers.sh not found"
            fi
            ;;
        2)
            echo ""
            echo "Please install the missing dependencies manually:"
            echo ""
            if [[ "$NODE_OK" != true ]]; then
                echo "📥 Node.js 18+: https://nodejs.org/"
            fi
            if [[ "$DOCKER_OK" != true ]]; then
                echo "📥 Docker: https://www.docker.com/get-started"
            fi
            echo ""
            echo "After installation, run this script again."
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
fi

echo ""
echo "Setup paused. Please install missing dependencies and run again."