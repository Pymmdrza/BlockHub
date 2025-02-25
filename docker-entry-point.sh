#!/bin/sh
set -e

# Replace environment variables in nginx config
envsubst '${DOMAIN} ${PROXY_READ_TIMEOUT} ${PROXY_CONNECT_TIMEOUT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Update nginx worker settings
sed -i "s/worker_processes.*$/worker_processes ${NGINX_WORKER_PROCESSES};/" /etc/nginx/nginx.conf
sed -i "s/worker_connections.*$/worker_connections ${NGINX_WORKER_CONNECTIONS};/" /etc/nginx/nginx.conf

# Start nginx
exec "$@"