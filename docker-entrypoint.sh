#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paths to SSL certificate and key
SSL_CERTIFICATE=${SSL_CERTIFICATE:-/etc/ssl/certs/self-signed.crt}
SSL_CERTIFICATE_KEY=${SSL_CERTIFICATE_KEY:-/etc/ssl/private/self-signed.key}

# Function to check if SSL certificates exist
check_ssl_certificates() {
  # Ensure the directories for certificates exist
  if [[ ! -d "/etc/ssl/certs" ]]; then
    echo -e "${YELLOW}Creating directory: /etc/ssl/certs${NC}"
    mkdir -p /etc/ssl/certs
  fi
  if [[ ! -d "/etc/ssl/private" ]]; then
    echo -e "${YELLOW}Creating directory: /etc/ssl/private${NC}"
    mkdir -p /etc/ssl/private
  fi

  if [[ ! -f "$SSL_CERTIFICATE" || ! -f "$SSL_CERTIFICATE_KEY" ]]; then
    echo -e "${YELLOW}SSL certificates not found. Generating self-signed certificates...${NC}"
    bash /scripts/generate-ssl-cert.sh
  else
    echo -e "${GREEN}SSL certificates found at:${NC}"
    echo -e "${GREEN}  Certificate: ${SSL_CERTIFICATE}${NC}"
    echo -e "${GREEN}  Key: ${SSL_CERTIFICATE_KEY}${NC}"
  fi
}

# Replace environment variables in Nginx configuration
configure_nginx() {
  echo -e "${GREEN}Configuring Nginx...${NC}"
  envsubst '${DOMAIN} ${PROXY_READ_TIMEOUT} ${PROXY_CONNECT_TIMEOUT} ${SSL_CERTIFICATE} ${SSL_CERTIFICATE_KEY}' \
    < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

  # Update Nginx worker settings
  sed -i "s/worker_processes.*$/worker_processes ${NGINX_WORKER_PROCESSES};/" /etc/nginx/nginx.conf
  sed -i "s/worker_connections.*$/worker_connections ${NGINX_WORKER_CONNECTIONS};/" /etc/nginx/nginx.conf
}

# Main script execution
main() {
  echo -e "${GREEN}Starting Docker entrypoint script...${NC}"

  # Check and generate SSL certificates if necessary
  check_ssl_certificates

  # Configure Nginx
  configure_nginx

  # Start Nginx
  echo -e "${GREEN}Starting Nginx...${NC}"
  exec "$@"
}

# Run the main function
main "$@"