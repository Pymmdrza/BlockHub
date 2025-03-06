#!/bin/bash
install_blockhub() {
    if [ "$(id -u)" != "0" ]; then
        echo "This script must be run as root" >&2
        exit 1
    fi

    # check if is Mac OS
    if [ "$(uname)" = "Darwin" ]; then
        echo "This script must be run on Linux" >&2
        exit 1
    fi

    # check if is running inside a container
    if [ -f /.dockerenv ]; then
        echo "This script must be run on Linux" >&2
        exit 1
    fi

    # check if something is running on port 80
    if ss -tulnp | grep ':80 ' >/dev/null; then
        echo "Error: something is already running on port 80" >&2
        exit 1
    fi

    # check if something is running on port 443
    if ss -tulnp | grep ':443 ' >/dev/null; then
        echo "Error: something is already running on port 443" >&2
        exit 1
    fi

    command_exists() {
      command -v "$@" > /dev/null 2>&1
    }

    if command_exists docker; then
      echo "Docker already installed"
    else
      curl -sSL https://get.docker.com | sh
    fi

    docker swarm leave --force 2>/dev/null

    get_ip() {
        local ip=""
        
        # Try IPv4 first
        # First attempt: ifconfig.io
        ip=$(curl -4s --connect-timeout 5 https://ifconfig.io 2>/dev/null)
        
        # Second attempt: icanhazip.com
        if [ -z "$ip" ]; then
            ip=$(curl -4s --connect-timeout 5 https://icanhazip.com 2>/dev/null)
        fi
        
        # Third attempt: ipecho.net
        if [ -z "$ip" ]; then
            ip=$(curl -4s --connect-timeout 5 https://ipecho.net/plain 2>/dev/null)
        fi

        # If no IPv4, try IPv6
        if [ -z "$ip" ]; then
            # Try IPv6 with ifconfig.io
            ip=$(curl -6s --connect-timeout 5 https://ifconfig.io 2>/dev/null)
            
            # Try IPv6 with icanhazip.com
            if [ -z "$ip" ]; then
                ip=$(curl -6s --connect-timeout 5 https://icanhazip.com 2>/dev/null)
            fi
            
            # Try IPv6 with ipecho.net
            if [ -z "$ip" ]; then
                ip=$(curl -6s --connect-timeout 5 https://ipecho.net/plain 2>/dev/null)
            fi
        fi

        if [ -z "$ip" ]; then
            echo "Error: Could not determine server IP address automatically (neither IPv4 nor IPv6)." >&2
            echo "Please set the DOMAIN environment variable manually." >&2
            echo "Example: export DOMAIN=<YOUR-DOMAIN-OR-LOCALHOST>" >&2
            exit 1
        fi

        echo "$ip"
    }

    domain_addr="${DOMAIN:-$(get_ip)}"
    echo "Using domain address: $DOMAIN"

    docker swarm init --advertise-addr $domain_addr
    
     if [ $? -ne 0 ]; then
        echo "Error: Failed to initialize Docker Swarm" >&2
        exit 1
    fi

    echo "Swarm initialized"

    docker network rm -f blockhub-network 2>/dev/null
    docker network create --driver overlay --attachable blockhub-network

    echo "Network created"

    mkdir -p /etc/blockhub

    chmod 777 /etc/blockhub

    docker pull pymmdrza/blockhub:latest

    # Installation
    docker service create \
      --name blockhub \
      --replicas 1 \
      --network blockhub-network \
      --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
      --mount type=bind,source=/etc/blockhub,target=/etc/blockhub \
      --mount type=volume,source=blockhub-docker-config,target=/root/.docker \
      --publish published=80,target=80,mode=host \
      --update-parallelism 1 \
      --update-order stop-first \
      --constraint 'node.role == manager' \
      -e DOMAIN=$domain_addr \
      pymmdrza/blockhub:latest
    
    docker run -d -p 80:80 -p 443:443 --name blockhub pymmdrza/blockhub:latest

    GREEN="\033[0;32m"
    YELLOW="\033[1;33m"
    BLUE="\033[0;34m"
    NC="\033[0m" # No Color

    format_ip_for_url() {
        local ip="$1"
        if echo "$ip" | grep -q ':'; then
            # IPv6
            echo "[${ip}]"
        else
            # IPv4
            echo "${ip}"
        fi
    }

    formatted_addr=$(format_ip_for_url "$domain_addr")
    echo ""
    printf "[+] ${GREEN}Congratulations, BlockHub is installed!${NC}\n"
    printf "[+] ${BLUE}Wait 15 seconds for the server to start${NC}\n"
    printf "[+] ${YELLOW}Please go to http://${formatted_addr}${NC}\n\n"
}

update_blockhub() {
    echo "Updating BlockHub..."
    
    # Pull the latest image
    docker pull pymmdrza/blockhub:latest

    # Update the service
    docker service update --image pymmdrza/blockhub:latest blockhub

    echo "BlockHub has been updated to the latest version."
}

# Main script execution
if [ "$1" = "update" ]; then
    update_blockhub
else
    install_blockhub
fi
