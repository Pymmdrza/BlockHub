# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files and dataset_links.json
COPY . .
COPY public/dataset_links.json ./

# Copy build shell script
COPY scripts/docker-build.sh ./

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Set build-time arguments and environment variables
ARG VITE_API_BASE_URL=/api/v2
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

ARG DOMAIN=blockhub.mmdrza.com
ENV DOMAIN=${DOMAIN}

ARG ADMIN_EMAIL=mmdrza@usa.com
ENV ADMIN_EMAIL=${ADMIN_EMAIL}

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Create directory for certbot challenges
RUN mkdir -p /var/www/certbot

# Expose ports
EXPOSE 80
EXPOSE 443

# Substitute environment variables in nginx config and start nginx
CMD envsubst '$DOMAIN $VITE_API_BASE_URL $ADMIN_EMAIL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
