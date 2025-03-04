# BlockHub Docker Commands

This document provides a list of useful Docker commands for managing your BlockHub deployment.

## Basic Commands

### Start BlockHub
```bash
# Development mode
docker-compose up -d

# Production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Stop BlockHub
```bash
# Development mode
docker-compose down

# Production mode
docker-compose -f docker-compose.prod.yml down
```

### View Logs
```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Rebuild and Restart
```bash
# Rebuild the image and restart containers
docker-compose up -d --build
```

## Maintenance Commands

### Check Container Status
```bash
docker ps
```

### Check Container Health
```bash
docker inspect --format='{{.State.Health.Status}}' blockhub
```

### Enter Container Shell
```bash
docker exec -it blockhub /bin/sh
```

### View Nginx Configuration
```bash
docker exec -it blockhub cat /etc/nginx/conf.d/default.conf
```

### Test Nginx Configuration
```bash
docker exec -it blockhub nginx -t
```

### Reload Nginx Configuration
```bash
docker exec -it blockhub nginx -s reload
```

## Backup and Restore

### Backup SSL Certificates
```bash
mkdir -p ./backups
tar -czvf ./backups/ssl-$(date +%Y%m%d).tar.gz ./ssl
```

### Backup Environment Variables
```bash
cp .env ./backups/.env-$(date +%Y%m%d)
```

## Troubleshooting

### Check Nginx Logs
```bash
docker exec -it blockhub cat /var/log/nginx/error.log
```

### Check Container Resource Usage
```bash
docker stats blockhub
```

### Restart Container
```bash
docker restart blockhub
```

### Force Remove Container
```bash
docker rm -f blockhub
```

### Clean Up Docker System
```bash
# Remove unused containers, networks, images
docker system prune -a
```
