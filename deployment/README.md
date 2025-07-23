# Contracts SaaS Deployment Package

This deployment package allows you to install and run the Contracts SaaS application locally with a PostgreSQL database.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (includes Docker and Docker Compose)
  - macOS/Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Linux: [Install Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 18+** and npm
  - Download from [nodejs.org](https://nodejs.org/)
- **Git** (optional, for cloning the repository)

## Quick Start

1. **Navigate to the deployment directory:**
   ```bash
   cd deployment
   ```

2. **Run the setup script:**
   
   **Option A - Enhanced setup (checks and helps install dependencies):**
   ```bash
   ./setup-with-deps.sh
   ```
   
   **Option B - Standard setup (assumes dependencies are installed):**
   ```bash
   ./setup.sh
   ```

   The setup will:
   - Check all requirements
   - Help install missing dependencies (enhanced setup only)
   - Start a PostgreSQL database in Docker
   - Install all dependencies
   - Build the application
   - Create convenience scripts

3. **Configure the application:**
   Edit the `.env` file in the root directory with your settings:
   ```bash
   cd ..
   nano .env  # or use your preferred editor
   ```

4. **Start the application:**
   ```bash
   ./start.sh
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3002
   - Database: localhost:5433 (Note: Using port 5433 to avoid conflicts with existing PostgreSQL installations)

## Default Credentials

- **Admin User:**
  - Email: `admin@caplocations.com`
  - Password: `admin123`
  
  ⚠️ **Important:** Change the admin password after first login!

## Directory Structure

```
deployment/
├── docker-compose.yml    # PostgreSQL container configuration
├── database/
│   ├── init.sql         # Database initialization
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Sample data
├── config/
│   └── .env.template    # Environment configuration template
├── scripts/
│   └── (generated)      # Generated convenience scripts
└── README.md            # This file
```

## Convenience Scripts

After running setup, you'll have these scripts in the root directory:

- **`./start.sh`** - Start all services (database, server, client)
- **`./stop.sh`** - Stop all services
- **`./status.sh`** - Check the status of all services

## Manual Setup (Alternative)

If you prefer to set up manually or the script fails:

### 1. Start the Database

```bash
cd deployment
docker-compose up -d
```

### 2. Configure Environment

```bash
cp deployment/config/.env.template .env
# Edit .env with your settings
```

### 3. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 4. Run the Application

In separate terminals:

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

## Database Management

### Connect to PostgreSQL

```bash
docker exec -it contracts_db psql -U contracts_user -d contracts_db
```

### Backup Database

```bash
docker exec contracts_db pg_dump -U contracts_user contracts_db > backup.sql
```

### Restore Database

```bash
docker exec -i contracts_db psql -U contracts_user contracts_db < backup.sql
```

### Reset Database

```bash
cd deployment
docker-compose down -v  # This removes the volume
docker-compose up -d    # Recreates with fresh data
```

## Troubleshooting

### Port Conflicts

If you get port conflicts:

1. **Database (5432):** Edit `docker-compose.yml` and change the port mapping
2. **Server (3002):** Edit `.env` and change `PORT`
3. **Client (3000):** Edit `client/vite.config.ts` and change the port

### Database Connection Issues

1. Ensure Docker is running
2. Check if the container is running: `docker ps`
3. Check logs: `docker logs contracts_db`
4. Verify connection string in `.env`

### Permission Issues

On Linux, you might need to run Docker commands with `sudo` or add your user to the docker group:

```bash
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect
```

## Production Deployment

For production deployment:

1. Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
2. Update the `DATABASE_URL` in `.env`
3. Use proper secrets management
4. Enable SSL/TLS
5. Set up proper backup strategies
6. Use a process manager like PM2 for the Node.js server
7. Deploy the frontend to a CDN or static hosting service

## Security Notes

1. Change all default passwords immediately
2. Use strong, unique passwords
3. Keep the `.env` file secure and never commit it to version control
4. Use HTTPS in production
5. Implement proper firewall rules
6. Regular security updates

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Check Docker container logs
4. Ensure all prerequisites are properly installed

## License

This deployment package is part of the Contracts SaaS application.
© 2024 CAP Locations. All rights reserved.