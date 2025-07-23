# Deployment Package Options

This deployment system provides multiple options for packaging and deploying the Contracts SaaS application.

## Package Creation Options

### 1. Standard Package (Recommended for most users)
```bash
./create-package.sh
```
- Creates a lightweight package (~5-10 MB)
- Excludes installer files
- Requires internet connection during setup
- Best for users who already have Docker and Node.js

### 2. Package with Installers
```bash
./create-package.sh --with-installers
```
- Creates a complete offline-capable package (~500+ MB)
- Includes Docker and Node.js installers for all platforms
- No internet required for dependency installation
- Best for offline deployments or standardized installations

### 3. Quick Package
```bash
./create-package.sh --quick
```
- Creates minimal package without removing installer directory
- Fastest option for development/testing
- Preserves any existing installer files

## Installer Download Options

### Download All Installers
```bash
./download-installers.sh
```
Downloads:
- Node.js installers for macOS, Windows, and Linux
- Docker Desktop for macOS (Intel & Apple Silicon) and Windows
- Docker Engine install scripts for Linux
- Platform-specific README files

## Setup Options

### 1. Enhanced Setup (Recommended)
```bash
./setup-with-deps.sh
```
Features:
- Checks for Docker and Node.js installation
- Provides guided installation if dependencies are missing
- Offers to use local installers or download fresh ones
- Shows platform-specific instructions
- Falls back to regular setup if all dependencies are met

### 2. Standard Setup
```bash
./setup.sh
```
Features:
- Assumes all dependencies are installed
- Proceeds directly with application setup
- Faster but may fail if dependencies are missing

## Directory Structure

```
deployment/
├── installers/              # Downloaded installers (optional)
│   ├── mac/                # macOS installers
│   │   ├── nodejs-*.pkg
│   │   ├── Docker-Intel.dmg
│   │   ├── Docker-AppleSilicon.dmg
│   │   └── README.md
│   ├── windows/            # Windows installers
│   │   ├── nodejs-*-x64.msi
│   │   ├── Docker-Desktop-Installer.exe
│   │   └── README.md
│   └── linux/              # Linux install scripts
│       ├── install-nodejs.sh
│       ├── install-docker.sh
│       └── README.md
├── database/               # Database setup files
├── config/                 # Configuration templates
├── scripts/                # Generated convenience scripts
├── backups/               # Database backup directory
├── setup.sh               # Standard setup script
├── setup-with-deps.sh     # Enhanced setup with dependency checking
├── download-installers.sh # Download installers script
├── create-package.sh      # Package creation script
├── docker-compose.yml     # Docker configuration
├── package.json           # npm scripts for deployment
├── README.md              # Main deployment documentation
├── INSTALLATION_GUIDE.md  # Detailed installation instructions
└── PACKAGE_README.md      # This file
```

## Usage Scenarios

### Scenario 1: Developer with Docker/Node.js installed
```bash
# Create standard package
./create-package.sh

# On target machine
tar -xzf contracts-saas-deployment-*.tar.gz
cd contracts-saas-deployment-*/deployment
./setup.sh
```

### Scenario 2: Fresh machine installation
```bash
# Create package with installers
./create-package.sh --with-installers

# On target machine
tar -xzf contracts-saas-deployment-*-with-installers.tar.gz
cd contracts-saas-deployment-*/deployment
./setup-with-deps.sh
# Follow prompts to install dependencies
```

### Scenario 3: IT department standardized deployment
```bash
# Download installers once
./download-installers.sh

# Create multiple packages with installers
./create-package.sh --with-installers

# Distribute packages to team members
# Each runs: ./setup-with-deps.sh
```

## Tips

1. **Offline Deployments**: Use `--with-installers` to create self-contained packages
2. **CI/CD Integration**: Use standard packages and ensure build agents have dependencies
3. **Docker-only Environments**: Containerize the entire application instead
4. **Air-gapped Networks**: Pre-download all installers and npm packages

## Troubleshooting

### Package too large
- Use standard package without installers
- Host installers on internal file server
- Use Docker registry for container images

### Setup fails
- Run `./setup-with-deps.sh` for guided troubleshooting
- Check `INSTALLATION_GUIDE.md` for manual steps
- Verify system requirements are met

### Missing permissions
- Ensure scripts are executable: `chmod +x *.sh`
- Run with appropriate privileges for Docker
- Check file ownership after extraction