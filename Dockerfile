# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production Stage
FROM nginx:alpine

# Install required packages
RUN apk add --no-cache curl

# Copy built application from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy SSL certificates
COPY scripts/certs/self-signed.crt /etc/ssl/certs/self-signed.crt
COPY scripts/certs/self-signed.key /etc/ssl/private/self-signed.key

# Create directory for health checks
RUN mkdir -p /usr/share/nginx/html/health

# Add health check file
RUN echo "OK" > /usr/share/nginx/html/health/status

# Add entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose ports
EXPOSE 80
EXPOSE 443

# Set environment variables
ENV NGINX_WORKER_PROCESSES=auto \
    NGINX_WORKER_CONNECTIONS=1024 \
    PROXY_READ_TIMEOUT=60 \
    PROXY_CONNECT_TIMEOUT=60

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health/status || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]