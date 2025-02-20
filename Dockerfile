# Stage 1: Build Stage
FROM node:20-alpine AS builder
STOPSIGNAL SIGTERM

# Create working directory
WORKDIR /usr/src/blockhub

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files and dataset_links.json
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve Stage
FROM debian:11.7-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install required packages: nginx, certbot, python3-certbot-nginx, openssl
RUN apt-get update && \
    apt-get install -y nginx certbot python3-certbot-nginx openssl && \
    rm -rf /var/lib/apt/lists/*

# Generate a self-signed certificate (for testing purposes)
RUN openssl req -x509 -nodes -days 365 \
    -subj "/C=KE/ST=Nairobi/L=Nairobi/O=Mmdrza.Com Ltd/OU=Portfolio website/CN=blockhub.mmdrza.com" \
    -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt

# Remove default nginx html content
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration files from the builder stage
COPY --from=builder /usr/src/blockhub/scripts/configs/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /usr/src/blockhub/scripts/configs/nginxconfigs/prox.conf /etc/nginx/prox.conf
COPY --from=builder /usr/src/blockhub/scripts/configs/nginxconfigs/general.conf /etc/nginx/general.conf
COPY --from=builder /usr/src/blockhub/scripts/configs/nginxconfigs/security.conf /etc/nginx/security.conf

# Copy built application files and dataset_links.json to nginx html directory
COPY --from=builder /usr/src/blockhub/dist /usr/share/nginx/html
COPY --from=builder /usr/src/blockhub/public/dataset_links.json /usr/share/nginx/html/dataset_links.json

# Expose ports 80 and 443
EXPOSE 80 443

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
