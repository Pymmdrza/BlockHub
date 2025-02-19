#!/bin/sh
set -e

# Substitute environment variables in the Nginx configuration template
envsubst '$DOMAIN' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx in the foreground
exec nginx -g 'daemon off;'
