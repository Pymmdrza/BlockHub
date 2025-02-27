# Build stage
FROM node:20-alpine AS builder

# Create app directory and set permissions
WORKDIR /app

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files for better caching
COPY package*.json ./

# Install dependencies with cache
RUN npm install

# Copy only necessary project files
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the app
RUN npm run build && \
    # Set correct ownership
    chown -R appuser:appgroup /app

# Production stage
FROM nginx:alpine-slim

# Add non-root user for nginx
RUN addgroup -S nginxgroup && \
    adduser -S nginxuser -G nginxgroup && \
    # Install required packages
    apk add --no-cache \
    bash \
    certbot \
    certbot-nginx \
    openssl \
    curl \
    && rm -rf /var/cache/apk/* && \
    # Create required directories with correct permissions
    mkdir -p /etc/nginx/conf.d \
        /var/www/certbot \
        /etc/letsencrypt \
        /var/log/nginx \
        /var/cache/nginx \
        /var/run && \
    chown -R nginxuser:nginxgroup \
        /etc/nginx \
        /var/www/certbot \
        /etc/letsencrypt \
        /var/log/nginx \
        /var/cache/nginx \
        /var/run

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy built assets from builder stage
COPY --from=builder --chown=nginxuser:nginxgroup /app/dist .

# Copy configuration files
COPY --chown=nginxuser:nginxgroup scripts/nginx.conf /etc/nginx/templates/default.conf
COPY --chown=nginxuser:nginxgroup scripts/setup_with_ssl.sh /usr/share/nginx/setup_with_ssl.sh
COPY --chown=nginxuser:nginxgroup scripts/setup_without_ssl.sh /usr/share/nginx/setup_without_ssl.sh

# Make scripts executable
RUN chmod +x /usr/share/nginx/setup_with_ssl.sh \
    /usr/share/nginx/setup_without_ssl.sh

# Copy and set environment file
COPY --chown=nginxuser:nginxgroup .env.example /usr/share/nginx/.env

# Set environment variables
ENV USE_SSL=true \
    NODE_ENV=production

# Expose ports
EXPOSE 80 443

# Copy and set entrypoint
COPY --chown=nginxuser:nginxgroup docker-entrypoint.sh /usr/share/docker-entrypoint.sh
RUN chmod +x /usr/share/docker-entrypoint.sh

# Switch to non-root user
USER nginxuser

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

ENTRYPOINT ["/usr/share/docker-entrypoint.sh"]
