#!/bin/bash
set -e

# Function to validate domain
validate_domain() {
    if [[ -z "$DOMAIN" ]]; then
        echo "Error: DOMAIN is not set"
        exit 1
    fi
}

# Function to validate email
validate_email() {
    if [[ -z "$ADMIN_EMAIL" ]]; then
        echo "Error: ADMIN_EMAIL is not set"
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

# Function to wait for nginx to be ready
wait_for_nginx() {
    echo "Waiting for Nginx to be ready..."
    while ! nc -z localhost 80; do
        sleep 1
    done
    echo "Nginx is ready"
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
    echo "Configuring Nginx with SSL..."
    envsubst '${DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
}

# Function to setup auto-renewal
setup_auto_renewal() {
    echo "Setting up SSL auto-renewal..."
    echo "0 0 * * * certbot renew --quiet" | crontab -
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
    
    # Setup auto-renewal
    setup_auto_renewal
    
    # Start nginx
    echo "Starting Nginx..."
    nginx -g 'daemon off;'
}

# Run main function
main
