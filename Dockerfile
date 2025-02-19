# Stage 1: Build the application using Node.js
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (assuming Vite is used)
RUN npm run build

# Stage 2: Serve the built application using Nginx
FROM nginx:alpine

# Copy built files from the builder stage to Nginx's html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration template and entrypoint script
COPY scripts/nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY public/dataset_links.json /dataset_links.json
# Ensure the entrypoint script is executable
RUN chmod +x /docker-entrypoint.sh

# Use the custom entrypoint script to start Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
