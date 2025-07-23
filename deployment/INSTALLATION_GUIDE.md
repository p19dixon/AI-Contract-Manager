# Complete Installation Guide

This guide provides step-by-step instructions for installing the Contracts SaaS application with all dependencies.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Installing Dependencies](#installing-dependencies)
   - [macOS Installation](#macos-installation)
   - [Windows Installation](#windows-installation)
   - [Linux Installation](#linux-installation)
4. [Setting Up the Application](#setting-up-the-application)
5. [Verification Steps](#verification-steps)
6. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB (8GB recommended)
- **Storage**: 2GB free space
- **OS**: macOS 10.15+, Windows 10/11 (64-bit), or Linux

### Required Software
- Docker Desktop or Docker Engine
- Node.js 18.0 or higher
- npm (comes with Node.js)

## Pre-Installation Checklist

Before starting installation:

1. ✅ Check your system meets minimum requirements
2. ✅ Close any applications using ports 3000, 3002, or 5432
3. ✅ Ensure you have administrator/sudo access
4. ✅ Have a stable internet connection

## Installing Dependencies

### macOS Installation

#### Step 1: Install Node.js

**Option A - Using Installer (Recommended):**
1. Navigate to `installers/mac/` or download from [nodejs.org](https://nodejs.org/)
2. Double-click `nodejs-*.pkg`
3. Follow the installation wizard
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**Option B - Using Homebrew:**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

#### Step 2: Install Docker Desktop

1. Navigate to `installers/mac/` or download from [Docker website](https://www.docker.com/products/docker-desktop)
2. For Intel Macs: Double-click `Docker-Intel.dmg`
3. For Apple Silicon (M1/M2/M3): Double-click `Docker-AppleSilicon.dmg`
4. Drag Docker to Applications folder
5. Open Docker from Applications
6. Follow the setup wizard
7. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

### Windows Installation

#### Prerequisites for Windows

1. Enable WSL 2:
   - Open PowerShell as Administrator
   - Run: `wsl --install`
   - Restart your computer

2. Enable virtualization in BIOS (if not already enabled)

#### Step 1: Install Node.js

1. Navigate to `installers/windows/` or download from [nodejs.org](https://nodejs.org/)
2. Double-click `nodejs-*-x64.msi`
3. Follow the installation wizard
4. Check "Automatically install necessary tools" when prompted
5. Verify in Command Prompt:
   ```cmd
   node --version
   npm --version
   ```

#### Step 2: Install Docker Desktop

1. Navigate to `installers/windows/` or download from [Docker website](https://www.docker.com/products/docker-desktop)
2. Double-click `Docker-Desktop-Installer.exe`
3. Ensure "Use WSL 2 instead of Hyper-V" is checked
4. Follow the installation wizard
5. Restart your computer when prompted
6. Open Docker Desktop from Start menu
7. Follow the initial setup
8. Verify in PowerShell:
   ```powershell
   docker --version
   docker-compose --version
   ```

### Linux Installation

#### Step 1: Install Node.js

**Option A - Using provided script:**
```bash
cd installers/linux
chmod +x install-nodejs.sh
./install-nodejs.sh
```

**Option B - Manual installation:**

Ubuntu/Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Fedora/RHEL/CentOS:
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

Arch Linux:
```bash
sudo pacman -S nodejs npm
```

#### Step 2: Install Docker

**Option A - Using provided script:**
```bash
cd installers/linux
chmod +x install-docker.sh
./install-docker.sh
```

**Option B - Manual installation:**

Ubuntu/Debian:
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

## Setting Up the Application

Once all dependencies are installed:

1. **Navigate to deployment directory:**
   ```bash
   cd deployment
   ```

2. **Run enhanced setup:**
   ```bash
   ./setup-with-deps.sh
   ```
   
   This will verify all dependencies and guide you through any missing installations.

3. **Follow the prompts:**
   - The script will check for Node.js and Docker
   - If everything is installed, it will proceed with setup
   - If not, it will offer to help install missing components

4. **Complete the setup:**
   - Database will be started automatically
   - Dependencies will be installed
   - Application will be built
   - Convenience scripts will be created

## Verification Steps

After installation, verify everything is working:

1. **Check services are running:**
   ```bash
   ./status.sh
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3002
   - Login with default admin credentials

3. **Test database connection:**
   ```bash
   docker exec -it contracts_db psql -U contracts_user -d contracts_db -c "SELECT version();"
   ```

## Troubleshooting

### Common Issues and Solutions

#### Docker not starting on Windows
- Ensure virtualization is enabled in BIOS
- Install/update WSL 2: `wsl --update`
- Restart Docker Desktop
- Check Windows Features are enabled:
  - Virtual Machine Platform
  - Windows Subsystem for Linux

#### Port already in use
```bash
# Find process using port (example for port 3000)
# macOS/Linux:
lsof -i :3000
# Windows:
netstat -ano | findstr :3000

# Kill the process or change the port in configuration
```

#### Permission denied errors on Linux
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in, or run:
newgrp docker
```

#### npm install fails
```bash
# Clear npm cache
npm cache clean --force
# Try with different registry
npm install --registry https://registry.npmjs.org/
```

#### Database connection refused
```bash
# Check if container is running
docker ps
# Check logs
docker logs contracts_db
# Restart container
docker-compose restart
```

### Getting Help

If you encounter issues:

1. Check the error message carefully
2. Review relevant log files
3. Ensure all prerequisites are met
4. Try the manual setup steps
5. Search for the specific error online

### Useful Commands

```bash
# Check versions
node --version
npm --version
docker --version
docker-compose --version

# Check running containers
docker ps

# View Docker logs
docker logs contracts_db

# Stop all services
./stop.sh

# Reset database
cd deployment
docker-compose down -v
docker-compose up -d
```

## Next Steps

After successful installation:

1. Change the default admin password
2. Configure your environment settings
3. Set up backups for the database
4. Review security settings
5. Explore the application features

Congratulations! Your Contracts SaaS application is now installed and ready to use.