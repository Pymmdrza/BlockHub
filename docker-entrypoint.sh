#!/bin/bash
set -e

# Source environment variables
source .env

# Function to check SSL setting
check_ssl_setting() {
    if [[ "${USE_SSL,,}" == "true" ]]; then
        echo "SSL is enabled"
        return 0
    else
        echo "SSL is disabled"
        return 1
    fi
}

# Main function
main() {
    if check_ssl_setting; then
        echo "Running setup with SSL..."
        exec /scripts/setup_with_ssl.sh
    else
        echo "Running setup without SSL..."
        exec /scripts/setup_without_ssl.sh
    fi
}

# Run main function
main
