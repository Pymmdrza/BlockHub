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

# copy dataset links download file
COPY public/dataset_links.json ./
# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

ARG VITE_API_BASE_URL=/api/v2
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

ARG DOMAIN=blockhub.mmdrza.com
ENV DOMAIN=${DOMAIN}
ENV domain=${DOMAIN}

ARG ADMIN_EMAIL=mmdrza@usa.com
ENV ADMIN_EMAIL=${ADMIN_EMAIL}

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80, 443
# Copy Config nginx from script folder .
# if from this webserver use please change line 3 'server_name'
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directory for certbot
RUN mkdir -p /var/www/certbot

# Expose ports
EXPOSE 80
EXPOSE 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
