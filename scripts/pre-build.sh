#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Default paths for the certificate and key
CERT_DIR="./scripts/certs"
CERT_FILE="${CERT_DIR}/self-signed.crt"
KEY_FILE="${CERT_DIR}/self-signed.key"

# Certificate details
DAYS_VALID=365
SUBJECT="/C=US/ST=California/L=San Francisco/O=BlockHub/OU=Development/CN=localhost"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if OpenSSL is installed
check_openssl() {
  if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: OpenSSL is not installed. Please install it and try again.${NC}"
    exit 1
  fi
}

# Function to create the certificate directory if it doesn't exist
create_cert_dir() {
  if [ ! -d "$CERT_DIR" ]; then
    echo -e "${YELLOW}Creating certificate directory at ${CERT_DIR}...${NC}"
    mkdir -p "$CERT_DIR"
  fi
}

# Function to generate the self-signed certificate
generate_certificate() {
  if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}Certificate and key already exist at ${CERT_DIR}.${NC}"
    echo -e "${YELLOW}To regenerate, delete the existing files and rerun this script.${NC}"
    return
  fi

  echo -e "${GREEN}Generating self-signed SSL certificate...${NC}"
  openssl req -x509 -nodes -days "$DAYS_VALID" -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "$SUBJECT"

  echo -e "${GREEN}Certificate generated successfully!${NC}"
  echo -e "${GREEN}Certificate: ${CERT_FILE}${NC}"
  echo -e "${GREEN}Key: ${KEY_FILE}${NC}"
}

# Main script execution
main() {
  echo -e "${GREEN}Starting pre-build script to generate SSL certificates...${NC}"
  check_openssl
  create_cert_dir
  generate_certificate
  echo -e "${GREEN}Pre-build script completed successfully.${NC}"
}

# Run the main function
main
