# Deployment Instructions

You have successfully created a deployment package for the Contracts SaaS application!

## Package Created

**Updated Package**: `contracts-saas-deployment-20250721-203849.tar.gz` (556K)

This updated package contains:
- Complete source code for client and server
- Database setup scripts with port 5433 (to avoid conflicts)
- Docker configuration
- Setup automation scripts
- Enhanced documentation including PORT_CONFLICT_GUIDE.md
- Dependency checking with setup-with-deps.sh

## Deployment Steps

### 1. Transfer the Package

Copy the `.tar.gz` file to your target server using your preferred method:
```bash
# Using SCP
scp contracts-saas-deployment-*.tar.gz user@server:/path/to/destination

# Using SFTP, rsync, or any file transfer method
```

### 2. Extract the Package

On the target server:
```bash
tar -xzf contracts-saas-deployment-20250721-203849.tar.gz
cd contracts-saas-deployment-20250721-203849
```

### 3. Run Setup

Navigate to the deployment directory and run the enhanced setup:
```bash
cd deployment
./setup-with-deps.sh
```

This will:
- Check if Docker and Node.js are installed
- Guide you through installation if needed
- Set up the PostgreSQL database
- Install all dependencies
- Build the application
- Create convenience scripts

### 4. Configure the Application

Edit the `.env` file in the root directory:
```bash
cd ..
vi .env  # or nano, or your preferred editor
```

Update at minimum:
- `DATABASE_URL` (if using external database)
- `SESSION_SECRET` (generate a secure random string)
- Any other environment-specific settings

### 5. Start the Application

```bash
./start.sh
```

### 6. Access the Application

- Frontend: http://localhost:3000 (or your configured port)
- Backend API: http://localhost:3002 (or your configured port)

Default admin credentials:
- Email: admin@caplocations.com
- Password: admin123

**⚠️ IMPORTANT: Change the admin password immediately after first login!**

## Creating a Package with Installers

If you need to deploy to a machine without Docker/Node.js and without internet:

1. First download the installers:
   ```bash
   ./download-installers.sh
   ```

2. Create package with installers:
   ```bash
   ./create-package.sh --with-installers
   ```

This creates a much larger package (~500+ MB) that includes all installers.

## Quick Reference

### Management Scripts
- `./start.sh` - Start all services
- `./stop.sh` - Stop all services
- `./status.sh` - Check service status

### Database Commands
- View logs: `docker logs -f contracts_db`
- Connect to DB: `docker exec -it contracts_db psql -U contracts_user -d contracts_db`
- Backup: `docker exec contracts_db pg_dump -U contracts_user contracts_db > backup.sql`

### Troubleshooting
- Port conflicts: Check `.env` and `docker-compose.yml`
- Permission issues: Ensure Docker is accessible
- Database issues: Check Docker logs

## Next Steps

1. Set up SSL/TLS for production
2. Configure backups
3. Set up monitoring
4. Review security settings
5. Configure firewall rules

For detailed instructions, see:
- `deployment/README.md` - General deployment guide
- `deployment/INSTALLATION_GUIDE.md` - Step-by-step installation
- `deployment/PACKAGE_README.md` - Package options explained