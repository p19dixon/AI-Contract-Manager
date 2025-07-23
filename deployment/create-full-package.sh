#!/bin/bash

# Create Complete Deployment Package with All Scripts
# This creates a fully validated deployment package for Mac mini

set -e

echo "========================================"
echo "Creating Full Deployment Package"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create timestamp for package name
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="contracts-saas-mac-deployment-${TIMESTAMP}"

echo "📦 Package name: ${PACKAGE_NAME}.tar.gz"
echo ""

# Step 1: Create temporary directory structure
echo "1️⃣  Creating package structure..."
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="${TEMP_DIR}/${PACKAGE_NAME}"
mkdir -p "${PACKAGE_DIR}"

# Step 2: Copy source files
echo "2️⃣  Copying source files..."
cp -r ../server "${PACKAGE_DIR}/"
cp -r ../client "${PACKAGE_DIR}/"
cp -r . "${PACKAGE_DIR}/deployment"
cp ../package.json "${PACKAGE_DIR}/" 2>/dev/null || true
cp ../package-lock.json "${PACKAGE_DIR}/" 2>/dev/null || true

# Step 3: Create startup scripts in root
echo "3️⃣  Creating startup scripts..."

# Create start.sh
cat > "${PACKAGE_DIR}/start.sh" << 'SCRIPT'
#!/bin/bash

echo "========================================"
echo "Starting Contracts SaaS Application"
echo "========================================"
echo ""

# Check if already running
if [ -f .running ]; then
    echo "⚠️  Application appears to be running already."
    echo "   Run ./status.sh to check"
    echo "   Run ./stop.sh to stop first"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Start database
echo "🗄️  Starting PostgreSQL database..."
cd deployment
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "❌ Failed to start database"
    exit 1
fi
cd ..

# Wait for database
echo -n "⏳ Waiting for database to be ready"
for i in {1..30}; do
    if docker exec contracts_db pg_isready -U contracts_user >/dev/null 2>&1; then
        echo -e " ✅"
        break
    fi
    echo -n "."
    sleep 1
done

# Start backend server
echo "🚀 Starting backend server..."
cd server
npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > ../server.pid
cd ..

# Wait for server to start
echo -n "⏳ Waiting for server to be ready"
for i in {1..30}; do
    if curl -s http://localhost:3002/health >/dev/null 2>&1; then
        echo -e " ✅"
        break
    fi
    echo -n "."
    sleep 1
done

# Start frontend client
echo "🎨 Starting frontend client..."
cd client
npm run dev > ../logs/client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > ../client.pid
cd ..

# Mark as running
touch .running

echo ""
echo "========================================"
echo "✅ Application Started Successfully!"
echo "========================================"
echo ""
echo "🌐 Access points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3002"
echo "   Database:  localhost:5433"
echo ""
echo "📋 Default login:"
echo "   Email:     admin@caplocations.com"
echo "   Password:  admin123"
echo ""
echo "📝 Commands:"
echo "   ./status.sh - Check service status"
echo "   ./stop.sh   - Stop all services"
echo "   ./logs.sh   - View logs"
echo ""
echo "📄 Logs are in: logs/"
SCRIPT

# Create stop.sh
cat > "${PACKAGE_DIR}/stop.sh" << 'SCRIPT'
#!/bin/bash

echo "========================================"
echo "Stopping Contracts SaaS Application"
echo "========================================"
echo ""

# Stop frontend
if [ -f client.pid ]; then
    echo "🛑 Stopping frontend..."
    kill $(cat client.pid) 2>/dev/null || true
    rm client.pid
fi

# Stop backend
if [ -f server.pid ]; then
    echo "🛑 Stopping backend..."
    kill $(cat server.pid) 2>/dev/null || true
    rm server.pid
fi

# Stop database
echo "🛑 Stopping database..."
cd deployment
docker-compose down
cd ..

# Remove running marker
rm -f .running

echo ""
echo "✅ All services stopped"
echo ""
SCRIPT

# Create status.sh
cat > "${PACKAGE_DIR}/status.sh" << 'SCRIPT'
#!/bin/bash

echo "========================================"
echo "Contracts SaaS Status"
echo "========================================"
echo ""

# Check database
echo -n "🗄️  Database:  "
if docker ps 2>/dev/null | grep -q contracts_db; then
    echo "✅ Running (PostgreSQL on port 5433)"
else
    echo "❌ Not running"
fi

# Check backend
echo -n "🚀 Backend:   "
if [ -f server.pid ] && kill -0 $(cat server.pid) 2>/dev/null; then
    echo "✅ Running (PID: $(cat server.pid), port 3002)"
else
    echo "❌ Not running"
fi

# Check frontend
echo -n "🎨 Frontend:  "
if [ -f client.pid ] && kill -0 $(cat client.pid) 2>/dev/null; then
    echo "✅ Running (PID: $(cat client.pid), port 3000)"
else
    echo "❌ Not running"
fi

echo ""

# Check ports
echo "📡 Port Status:"
echo -n "   Port 3000: "
if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ In use"
else
    echo "❌ Free"
fi

echo -n "   Port 3002: "
if lsof -i :3002 >/dev/null 2>&1; then
    echo "✅ In use"
else
    echo "❌ Free"
fi

echo -n "   Port 5433: "
if lsof -i :5433 >/dev/null 2>&1; then
    echo "✅ In use"
else
    echo "❌ Free"
fi

echo ""

# Check for common issues
if docker ps 2>/dev/null | grep -q contracts_db && [ ! -f server.pid ]; then
    echo "⚠️  Database is running but server is not. Run ./start.sh"
fi

if [ -f .running ] && [ ! -f server.pid ]; then
    echo "⚠️  Application marked as running but processes not found. Run ./stop.sh then ./start.sh"
fi
SCRIPT

# Create logs.sh
cat > "${PACKAGE_DIR}/logs.sh" << 'SCRIPT'
#!/bin/bash

echo "========================================"
echo "Contracts SaaS Logs"
echo "========================================"
echo ""
echo "Press Ctrl+C to exit"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Tail all logs
tail -f logs/*.log
SCRIPT

# Create fix-admin-password.sh
cat > "${PACKAGE_DIR}/fix-admin-password.sh" << 'SCRIPT'
#!/bin/bash

echo "========================================"
echo "Fixing Admin Password"
echo "========================================"
echo ""

# Check if database is running
if ! docker ps | grep -q contracts_db; then
    echo "❌ Database is not running. Please start it first with ./start.sh"
    exit 1
fi

echo "🔧 Updating admin password to 'admin123'..."

# Update the password
docker exec -i contracts_db psql -U contracts_user -d contracts_db << EOF
UPDATE users 
SET password = '\$2b\$10\$UNb4dXSVcjFb6b/ZeuwJcub3wAwoU8glCRXVhrrK/h51KXHtPQ.2m' 
WHERE email = 'admin@caplocations.com';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Admin password updated successfully!"
    echo ""
    echo "You can now login with:"
    echo "  Email: admin@caplocations.com"
    echo "  Password: admin123"
else
    echo "❌ Failed to update password"
    exit 1
fi
SCRIPT

# Create install.sh
cat > "${PACKAGE_DIR}/install.sh" << 'SCRIPT'
#!/bin/bash

echo "========================================"
echo "Contracts SaaS Mac Installation"
echo "========================================"
echo ""

# Check requirements
echo "📋 Checking requirements..."

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please install from https://nodejs.org/"
    exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker not found. Please install Docker Desktop from https://docker.com/"
    exit 1
fi

echo "✅ All requirements met"
echo ""

# Setup environment
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp deployment/config/.env.template .env
    echo "⚠️  Please edit .env with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
echo "  This may take a few minutes..."

cd server
npm install
cd ..

cd client
npm install
cd ..

# Initialize database
echo ""
echo "🗄️  Initializing database..."
cd deployment
docker-compose up -d
cd ..

# Wait for database
echo -n "Waiting for database"
for i in {1..30}; do
    if docker exec contracts_db pg_isready -U contracts_user >/dev/null 2>&1; then
        echo " ✅"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "========================================"
echo "✅ Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your settings"
echo "2. Run ./start.sh to start the application"
echo "3. Access at http://localhost:3000"
echo ""
SCRIPT

# Make all scripts executable
chmod +x "${PACKAGE_DIR}"/*.sh

# Step 4: Clean up files
echo "4️⃣  Cleaning up unnecessary files..."
find "${PACKAGE_DIR}" -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "${PACKAGE_DIR}" -name ".git" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "${PACKAGE_DIR}" -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "${PACKAGE_DIR}" -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "${PACKAGE_DIR}" -name ".env" -type f -delete 2>/dev/null || true
find "${PACKAGE_DIR}" -name "*.log" -type f -delete 2>/dev/null || true
find "${PACKAGE_DIR}" -name ".DS_Store" -type f -delete 2>/dev/null || true

# Step 5: Create README
echo "5️⃣  Creating documentation..."
cat > "${PACKAGE_DIR}/README.md" << 'README'
# Contracts SaaS - Mac Deployment Package

## Quick Start

1. **Install** (first time only):
   ```bash
   ./install.sh
   ```

2. **Configure**:
   ```bash
   vi .env  # Edit with your settings
   ```

3. **Start**:
   ```bash
   ./start.sh
   ```

4. **Access**:
   - Frontend: http://localhost:3000
   - Login: admin@caplocations.com / admin123

## Commands

- `./install.sh` - Install dependencies and setup database
- `./start.sh` - Start all services
- `./stop.sh` - Stop all services
- `./status.sh` - Check what's running
- `./logs.sh` - View application logs
- `./fix-admin-password.sh` - Reset admin password to 'admin123'

## Requirements

- macOS (tested on Mac mini)
- Node.js 18+
- Docker Desktop

## Troubleshooting

If services don't start:
1. Check Docker is running: `docker ps`
2. Check ports are free: `./status.sh`
3. Check logs: `./logs.sh`
4. Restart: `./stop.sh` then `./start.sh`

## Default Ports

- Frontend: 3000
- Backend API: 3002
- PostgreSQL: 5433 (not 5432 to avoid conflicts)
README

# Step 6: Create the archive
echo "6️⃣  Creating archive..."
cd "${TEMP_DIR}"
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"

# Move to deployment directory
mv "${PACKAGE_NAME}.tar.gz" "${OLDPWD}/"

# Cleanup
rm -rf "${TEMP_DIR}"

# Final message
cd "${OLDPWD}"
echo ""
echo "========================================"
echo -e "${GREEN}✅ Package Created Successfully!${NC}"
echo "========================================"
echo ""
echo "📦 Package: ${PACKAGE_NAME}.tar.gz"
echo "📏 Size: $(du -h ${PACKAGE_NAME}.tar.gz | cut -f1)"
echo ""
echo "📋 To deploy on Mac mini:"
echo "1. Copy ${PACKAGE_NAME}.tar.gz to your Mac mini"
echo "2. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "3. Enter directory: cd ${PACKAGE_NAME}"
echo "4. Install: ./install.sh"
echo "5. Start: ./start.sh"
echo ""
echo -e "${YELLOW}⚠️  This package includes:${NC}"
echo "   ✅ All source code"
echo "   ✅ Start/stop/status scripts"
echo "   ✅ Installation script"
echo "   ✅ Log viewer"
echo "   ✅ Database on port 5433"
echo "   ✅ TypeScript fixes applied"
echo ""