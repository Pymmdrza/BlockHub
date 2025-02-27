# Build stage
FROM node:20 AS builder

WORKDIR /app

RUN groupadd -r blockhub && useradd -g blockhub blockhub




# Copy only necessary project files
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
# Copy package files for better caching
COPY package*.json ./

# Install dependencies with cache
RUN npm install
# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine-slim

# Install required packages
RUN apk add --no-cache \
    bash \
    certbot \
    certbot-nginx \
    openssl \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy built assets from builder stage
COPY --from=builder /app/dist .

WORKDIR /

# Copy configuration files
COPY scripts/nginx.conf /etc/nginx/templates/default.conf
COPY scripts/setup_with_ssl.sh /usr/share/nginx/setup_with_ssl.sh
COPY scripts/setup_without_ssl.sh /usr/share/nginx/setup_without_ssl.sh

# Make scripts executable
RUN chmod +x /usr/share/nginx/setup_with_ssl.sh \
    /usr/share/nginx/setup_without_ssl.sh

COPY .env.example /usr/share/nginx/.env

# Create required directories
RUN mkdir -p /etc/nginx/conf.d \
    /var/www/certbot \
    /etc/letsencrypt

# Set environment variables
ENV USE_SSL=true \
    NODE_ENV=production

# Expose ports
EXPOSE 80 443

# Copy and set entrypoint
COPY docker-entrypoint.sh /usr/share/docker-entrypoint.sh
RUN chmod +x /usr/share/docker-entrypoint.sh
RUN chown -R blockhub:blockhub /app

USER blockhub
ENTRYPOINT ["/usr/share/docker-entrypoint.sh"]
