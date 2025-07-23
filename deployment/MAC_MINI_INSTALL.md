# Mac Mini Installation Package

## 🎯 One-Line Install

```bash
tar -xzf contracts-saas-deployment-20250721-224020.tar.gz && cd contracts-saas-deployment-20250721-224020 && ./deployment/mac-installer.sh
```

## 📦 What You Have

**Package**: `contracts-saas-deployment-20250721-224020.tar.gz` (2.2MB)

This package contains:
- ✅ All source code with TypeScript fixes applied
- ✅ Database setup with PostgreSQL on port 5433
- ✅ Mac-specific installer script
- ✅ All dependencies defined
- ✅ Pre-configured for Mac mini

## 🚀 Installation Steps

### 1. Extract the Package
```bash
tar -xzf contracts-saas-deployment-20250721-224020.tar.gz
cd contracts-saas-deployment-20250721-224020
```

### 2. Run the Mac Installer
```bash
./deployment/mac-installer.sh
```

This will:
- Check for Node.js and Docker
- Set up the PostgreSQL database
- Install all dependencies
- Build the application
- Create start/stop scripts

### 3. Start the Application
```bash
./start.sh
```

### 4. Access Your Application
- Frontend: http://localhost:3000
- API: http://localhost:3002
- Database: localhost:5433

## 📋 Requirements

Before installing, make sure you have:
- macOS (tested on Mac mini)
- Node.js 18+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop/))

## 🛠️ What Gets Installed

1. **PostgreSQL Database** (in Docker container)
   - Port: 5433 (to avoid conflicts)
   - User: contracts_user
   - Database: contracts_db

2. **Backend Server** (Node.js/Express)
   - Port: 3002
   - API endpoints for all operations

3. **Frontend Client** (React/Vite)
   - Port: 3000
   - Modern UI with Tailwind CSS

4. **Convenience Scripts**
   - `./start.sh` - Start all services
   - `./stop.sh` - Stop all services
   - `./status.sh` - Check what's running

## 🔧 Configuration

After installation, edit the `.env` file:
```bash
vi .env
```

Key settings:
- `DATABASE_URL` - Already configured for local PostgreSQL
- `SESSION_SECRET` - Change to a random string
- `JWT_SECRET` - Change to a random string

## 📱 Default Login

- Email: `admin@caplocations.com`
- Password: `admin123`

**Important**: Change the admin password after first login!

## 🚨 Troubleshooting

### If Docker isn't running:
```bash
open -a Docker
# Wait 30 seconds for Docker to start
./deployment/mac-installer.sh
```

### If ports are in use:
The installer uses port 5433 for PostgreSQL to avoid conflicts.

### Check what's running:
```bash
./status.sh
```

### View logs:
```bash
tail -f logs/*.log
```

## 📦 Package Contents

```
contracts-saas-deployment-20250721-224020/
├── client/          # React frontend (with all TypeScript fixes)
├── server/          # Node.js backend
├── deployment/      # Deployment scripts
│   ├── mac-installer.sh    # Mac-specific installer
│   ├── docker-compose.yml  # Database configuration
│   └── database/           # Schema and seed data
├── package.json
└── package-lock.json
```

## 🎉 Success!

When installation completes, you'll see:
```
========================================
   ✅ Installation Complete!
========================================
```

Then just run `./start.sh` and your application is ready!

## 💡 Tips

- The installer is idempotent - you can run it multiple times safely
- All data is persisted in Docker volumes
- Logs are saved in the `logs/` directory
- The database runs on port 5433 to avoid conflicts

## 🆘 Support

If you encounter issues:
1. Check `./status.sh` to see what's running
2. Look at logs in `logs/` directory
3. Ensure Docker Desktop is running
4. Try `./stop.sh` then `./start.sh`