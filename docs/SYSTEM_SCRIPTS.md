# Contract Manager System Scripts

Easy-to-use scripts for managing your Contract Manager system.

## Available Scripts

### 🚀 Start System
```bash
npm run start
# or
./start.sh
```
- Starts both frontend and backend servers
- Checks for port conflicts
- Installs dependencies if needed
- Creates necessary directories
- Frontend: http://localhost:3000
- Backend: http://localhost:3002

### 🛑 Stop System
```bash
npm run stop
# or
./stop.sh
```
- Gracefully stops all running processes
- Cleans up any remaining processes
- Frees up ports 3000 and 3002

### 🔄 Restart System
```bash
npm run restart
# or
./restart.sh
```
- Stops the system completely
- Waits for cleanup
- Starts the system fresh

### 📊 Check Status
```bash
npm run status
# or
./status.sh
```
- Shows current system status
- Displays running processes
- Shows memory and disk usage
- Provides quick links to all services

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run start` | Start the entire system |
| `npm run stop` | Stop the entire system |
| `npm run restart` | Restart the entire system |
| `npm run status` | Check system status |
| `npm run dev` | Start development mode only |
| `npm run build` | Build for production |
| `npm run install:all` | Install all dependencies |

## System URLs

- **Frontend (Customer Portal)**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/health
- **Customer Registration**: http://localhost:3000/customer-register
- **Admin Dashboard**: http://localhost:3000/

## Troubleshooting

### Port Already in Use
If you get port conflicts, use:
```bash
npm run stop
```
Then try starting again.

### Dependencies Issues
If you have dependency issues:
```bash
npm run install:all
```

### Database Connection Issues
Check your `.env` file has the correct `DATABASE_URL`

### Permission Issues
If scripts won't run:
```bash
chmod +x *.sh
```

## Development Tips

1. **Use `npm run status`** to check what's running
2. **Use `npm run restart`** when you make backend changes
3. **Use `npm run stop`** before switching branches
4. **Check the logs** if something isn't working

## System Requirements

- Node.js 18 or higher
- PostgreSQL database
- 2GB+ RAM recommended
- Ports 3000 and 3002 available

## File Structure

```
Contract_Manager/
├── start.sh         # Start system script
├── stop.sh          # Stop system script  
├── restart.sh       # Restart system script
├── status.sh        # Status check script
├── package.json     # Root package configuration
├── client/          # React frontend
├── server/          # Node.js backend
└── README.md        # This file
```

## Support

If you encounter issues:
1. Check `npm run status` for system health
2. Look at the console logs for errors
3. Try `npm run restart` to reset everything
4. Check the database connection with the health endpoint