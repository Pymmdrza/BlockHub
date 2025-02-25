# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production Stage
FROM nginx:alpine

# Copy built application from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration file
COPY scripts/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for HTTP traffic
EXPOSE 80 443 8080

# Command to start nginx
CMD ["nginx", "-g", "daemon off;"]