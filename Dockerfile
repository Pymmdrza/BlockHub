# Stage 1: Build Stage
FROM node AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy entire project and build the app
COPY . .
RUN npm run build

# Stage 2: Serve Stage using nginx
FROM nginx:alpine

# Install necessary packages
RUN apk add --no-cache openssl

# Copy built application files from the builder stage to the nginx html directory
COPY --from=builder /app/dist /var/www/html

# Copy dataset_links.json
COPY --from=builder /app/public/dataset_links.json /var/www/html/dataset_links.json

# Copy custom nginx configuration
COPY --from=builder /app/scripts/nginx.conf /etc/nginx/conf.d/default.conf

# Generate self-signed SSL certificate (for demonstration purposes)
COPY --from=builder /app/scripts/get_ssl.sh /usr/local/bin/get_ssl.sh

RUN chmod +x /usr/local/bin/get_ssl.sh

RUN /usr/local/bin/get_ssl.sh

# Set environment variables
ENV DOMAIN=${DOMAIN}
ENV HTML_PATH=/var/www/html

# Expose port 80 and 443
EXPOSE 80 443

# Run custom entrypoint script
ENTRYPOINT ["/bin/sh", "-c", "envsubst < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/temp.conf && mv /etc/nginx/conf.d/temp.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]