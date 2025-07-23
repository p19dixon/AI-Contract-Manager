# Package Updates - Version 20250721-203849

This deployment package includes several important updates to improve deployment reliability and avoid common issues.

## Key Updates

### 1. Port Conflict Resolution
- **PostgreSQL now uses port 5433** instead of default 5432
- Prevents conflicts with existing PostgreSQL installations
- All configuration files updated accordingly

### 2. Enhanced Setup Process
- **New `setup-with-deps.sh` script** that:
  - Checks for Docker and Node.js installation
  - Guides users through dependency installation
  - Offers to download installers if needed
  - Falls back to standard setup if all deps are met

### 3. Comprehensive Documentation
- **PORT_CONFLICT_GUIDE.md**: Detailed troubleshooting for port conflicts
- **INSTALLATION_GUIDE.md**: Step-by-step installation for all platforms
- **PACKAGE_README.md**: Explains all packaging options
- **DEPLOYMENT_INSTRUCTIONS.md**: Quick deployment guide

### 4. Installer Support
- Can download Docker and Node.js installers with `./download-installers.sh`
- Create offline-capable packages with `./create-package.sh --with-installers`
- Platform-specific installation instructions included

## Files Changed

### Configuration Updates
- `docker-compose.yml`: PostgreSQL port changed to 5433
- `config/.env.template`: DATABASE_URL updated to use port 5433
- `setup.sh`: Added note about port 5433

### New Files
- `setup-with-deps.sh`: Enhanced setup with dependency checking
- `download-installers.sh`: Downloads Docker/Node.js installers
- `PORT_CONFLICT_GUIDE.md`: Port conflict troubleshooting
- `INSTALLATION_GUIDE.md`: Complete installation guide
- `PACKAGE_README.md`: Package creation options

### Updated Scripts
- `create-package.sh`: Now supports --with-installers option
- `setup.sh`: Includes port 5433 notification

## Migration from Previous Versions

If you're upgrading from a previous deployment:

1. **Stop existing services**: `./stop.sh`
2. **Update docker-compose.yml**: Change port to 5433
3. **Update .env file**: Change DATABASE_URL port to 5433
4. **Restart services**: `./start.sh`

## Benefits

1. **Reduced Conflicts**: Port 5433 avoids conflicts with local PostgreSQL
2. **Better UX**: Guided installation for missing dependencies
3. **Offline Support**: Can create self-contained packages with installers
4. **Clear Documentation**: Comprehensive guides for all scenarios

## Quick Start

```bash
# Extract package
tar -xzf contracts-saas-deployment-20250721-203849.tar.gz
cd contracts-saas-deployment-20250721-203849/deployment

# Run enhanced setup (recommended)
./setup-with-deps.sh

# Or standard setup if you have all dependencies
./setup.sh
```

## Support

See the following guides for help:
- General issues: `README.md`
- Port conflicts: `PORT_CONFLICT_GUIDE.md`
- Installation help: `INSTALLATION_GUIDE.md`
- Package options: `PACKAGE_README.md`