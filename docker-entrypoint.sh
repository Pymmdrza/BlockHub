#!/bin/bash
set -e

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

# Validate required environment variables
validate_env_vars() {
    if [[ -z "$DOMAIN" ]]; then
        echo "Error: DOMAIN environment variable is not set"
        exit 1
    fi

    if [[ -z "$ADMIN_EMAIL" ]]; then
        echo "Error: ADMIN_EMAIL environment variable is not set"
        exit 1
    fi
}

# Main function
main() {
    echo "Starting BlockHub..."
    validate_env_vars
    
    if check_ssl_setting; then
        echo "Running setup with SSL..."
        exec /usr/share/nginx/setup_with_ssl.sh
    else
        echo "Running setup without SSL..."
        exec /usr/share/nginx/setup_without_ssl.sh
    fi
}

# Run main function
main