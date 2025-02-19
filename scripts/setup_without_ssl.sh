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

# Function to configure Nginx
configure_nginx() {
    echo "Configuring Nginx without SSL..."
    # Remove SSL-specific configuration
    sed -i '/listen 443/d' /etc/nginx/templates/default.conf.template
    sed -i '/ssl_/d' /etc/nginx/templates/default.conf.template
    
    # Apply configuration
    envsubst '${DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
}

# Main setup function
main() {
    echo "Starting setup without SSL..."
    
    # Validate domain
    validate_domain
    
    # Configure nginx
    configure_nginx
    
    # Start nginx
    echo "Starting Nginx..."
    nginx -g 'daemon off;'
}

# Run main function
main
