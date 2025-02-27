#!/bin/bash
set -euo pipefail

echo "USE_SSL: ${USE_SSL}"
echo "DOMAIN: ${DOMAIN}"

# Function to check SSL setting
check_ssl_setting() {
    if [[ "${USE_SSL,,}" == "true" ]]; then
        echo "SSL is enabled"
        /usr/share/nginx/setup_with_ssl.sh "${DOMAIN}"
    else
        echo "SSL is disabled"
        /usr/share/nginx/setup_without_ssl.sh
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
check_ssl_setting

exec nginx -g "daemon off;"