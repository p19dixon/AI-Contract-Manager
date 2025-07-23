#!/bin/bash

# Mac Mini Installer for Contracts SaaS
# This is a complete, self-contained installer

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}========================================"
echo "   Contracts SaaS Mac Mini Installer"
echo "========================================${NC}"
echo ""

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check requirements
check_requirements() {
    echo "📋 Checking system requirements..."
    echo ""
    
    local missing=()
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✓ Node.js: $NODE_VERSION${NC}"
    else
        echo -e "${RED}✗ Node.js not installed${NC}"
        missing+=("Node.js")
    fi
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,$//')
        echo -e "${GREEN}✓ Docker: $DOCKER_VERSION${NC}"
    else
        echo -e "${RED}✗ Docker not installed${NC}"
        missing+=("Docker")
    fi
    
    # Check Docker Compose
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version | cut -d' ' -f4)
        echo -e "${GREEN}✓ Docker Compose: $COMPOSE_VERSION${NC}"
    elif command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | sed 's/,$//')
        echo -e "${GREEN}✓ Docker Compose: $COMPOSE_VERSION${NC}"
    else
        echo -e "${RED}✗ Docker Compose not installed${NC}"
        missing+=("Docker Compose")
    fi
    
    echo ""
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Missing requirements: ${missing[*]}${NC}"
        echo ""
        echo "Please install:"
        echo "• Node.js: https://nodejs.org/ (v18+ LTS recommended)"
        echo "• Docker Desktop: https://www.docker.com/products/docker-desktop/"
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✅ All requirements satisfied!${NC}"
    fi
    echo ""
}

# Install application
install_app() {
    echo "📦 Installing Contracts SaaS..."
    echo ""
    
    # Setup environment
    if [ ! -f ".env" ]; then
        echo "Creating environment configuration..."
        cp deployment/config/.env.template .env
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env with your configuration${NC}"
    else
        echo -e "${GREEN}✓ Environment file exists${NC}"
    fi
    
    # Start database
    echo ""
    echo "🗄️  Starting PostgreSQL database..."
    cd deployment
    docker compose down 2>/dev/null || true
    docker compose up -d
    cd ..
    
    # Wait for database
    echo -n "Waiting for database to be ready"
    for i in {1..30}; do
        if docker exec contracts_db pg_isready -U contracts_user >/dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    
    # Install dependencies
    echo "📥 Installing dependencies..."
    
    echo "  • Server dependencies..."
    cd server
    npm install --silent
    cd ..
    
    echo "  • Client dependencies..."
    cd client
    npm install --silent
    cd ..
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
    
    # Build application
    echo "🔨 Building application..."
    
    echo "  • Building client..."
    cd client
    npm run build >/dev/null 2>&1
    cd ..
    
    echo "  • Building server..."
    cd server
    npm run build >/dev/null 2>&1
    cd ..
    
    echo -e "${GREEN}✓ Application built successfully${NC}"
    echo ""
    
    # Create convenience scripts
    create_scripts
}

# Create convenience scripts
create_scripts() {
    echo "📝 Creating convenience scripts..."
    
    # Start script
    cat > start.sh << 'SCRIPT'
#!/bin/bash
echo "Starting Contracts SaaS..."

# Start database
cd deployment && docker compose up -d && cd ..

# Start server
cd server && npm run dev > ../logs/server.log 2>&1 &
echo $! > ../server.pid
cd ..

# Start client
cd client && npm run dev > ../logs/client.log 2>&1 &
echo $! > ../client.pid
cd ..

echo "✅ Application started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3002"
echo "   Database: localhost:5433"
echo ""
echo "Logs: tail -f logs/*.log"
echo "Stop: ./stop.sh"
SCRIPT
    
    # Stop script
    cat > stop.sh << 'SCRIPT'
#!/bin/bash
echo "Stopping Contracts SaaS..."

# Stop Node processes
if [ -f server.pid ]; then
    kill $(cat server.pid) 2>/dev/null || true
    rm server.pid
fi
if [ -f client.pid ]; then
    kill $(cat client.pid) 2>/dev/null || true
    rm client.pid
fi

# Stop database
cd deployment && docker compose down && cd ..

echo "✅ All services stopped"
SCRIPT
    
    # Status script
    cat > status.sh << 'SCRIPT'
#!/bin/bash
echo "Contracts SaaS Status"
echo "===================="

# Database
echo -n "Database: "
if docker ps | grep -q contracts_db; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Server
echo -n "Server:   "
if [ -f server.pid ] && kill -0 $(cat server.pid) 2>/dev/null; then
    echo "✅ Running (PID: $(cat server.pid))"
else
    echo "❌ Not running"
fi

# Client
echo -n "Client:   "
if [ -f client.pid ] && kill -0 $(cat client.pid) 2>/dev/null; then
    echo "✅ Running (PID: $(cat client.pid))"
else
    echo "❌ Not running"
fi
SCRIPT
    
    # Make scripts executable
    chmod +x start.sh stop.sh status.sh
    
    # Create logs directory
    mkdir -p logs
    
    echo -e "${GREEN}✓ Scripts created${NC}"
}

# Main installation
main() {
    check_requirements
    install_app
    
    echo ""
    echo -e "${GREEN}========================================"
    echo "   ✅ Installation Complete!"
    echo "========================================${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Edit configuration: ${YELLOW}vi .env${NC}"
    echo "  2. Start application: ${YELLOW}./start.sh${NC}"
    echo "  3. Access frontend: ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo "📧 Default admin credentials:"
    echo "  Email: admin@caplocations.com"
    echo "  Password: admin123"
    echo ""
    echo "📚 Commands:"
    echo "  ./start.sh  - Start all services"
    echo "  ./stop.sh   - Stop all services"
    echo "  ./status.sh - Check service status"
    echo ""
}

# Run installation
main