#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}BlockHub Docker Setup Script${NC}"
echo "This script will set up BlockHub using Docker."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Ask for environment configuration
echo -e "\n${YELLOW}Environment Configuration${NC}"
read -p "Domain name (default: localhost): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

read -p "Port (default: 80): " PORT
PORT=${PORT:-80}

read -p "Use production settings? (y/n, default: n): " USE_PROD
USE_PROD=${USE_PROD:-n}

# Create .env file
echo -e "\n${GREEN}Creating .env file...${NC}"
cat > .env << EOF
# Environment Configuration
DOMAIN=$DOMAIN
PORT=$PORT
VITE_API_BASE_URL=/api/v2
EOF

echo -e "${GREEN}Environment file created successfully.${NC}"

# Build Docker image
echo -e "\n${GREEN}Building Docker image...${NC}"
docker build -t blockhub .

# Run with Docker Compose
echo -e "\n${GREEN}Starting BlockHub with Docker Compose...${NC}"
if [[ "$USE_PROD" =~ ^[Yy]$ ]]; then
    docker-compose -f docker-compose.prod.yml up -d
else
    docker-compose up -d
fi

# Check if container is running
if docker ps | grep -q blockhub; then
    echo -e "\n${GREEN}BlockHub is now running!${NC}"
    echo -e "You can access it at: http://$DOMAIN:$PORT"
    echo -e "To stop BlockHub, run: docker-compose down"
    echo -e "To view logs, run: docker-compose logs -f"
else
    echo -e "\n${RED}Failed to start BlockHub. Please check the logs:${NC}"
    echo "docker-compose logs"
fi