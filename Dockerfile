# Stage 1: Build the application using Node.js
FROM node:18-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (assuming Vite is used)
RUN npm run build

# Stage 2: Serve the built application using Nginx
FROM builder AS base

# Copy built files from the builder stage to Nginx's html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration template from the local nginx-templates directory
# (This copy will be overridden by the volume mount in docker-compose if provided)
COPY nginx-templates/default.conf.template /etc/nginx/templates/default.conf.template

# Copy the entrypoint script and ensure it is executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Use the custom entrypoint script to start Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
