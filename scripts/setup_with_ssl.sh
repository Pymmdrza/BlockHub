#!/bin/bash

# Set error handling
set -e

# Load environment variables
source .env

# Function to validate domain
validate_domain() {
    if [[ -z "$DOMAIN" ]]; then
        echo "Error: DOMAIN is not set in .env file"
        exit 1
    fi
}

# Function to validate email
validate_email() {
    if [[ -z "$ADMIN_EMAIL" ]]; then
        echo "Error: ADMIN_EMAIL is not set in .env file"
        exit 1
    fi
}

# Function to check if certbot is installed
check_certbot() {
    if ! command -v certbot &> /dev/null; then
        echo "Error: certbot is not installed"
        exit 1
    fi
}

# Function to obtain SSL certificate
obtain_ssl() {
    echo "Obtaining SSL certificate for $DOMAIN..."
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$ADMIN_EMAIL" \
        --domains "$DOMAIN" \
        --preferred-challenges http
}

# Function to configure Nginx
configure_nginx() {
    echo "Configuring Nginx..."
    envsubst '${DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
}

# Main setup function
main() {
    echo "Starting setup with SSL..."
    
    # Validate requirements
    validate_domain
    validate_email
    check_certbot
    
    # Stop nginx if running
    nginx -s stop || true
    
    # Get SSL certificate
    obtain_ssl
    
    # Configure nginx
    configure_nginx
    
    # Start nginx
    echo "Starting Nginx..."
    nginx -g 'daemon off;'
}

# Run main function
main