#!/bin/bash

# SSL Setup Script for BlockHub
# Usage: ./ssl-setup.sh yourdomain.com

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Error: Please provide a domain name."
    echo "Usage: ./ssl-setup.sh yourdomain.com"
    exit 1
fi

DOMAIN=$1

# Create required directories
mkdir -p ./ssl
mkdir -p ./certbot/www
mkdir -p ./certbot/conf

# Update .env file with domain
if [ -f .env ]; then
    # Check if DOMAIN is already set in .env
    if grep -q "DOMAIN=" .env; then
        # Replace existing DOMAIN line
        sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env
    else
        # Add DOMAIN line if it doesn't exist
        echo "DOMAIN=$DOMAIN" >> .env
    fi
else
    # Create .env file if it doesn't exist
    cp .env.example .env
    sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env
fi

echo "Setting up SSL for $DOMAIN..."

# Create temporary nginx config for certbot
cat > ./nginx-temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'SSL setup in progress. Please wait...';
        add_header Content-Type text/plain;
    }
}
EOF

# Start temporary nginx container for certbot verification
echo "Starting temporary nginx for domain verification..."
docker run --name nginx-temp -v $(pwd)/nginx-temp.conf:/etc/nginx/conf.d/default.conf \
    -v $(pwd)/certbot/www:/var/www/certbot \
    -p 80:80 -d nginx:alpine

# Wait for nginx to start
sleep 5

# Run certbot to obtain SSL certificate
echo "Obtaining SSL certificate for $DOMAIN..."
docker run --rm -v $(pwd)/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/certbot/www:/var/www/certbot \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN --agree-tos --no-eff-email \
    -d $DOMAIN

# Stop and remove temporary nginx container
echo "Stopping temporary nginx..."
docker stop nginx-temp
docker rm nginx-temp
rm nginx-temp.conf

# Check if certificate was obtained successfully
if [ -d "./certbot/conf/live/$DOMAIN" ]; then
    echo "SSL certificate obtained successfully!"
    echo "Starting BlockHub with SSL..."
    docker-compose -f docker-compose.ssl.yml up -d
    echo "BlockHub is now running with SSL at https://$DOMAIN"
else
    echo "Failed to obtain SSL certificate. Please check your domain configuration and try again."
    exit 1
fi 