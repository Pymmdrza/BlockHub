#!/bin/bash

# Set error handling
set -e

# Load environment variables
source /usr/share/nginx/.env

# Function to wait for a service to be ready
wait_for_service() {
    local service=$1
    local port=$2
    echo "Waiting for $service to be ready..."
    while ! nc -z localhost $port; do
        sleep 1
    done
    echo "$service is ready!"
}

# Function to setup SSL
setup_ssl() {
    if [ "$USE_SSL" = "true" ]; then
        echo "Setting up SSL..."
        /usr/share/nginx/setup_with_ssl.sh
    else
        echo "Setting up without SSL..."
        /usr/share/nginx/setup_without_ssl.sh
    fi
}

# Main function
main() {
    # Setup nginx configuration
    setup_ssl
    
    # Start nginx in background
    nginx -g 'daemon off;' &
    
    # Wait for nginx to start
    wait_for_service "Nginx" 80
    
    # Show welcome message
    /usr/share/nginx/welcome.sh
    
    # Keep container running and handle signals properly
    while true; do
        sleep 1 & wait $!
    done
}

# Run main function
main 