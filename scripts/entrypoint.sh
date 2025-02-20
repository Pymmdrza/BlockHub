#!/bin/bash
set -e

# Check if certificate exists, if not generate a self-signed certificate
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  echo "Certificate not found, generating self-signed certificate..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -subj "/CN=$DOMAIN" \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem"
fi

# Substitute environment variables in nginx config template and create final config
envsubst '$DOMAIN $VITE_API_BASE_URL $ADMIN_EMAIL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx in foreground
nginx -g 'daemon off;'
