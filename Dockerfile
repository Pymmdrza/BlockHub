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
    curl

# Set working directory
WORKDIR /usr/share/nginx/html
# Copy built assets from builder stage
COPY --from=builder /app/dist .

WORKDIR /
# Copy configuration files
COPY --from=builder /app/scripts/nginx.conf /etc/nginx/templates/default.conf
COPY --from=builder /app/scripts/setup_with_ssl.sh /usr/share/nginx/setup_with_ssl.sh
COPY --from=builder /app/scripts/setup_without_ssl.sh /usr/share/nginx/setup_without_ssl.sh
# Make scripts executable
RUN chmod +x /usr/share/nginx/setup_with_ssl.sh
RUN chmod +x /usr/share/nginx/setup_without_ssl.sh

# Create required directories
RUN <<EOF
mkdir -p /etc/nginx/conf.d && mkdir -p /var/www/certbot && mkdir -p /etc/letsencrypt
EOF

# Set environment variables
ENV USE_SSL=true

# Expose ports
EXPOSE 9000

# Copy and set entrypoint
COPY --from=builder /app/docker-entrypoint.sh /usr/share/docker-entrypoint.sh
RUN chmod +x /usr/share/docker-entrypoint.sh
ENTRYPOINT ["/usr/share/docker-entrypoint.sh"]
