# Stage 1: Build Stage
FROM node AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy entire project and build the app
COPY . .
RUN npm run build

# Stage 2: Serve Stage using nginx-auto-ssl
FROM valian/nginx-auto-ssl:latest

# Copy built application files from the builder stage to the nginx html directory
COPY --from=builder /app/dist /var/www/html

# Copy dataset_links.json
COPY --from=builder /app/public/dataset_links.json /var/www/html/dataset_links.json

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set environment variables
ENV DOMAIN=${DOMAIN}
ENV HTML_PATH=/var/www/html

# Expose port 80 and 443 (nginx-auto-ssl handles redirection)
EXPOSE 80 443

# Run custom entrypoint script
ENTRYPOINT ["/bin/sh", "-c", "envsubst < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/temp.conf && mv /etc/nginx/conf.d/temp.conf /etc/nginx/conf.d/default.conf && /entrypoint.sh nginx -g 'daemon off;'"]