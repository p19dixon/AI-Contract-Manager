# Complete Deployment Guide

## Quick Deploy Options

### 1. Local/VPS Deployment (Using Package)
```bash
# Use the pre-built deployment package
scp deployment/contracts-saas-deployment-*.tar.gz user@server:/deploy/
ssh user@server
cd /deploy
tar -xzf contracts-saas-deployment-*.tar.gz
cd contracts-saas-deployment-*/deployment
./setup-with-deps.sh
```

### 2. Docker Deployment (Recommended)
```bash
# Create .env file with your settings
cp .env.example .env
vi .env  # Edit with your values

# Build and run with Docker Compose
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

### 3. Cloud Platform Deployment

#### Heroku
```bash
# Install Heroku CLI
# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secret
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

#### Railway
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Add PostgreSQL service
4. Set environment variables
5. Deploy

#### AWS EC2
```bash
# Launch EC2 instance (Ubuntu 22.04)
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Copy deployment package
scp -i your-key.pem contracts-saas-deployment-*.tar.gz ubuntu@your-instance:/home/ubuntu/

# Extract and deploy
tar -xzf contracts-saas-deployment-*.tar.gz
cd contracts-saas-deployment-*/deployment
sudo ./setup.sh
```

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Server
PORT=3002
NODE_ENV=production

# Security
SESSION_SECRET=generate-a-long-random-string
JWT_SECRET=another-long-random-string

# Frontend
FRONTEND_URL=https://yourdomain.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Nginx
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Using Cloudflare (Recommended)
1. Add your domain to Cloudflare
2. Update DNS to point to your server
3. Enable "Full (strict)" SSL mode
4. Use Cloudflare's Origin Certificate

## Database Deployment

### Option 1: Managed Database (Recommended)
- **Neon**: [neon.tech](https://neon.tech) - Serverless PostgreSQL
- **Supabase**: [supabase.com](https://supabase.com) - PostgreSQL with extras
- **AWS RDS**: Enterprise-grade PostgreSQL
- **DigitalOcean**: Managed PostgreSQL clusters

### Option 2: Self-Hosted
Use the included PostgreSQL container, but ensure:
- Regular backups
- Persistent volume
- Security hardening

## Monitoring & Maintenance

### Health Checks
```bash
# API health
curl http://your-domain.com/api/health

# Database health
docker exec contracts_db pg_isready

# Check logs
docker logs contracts_app
docker logs contracts_db
```

### Backups
```bash
# Backup database
docker exec contracts_db pg_dump -U contracts_user contracts_db > backup-$(date +%Y%m%d).sql

# Restore database
docker exec -i contracts_db psql -U contracts_user contracts_db < backup.sql
```

### Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use HTTPS everywhere
- [ ] Set secure environment variables
- [ ] Enable firewall (allow only 80, 443, 22)
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Monitor logs for suspicious activity
- [ ] Rate limiting enabled
- [ ] CORS properly configured

## Troubleshooting

### Port already in use
```bash
# Find process using port
sudo lsof -i :3002
# Kill process
sudo kill -9 <PID>
```

### Database connection issues
```bash
# Check if database is running
docker ps | grep postgres
# Check database logs
docker logs contracts_db
# Test connection
docker exec -it contracts_db psql -U contracts_user
```

### Permission errors
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
# Log out and back in
```

## Performance Optimization

### Frontend
- Enable gzip compression in Nginx
- Use CDN for static assets
- Enable browser caching

### Backend
- Use PM2 for process management
- Enable Node.js clustering
- Add Redis for session storage

### Database
- Add indexes for frequent queries
- Use connection pooling
- Regular VACUUM and ANALYZE

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple app instances
- Read replicas for database

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use caching layer (Redis)

## Support

For deployment issues:
1. Check logs: `docker logs <container>`
2. Review environment variables
3. Ensure all ports are accessible
4. Check database connectivity