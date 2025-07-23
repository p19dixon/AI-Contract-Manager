# Port Conflict Resolution Guide

## Common Port Conflicts

### PostgreSQL Port 5432/5433 Already in Use

If you see an error like:
```
Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:5432 -> 127.0.0.1:0: listen tcp 0.0.0.0:5432: bind: address already in use
```

This means the PostgreSQL port is already being used by another service.

### Solutions

#### Option 1: Use Our Pre-configured Alternative Port (Recommended)

We've already configured the deployment to use port 5433 instead of the default 5432. This should work in most cases.

#### Option 2: Find and Stop the Conflicting Service

1. **Find what's using the port:**
   ```bash
   # On macOS/Linux
   lsof -i :5432
   
   # On Windows
   netstat -ano | findstr :5432
   ```

2. **If it's another Docker container:**
   ```bash
   docker ps | grep 5432
   docker stop <container_name>
   ```

3. **If it's a local PostgreSQL installation:**
   ```bash
   # On macOS (using Homebrew)
   brew services stop postgresql
   
   # On Linux
   sudo systemctl stop postgresql
   
   # On Windows
   net stop postgresql-x64-13  # Version number may vary
   ```

#### Option 3: Use a Different Port

1. Edit `docker-compose.yml`:
   ```yaml
   ports:
     - "5434:5432"  # Change 5434 to any available port
   ```

2. Update `.env` file:
   ```
   DATABASE_URL=postgresql://contracts_user:contracts_pass@localhost:5434/contracts_db
   ```

### Other Port Conflicts

#### Frontend Port 3000
If port 3000 is in use:

1. Edit `client/vite.config.ts`:
   ```typescript
   server: {
     port: 3001,  // Or any available port
     // ... rest of config
   }
   ```

2. Update any references to `http://localhost:3000`

#### Backend Port 3002
If port 3002 is in use:

1. Edit `.env`:
   ```
   PORT=3003  # Or any available port
   ```

2. Update `client/vite.config.ts` proxy configuration:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:3003',
       // ... rest of config
     }
   }
   ```

### Checking Available Ports

To find an available port:

```bash
# macOS/Linux
nc -z localhost 5433 || echo "Port 5433 is available"

# Or check a range
for port in {5432..5440}; do
  nc -z localhost $port || echo "Port $port is available"
done
```

### Docker-specific Solutions

#### Reset Docker containers and volumes:
```bash
cd deployment
docker-compose down -v  # Remove containers and volumes
docker-compose up -d    # Start fresh
```

#### Use Docker's internal networking:
If you only need database access from the application (not from host tools):

1. Remove the ports section from `docker-compose.yml`
2. Update `DATABASE_URL` to use the container name:
   ```
   DATABASE_URL=postgresql://contracts_user:contracts_pass@contracts_db:5432/contracts_db
   ```

### Prevention Tips

1. **Always check ports before deployment:**
   ```bash
   ./deployment/scripts/check-ports.sh  # We could create this
   ```

2. **Use environment variables for all ports:**
   ```bash
   DB_PORT=5433
   FRONTEND_PORT=3000
   BACKEND_PORT=3002
   ```

3. **Document your port usage:**
   Keep a list of all ports used by your applications

### Still Having Issues?

If you continue to have port conflicts:

1. List all listening ports:
   ```bash
   # macOS/Linux
   sudo lsof -i -P | grep LISTEN
   
   # Windows
   netstat -an | findstr LISTENING
   ```

2. Consider using a different approach:
   - Use Docker networks without exposing ports
   - Use a reverse proxy like nginx
   - Deploy to a cloud service

3. Check for zombie processes:
   ```bash
   ps aux | grep -E "(postgres|node|docker)"
   ```

Remember: The deployment has been pre-configured to use port 5433 for PostgreSQL to avoid the most common conflict!