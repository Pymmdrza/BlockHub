#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Default paths for the certificate and key
CERT_DIR="./certs"
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
  echo -e "${GREEN}Starting SSL certificate generation script...${NC}"
  check_openssl
  create_cert_dir
  generate_certificate
  echo -e "${GREEN}Done.${NC}"
}

# Run the main function
main
```

### Explanation of the Code:
1. **Script Setup**:
   - The script uses `set -e` to exit immediately if any command fails.
   - Default paths for the certificate and key are defined in the `CERT_DIR`, `CERT_FILE`, and `KEY_FILE` variables.

2. **Certificate Details**:
   - The certificate is valid for 365 days.
   - The `SUBJECT` variable defines the certificate's metadata (country, state, organization, etc.).

3. **Functions**:
   - `check_openssl`: Ensures that OpenSSL is installed on the system.
   - `create_cert_dir`: Creates the directory for storing certificates if it doesn't already exist.
   - `generate_certificate`: Generates the self-signed certificate and key using OpenSSL. It checks if the files already exist to avoid overwriting them.

4. **Main Execution**:
   - The `main` function orchestrates the script's execution by calling the helper functions in sequence.

5. **User Feedback**:
   - The script provides clear feedback to the user using colored output (green for success, yellow for warnings, red for errors).

6. **Idempotency**:
   - The script checks if the certificate and key already exist. If they do, it informs the user and exits without overwriting the files.

### Output Example:
When the script is run, the output might look like this:
```
Starting SSL certificate generation script...
Creating certificate directory at ./certs...
Generating self-signed SSL certificate...
Certificate generated successfully!
Certificate: ./certs/self-signed.crt
Key: ./certs/self-signed.key
Done.
```

If the certificate already exists:
```
Starting SSL certificate generation script...
Certificate and key already exist at ./certs.
To regenerate, delete the existing files and rerun this script.
Done.
