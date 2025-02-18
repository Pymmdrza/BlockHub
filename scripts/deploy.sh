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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_message "Docker is not installed. Installing Docker..." "$YELLOW"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_message "Docker installed successfully!" "$GREEN"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_message "Docker Compose is not installed. Installing Docker Compose..." "$YELLOW"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_message "Docker Compose installed successfully!" "$GREEN"
fi

# Stop and remove existing containers
print_message "Stopping existing containers..." "$YELLOW"
docker-compose -f docker-compose.prod.yml down

# Build and start containers
print_message "Building and starting containers..." "$YELLOW"
docker-compose -f docker-compose.prod.yml up --build -d

# Check if containers are running
if [ $? -eq 0 ]; then
    print_message "BlockHub is now running!" "$GREEN"
    print_message "You can access it at: http://localhost:3000" "$GREEN"
else
    print_message "Error: Failed to start BlockHub" "$RED"
    exit 1
fi