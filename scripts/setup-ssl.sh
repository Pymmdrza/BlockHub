#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Print colored message
print_message() {
    echo -e "${2}${1}${NC}"
}

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then 
    print_message "Please run as root (use sudo)" "$RED"
    exit 1
fi

# Load environment variables
load_env() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        print_message "Error: .env file not found" "$RED"
        exit 1
    fi
}

# Validate environment variables
validate_env() {
    if [ -z "$DOMAIN" ]; then
        print_message "Error: DOMAIN not set in .env file" "$RED"
        exit 1
    fi

    if [ -z "$ADMIN_EMAIL" ]; then
        print_message "Error: ADMIN_EMAIL not set in .env file" "$RED"
        exit 1
    fi

    # Validate domain format
    if [[ ! $DOMAIN =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
        print_message "Error: Invalid domain format in .env file" "$RED"
        exit 1
    fi

    # Validate email format
    if [[ ! $ADMIN_EMAIL =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        print_message "Error: Invalid email format in .env file" "$RED"
        exit 1
    fi
}

# Function to install packages based on the OS
install_packages() {
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y certbot python3-certbot-nginx nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y epel-release
        yum install -y certbot python3-certbot-nginx nginx
    else
        print_message "Unsupported operating system" "$RED"
        exit 1
    fi
}

# Function to setup SSL with auto-renewal
setup_ssl() {
    # Stop nginx temporarily
    systemctl stop nginx

    # Get SSL certificate
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$ADMIN_EMAIL" \
        --domains "$DOMAIN" \
        --preferred-challenges http

    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

    # Start nginx
    systemctl start nginx
}

# Main setup function
main() {
    print_message "Starting automatic SSL setup for BlockHub..." "$YELLOW"

    # Load and validate environment variables
    load_env
    validate_env

    # Install required packages
    print_message "Installing required packages..." "$YELLOW"
    install_packages

    # Setup SSL
    print_message "Setting up SSL certificate for $DOMAIN..." "$YELLOW"
    setup_ssl

    # Update nginx configuration
    print_message "Updating Nginx configuration..." "$YELLOW"
    cat > /etc/nginx/conf.d/blockhub.conf << EOL
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    root /usr/share/nginx/html;
    index index.html;

    # API proxy for Bitcoin data
    location /api/v2/ {
        proxy_pass https://btcbook.guarda.co/api/v2/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host btcbook.guarda.co;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        
        add_header 'Access-Control-Allow-Origin' 'https://$DOMAIN' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    }

    location /blockchain-api/ {
        proxy_pass https://blockchain.info/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host blockchain.info;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        
        add_header 'Access-Control-Allow-Origin' 'https://$DOMAIN' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location /assets {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
}
EOL

    # Update Docker Compose configuration
    print_message "Updating Docker configuration..." "$YELLOW"
    cat > docker-compose.prod.yml << EOL
version: '3.8'

services:
  blockhub:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: blockhub
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
      - DOMAIN=$DOMAIN
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - blockhub_network

networks:
  blockhub_network:
    driver: bridge
EOL

    # Restart Nginx
    systemctl restart nginx

    print_message "SSL setup completed successfully!" "$GREEN"
    print_message "Your site should now be accessible at: https://$DOMAIN" "$GREEN"
    print_message "SSL certificate will auto-renew every day at 12:00" "$GREEN"
}

# Run main function
main