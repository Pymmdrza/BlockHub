# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Build the app
ARG VITE_API_BASE_URL=https://blockhub.mmdrza.com
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# copy dataset links download file
COPY public/dataset_links.json ./

# Expose port 80, 443
# Copy Config nginx from script folder .
# if from this webserver use please change line 3 'server_name'
COPY scripts/nginx.conf /etc/nginx/conf.d/default.conf

# Create directory for certbot
RUN mkdir -p /var/www/certbot

# Expose ports
EXPOSE 80
EXPOSE 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
