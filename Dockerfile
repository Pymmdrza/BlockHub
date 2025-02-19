# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Install required packages
RUN apk add --no-cache \
    bash \
    certbot \
    certbot-nginx \
    openssl \
    curl \
    gettext

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy configuration files
COPY scripts/nginx.conf ./etc/nginx/templates/default.conf.template
COPY scripts/setup_with_ssl.sh ./scripts/setup_with_ssl.sh
COPY scripts/setup_without_ssl.sh ./scripts/setup_without_ssl.sh
COPY docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY public/dataset_links.json ./dataset_links.json

# Make scripts executable
RUN chmod +x ./scripts/setup_with_ssl.sh \
    && chmod +x ./scripts/setup_without_ssl.sh \
    && chmod +x ./scripts/docker-entrypoint.sh

# Create required directories
RUN mkdir -p /etc/nginx/conf.d \
    && mkdir -p /var/www/certbot \
    && mkdir -p /etc/letsencrypt

# Set default environment variables
ENV USE_SSL=true \
    DOMAIN=blockhub.mmdrza.com \
    ADMIN_EMAIL=mmdrza@usa.com \
    VITE_API_BASE_URL=/api/v2

# Expose ports
EXPOSE 80 443

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
