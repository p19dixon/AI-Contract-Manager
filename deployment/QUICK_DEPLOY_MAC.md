# Quick Deploy for Mac Mini

## One-Command Deployment

If you want to deploy on a clean Mac mini system, use this single command:

```bash
# Option 1: Using the latest package with fixes
tar -xzf contracts-saas-deployment-20250721-214854.tar.gz && \
cd contracts-saas-deployment-20250721-214854/deployment && \
./deploy-mac-mini.sh
```

## What This Does

1. **Extracts** the deployment package
2. **Checks** for Node.js, Docker, and Docker Compose
3. **Applies** all TypeScript fixes automatically
4. **Builds** the application successfully
5. **Starts** PostgreSQL database on port 5433
6. **Creates** convenience scripts

## Manual Steps

If the one-command deployment has issues, follow these steps:

### 1. Extract Package
```bash
tar -xzf contracts-saas-deployment-20250721-214854.tar.gz
cd contracts-saas-deployment-20250721-214854
```

### 2. Go to Deployment Directory
```bash
cd deployment
```

### 3. Run the Mac Mini Deployment Script
```bash
./deploy-mac-mini.sh
```

This script will:
- Check all requirements
- Apply all TypeScript fixes
- Build successfully
- Set up the database
- Create start/stop scripts

### 4. Configure Environment
```bash
cd ..
vi .env  # Edit with your settings
```

### 5. Start the Application
```bash
./start.sh
```

## If You Still Get Errors

The deployment package you were using (20250721-203849) had the old code without fixes. Use the new package (20250721-214854) which includes:

- ✅ All TypeScript fixes
- ✅ React Query v5 compatibility
- ✅ Proper type definitions
- ✅ Fixed test files
- ✅ Mac-specific deployment script

## Requirements

- macOS (tested on Mac mini)
- Node.js 18+ (download from nodejs.org)
- Docker Desktop (download from docker.com)
- 4GB RAM minimum
- 2GB free disk space

## Troubleshooting

### Docker not running
```bash
open -a Docker
# Wait for Docker to start, then run deployment again
```

### Port 5432 in use
The deployment automatically uses port 5433 to avoid conflicts.

### Permission denied
```bash
chmod +x deploy-mac-mini.sh
chmod +x setup.sh
chmod +x setup-with-deps.sh
```

## Success Indicators

When deployment is successful, you'll see:
- ✅ All requirements met!
- ✅ TypeScript fixes applied!
- ✅ Database is ready!
- ✅ Dependencies installed!
- ✅ Application built!
- ✅ Setup Complete!

Then you can access:
- Frontend: http://localhost:3000
- API: http://localhost:3002
- Database: localhost:5433