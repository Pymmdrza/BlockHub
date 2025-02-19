#!/bin/bash
set -e

# Function to validate environment variables
validate_env() {
    local required_vars=("DOMAIN" "ADMIN_EMAIL")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "Error: The following required environment variables are missing:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
}

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

# Function to setup environment
setup_environment() {
    # Create nginx configuration from template
    envsubst '${DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
}

# Main function
main() {
    echo "Starting BlockHub setup..."
    
    # Validate environment variables
    validate_env
    
    # Setup environment
    setup_environment
    
    # Check SSL setting and run appropriate setup
    if check_ssl_setting; then
        echo "Running setup with SSL..."
        exec ./scripts/setup_with_ssl.sh
    else
        echo "Running setup without SSL..."
        exec ./scripts/setup_without_ssl.sh
    fi
}

# Run main function
main
