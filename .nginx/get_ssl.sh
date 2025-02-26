#!/bin/sh

set -euo pipefail
IFS=$'\n\t'


if [ "$(id -u)" -ne 0 ]; then
    echo "Please run this script as root."
    exit 1
fi

SSL_DIR="/etc/nginx/ssl"
SSL_KEY="$SSL_DIR/nginx.key"
SSL_CRT="$SSL_DIR/nginx.crt"

if [ ! -d "$SSL_DIR" ]; then
    mkdir -p "$SSL_DIR"
fi

[ -f "$SSL_KEY" ] && rm -f "$SSL_KEY"
[ -f "$SSL_CRT" ] && rm -f "$SSL_CRT"

install_openssl() {
    if command -v openssl >/dev/null 2>&1; then
        echo "Openssl Installed to this machine."
    else
        echo "Openssl Not Installed to this machine. Installing..."
        if command -v apt-get >/dev/null 2>&1; then
            apt-get update && apt-get install -y openssl
        elif command -v yum >/dev/null 2>&1; then
            yum install -y openssl
        elif command -v apk >/dev/null 2>&1; then
            apk add --no-cache openssl
        else
            echo "Package manager not found."
            exit 1
        fi
    fi
}


create_ssl_directory() {
    if [ ! -d /etc/nginx/ssl ]; then
        echo "Creating SSL directory..."
        mkdir -p /etc/nginx/ssl
    fi
}

generate_ssl_cert() {
    local ssl_key=$SSL_KEY
    local ssl_crt=$SSL_CRT
    

    if [ -f "$ssl_key" ] || [ -f "$ssl_crt" ]; then
        echo "Found existing SSL files. Removing them..."
        rm -f "$ssl_key" "$ssl_crt"
    fi

    echo "Creating SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$ssl_key" \
        -out "$ssl_crt" \
        -subj "/CN=localhost"
    
    echo "Generated SSL certificate."
    echo "Key File: $ssl_key"
    echo "Certificate File: $ssl_crt"
}

main() {
    install_openssl
    create_ssl_directory
    generate_ssl_cert
}

main

# run nginx
exec "$@"
