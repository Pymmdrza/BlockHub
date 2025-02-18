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
}

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then 
    print_message "Please run as root (use sudo)" "$RED"
    exit 1
fi

# Load and validate environment variables
load_env
validate_env

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_message "Installing Docker..." "$YELLOW"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    print_message "Docker installed successfully!" "$GREEN"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_message "Installing Docker Compose..." "$YELLOW"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_message "Docker Compose installed successfully!" "$GREEN"
fi

# Run SSL setup if not already done
if [ ! -f /etc/nginx/conf.d/blockhub.conf ]; then
    print_message "Running SSL setup..." "$YELLOW"
    ./setup-ssl.sh
fi

# Deploy application
print_message "Deploying BlockHub to $DOMAIN..." "$YELLOW"

# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Build and start containers
docker-compose -f docker-compose.prod.yml up --build -d

if [ $? -eq 0 ]; then
    print_message "BlockHub deployed successfully!" "$GREEN"
    print_message "Your site should now be accessible at: https://$DOMAIN" "$GREEN"
else
    print_message "Error: Failed to deploy BlockHub" "$RED"
    exit 1
fi