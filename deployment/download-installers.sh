#!/bin/bash

# Download installers for Docker and Node.js
# This script downloads the latest stable versions

echo "=================================="
echo "Downloading Installers"
echo "=================================="
echo ""

# Create directories if they don't exist
mkdir -p installers/{mac,windows,linux}

# Function to download with progress
download_file() {
    local url=$1
    local output=$2
    echo "Downloading $(basename $output)..."
    curl -L --progress-bar -o "$output" "$url"
}

# Node.js versions
NODE_VERSION="20.11.0"  # LTS version

echo "Downloading Node.js v${NODE_VERSION} installers..."
echo ""

# macOS
download_file "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}.pkg" \
    "installers/mac/nodejs-${NODE_VERSION}.pkg"

# Windows
download_file "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-x64.msi" \
    "installers/windows/nodejs-${NODE_VERSION}-x64.msi"

# Linux (using NodeSource setup script)
cat > installers/linux/install-nodejs.sh << 'EOF'
#!/bin/bash
# Install Node.js on Linux using NodeSource repository

echo "Installing Node.js 20.x LTS..."

# Detect distribution
if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
elif [ -f /etc/redhat-release ]; then
    # RHEL/CentOS/Fedora
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
else
    echo "Unsupported Linux distribution"
    echo "Please visit https://nodejs.org for manual installation"
    exit 1
fi

echo "Node.js installation complete!"
node --version
npm --version
EOF

chmod +x installers/linux/install-nodejs.sh

echo ""
echo "Downloading Docker Desktop installers..."
echo "Note: These are large files and may take some time"
echo ""

# Docker Desktop versions
DOCKER_MAC_VERSION="4.27.1"
DOCKER_WIN_VERSION="4.27.1"

# macOS - Intel
download_file "https://desktop.docker.com/mac/main/amd64/Docker.dmg" \
    "installers/mac/Docker-Intel.dmg"

# macOS - Apple Silicon
download_file "https://desktop.docker.com/mac/main/arm64/Docker.dmg" \
    "installers/mac/Docker-AppleSilicon.dmg"

# Windows
download_file "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" \
    "installers/windows/Docker-Desktop-Installer.exe"

# Linux - Docker Engine install script
cat > installers/linux/install-docker.sh << 'EOF'
#!/bin/bash
# Install Docker Engine on Linux

echo "Installing Docker Engine..."

# Official Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo ""
echo "Docker installation complete!"
echo "Please log out and back in for group changes to take effect."
echo ""
docker --version
docker-compose --version
EOF

chmod +x installers/linux/install-docker.sh

echo ""
echo "Creating installer README files..."

# macOS README
cat > installers/mac/README.md << 'EOF'
# macOS Installation Guide

## Installing Node.js

1. Double-click `nodejs-*.pkg`
2. Follow the installation wizard
3. Verify installation by opening Terminal and running:
   ```bash
   node --version
   npm --version
   ```

## Installing Docker Desktop

### For Intel Macs:
1. Double-click `Docker-Intel.dmg`
2. Drag Docker to Applications folder
3. Open Docker from Applications
4. Follow the setup wizard

### For Apple Silicon Macs (M1/M2/M3):
1. Double-click `Docker-AppleSilicon.dmg`
2. Drag Docker to Applications folder
3. Open Docker from Applications
4. Follow the setup wizard

## Verify Installation

Open Terminal and run:
```bash
docker --version
docker-compose --version
```

## Troubleshooting

If Docker commands fail:
1. Ensure Docker Desktop is running (check menu bar)
2. Try restarting Docker Desktop
3. Check System Preferences > Security & Privacy
EOF

# Windows README
cat > installers/windows/README.md << 'EOF'
# Windows Installation Guide

## Prerequisites

- Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
- Windows 11 64-bit
- Enable WSL 2 feature (Docker installer will guide you)

## Installing Node.js

1. Double-click `nodejs-*-x64.msi`
2. Follow the installation wizard
3. Check "Automatically install necessary tools" when prompted
4. Verify installation by opening Command Prompt and running:
   ```cmd
   node --version
   npm --version
   ```

## Installing Docker Desktop

1. Double-click `Docker-Desktop-Installer.exe`
2. Follow the installation wizard
3. Ensure "Use WSL 2 instead of Hyper-V" is checked
4. Restart your computer when prompted
5. Open Docker Desktop from Start menu
6. Follow the setup tutorial

## Verify Installation

Open PowerShell or Command Prompt and run:
```cmd
docker --version
docker-compose --version
```

## Troubleshooting

If Docker fails to start:
1. Ensure virtualization is enabled in BIOS
2. Install/Update WSL 2: https://aka.ms/wsl2
3. Restart Windows
4. Check Windows Features:
   - Virtual Machine Platform
   - Windows Subsystem for Linux
EOF

# Linux README
cat > installers/linux/README.md << 'EOF'
# Linux Installation Guide

## Installing Node.js

Run the provided script:
```bash
chmod +x install-nodejs.sh
./install-nodejs.sh
```

Or install manually:
- Ubuntu/Debian: `sudo apt install nodejs npm`
- Fedora: `sudo dnf install nodejs npm`
- Arch: `sudo pacman -S nodejs npm`

## Installing Docker

Run the provided script:
```bash
chmod +x install-docker.sh
./install-docker.sh
```

After installation, log out and back in for group changes to take effect.

## Verify Installation

```bash
node --version
npm --version
docker --version
docker-compose --version
```

## Troubleshooting

If Docker commands fail with permission errors:
1. Ensure you're in the docker group: `groups`
2. Log out and back in
3. Or run: `newgrp docker`
EOF

echo ""
echo "=================================="
echo "✅ Download Complete!"
echo "=================================="
echo ""
echo "Installers downloaded to:"
echo "- installers/mac/     - macOS installers"
echo "- installers/windows/ - Windows installers"
echo "- installers/linux/   - Linux install scripts"
echo ""
echo "Total size: $(du -sh installers | cut -f1)"
echo ""
echo "Note: The deployment package will be large due to Docker Desktop installers."
echo "Consider hosting installers separately and providing download links instead."