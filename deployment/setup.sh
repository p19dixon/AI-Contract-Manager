#!/bin/bash

# Contracts SaaS Local Setup Script
# This script sets up the database and prepares the application for local deployment

set -e

echo "=================================="
echo "Contracts SaaS Deployment Setup"
echo "=================================="
echo ""

# Check for required tools
check_requirements() {
    echo "Checking requirements..."
    
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        echo "   Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check for Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        echo "   Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18+ first."
        echo "   Visit: https://nodejs.org/"
        exit 1
    fi
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi
    
    echo "✅ All requirements met!"
    echo ""
}

# Setup environment files
setup_environment() {
    echo "Setting up environment files..."
    
    # Create root .env if it doesn't exist
    if [ ! -f "../.env" ]; then
        cp config/.env.template ../.env
        echo "✅ Created .env file from template"
        echo "⚠️  Please edit ../.env with your configuration"
    else
        echo "✅ .env file already exists"
    fi
    
    echo ""
}

# Start PostgreSQL database
start_database() {
    echo "Starting PostgreSQL database..."
    echo "Note: Database will run on port 5433 to avoid conflicts"
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Start PostgreSQL
    docker-compose up -d
    
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 5
    
    # Check if database is ready
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U contracts_user -d contracts_db &> /dev/null; then
            echo "✅ Database is ready!"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    echo ""
}

# Install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    
    # Install server dependencies
    echo "Installing server dependencies..."
    cd ../server
    npm install
    cd ../deployment
    
    # Install client dependencies
    echo "Installing client dependencies..."
    cd ../client
    npm install
    cd ../deployment
    
    echo "✅ Dependencies installed!"
    echo ""
}

# Build the application
build_application() {
    echo "Building the application..."
    
    # Build client
    echo "Building client..."
    cd ../client
    npm run build
    cd ../deployment
    
    # Build server
    echo "Building server..."
    cd ../server
    npm run build
    cd ../deployment
    
    echo "✅ Application built!"
    echo ""
}

# Create start scripts
create_scripts() {
    echo "Creating convenience scripts..."
    
    # Create start script
    cat > start.sh << 'EOF'
#!/bin/bash
# Start the Contracts SaaS application

echo "Starting Contracts SaaS..."

# Start database
cd deployment
docker-compose up -d
cd ..

# Start server
echo "Starting server..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Start client
echo "Starting client..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ Application started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3002"
echo "   Database: localhost:5433"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $SERVER_PID $CLIENT_PID; cd deployment && docker-compose down; exit" INT
wait
EOF
    
    # Create stop script
    cat > stop.sh << 'EOF'
#!/bin/bash
# Stop the Contracts SaaS application

echo "Stopping Contracts SaaS..."

# Stop Node processes
pkill -f "node.*server" || true
pkill -f "node.*client" || true

# Stop database
cd deployment
docker-compose down
cd ..

echo "✅ All services stopped!"
EOF
    
    # Create status script
    cat > status.sh << 'EOF'
#!/bin/bash
# Check status of Contracts SaaS services

echo "Contracts SaaS Status"
echo "===================="
echo ""

# Check database
echo -n "Database: "
if docker ps | grep -q contracts_db; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check server
echo -n "Server:   "
if pgrep -f "node.*server" > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check client
echo -n "Client:   "
if pgrep -f "node.*client" > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

echo ""
EOF
    
    # Make scripts executable
    chmod +x start.sh stop.sh status.sh
    mv start.sh ..
    mv stop.sh ..
    mv status.sh ..
    
    echo "✅ Scripts created!"
    echo ""
}

# Main execution
main() {
    check_requirements
    setup_environment
    start_database
    install_dependencies
    build_application
    create_scripts
    
    echo "=================================="
    echo "✅ Setup Complete!"
    echo "=================================="
    echo ""
    echo "Next steps:"
    echo "1. Edit the .env file with your configuration"
    echo "2. Run './start.sh' to start the application"
    echo "3. Visit http://localhost:3000 to access the frontend"
    echo ""
    echo "Default admin credentials:"
    echo "Email: admin@caplocations.com"
    echo "Password: admin123"
    echo ""
    echo "⚠️  Remember to change the admin password after first login!"
    echo ""
}

# Run main function
main