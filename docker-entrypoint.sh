#!/bin/bash
set -euo pipefail

echo "USE_SSL: ${USE_SSL}"
echo "DOMAIN: ${DOMAIN}"
echo "ADMIN_EMAIL: ${ADMIN_EMAIL}"


obtain_ssl() {
    echo "Obtaining SSL certificate for $DOMAIN..."
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$ADMIN_EMAIL" \
        --domains "$DOMAIN" \
        --preferred-challenges http
}

obtaint_without_ssl() {
    echo "Configuring Nginx without SSL..."
    # Remove SSL-specific configuration
    sed -i '/listen 443/d' /etc/nginx/templates/default.conf.template
    sed -i '/ssl_/d' /etc/nginx/templates/default.conf.template
    
    # Apply configuration
    envsubst '${DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
}
# Function to configure Nginx
configure_nginx() {
    echo "Configuring Nginx..."
    envsubst '${DOMAIN}' < /etc/nginx/templates/default.conf > /etc/nginx/conf.d/default.conf
}

# Function to check SSL setting
check_ssl_setting() {
    if [[ "${USE_SSL,,}" == "true" ]]; then
        echo "SSL is enabled"
        obtain_ssl
        configure_nginx
    else
        echo "SSL is disabled"
        obtaint_without_ssl

    fi
}

# Main function
check_ssl_setting

exec nginx -g "daemon off;"