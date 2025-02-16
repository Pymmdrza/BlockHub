# Stage 1: Build the app
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve the built app using nginx
FROM nginx:stable-alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy built files from the first stage
COPY --from=build /app/dest/ ./

# Expose port 80
EXPOSE 80

# Inform user about the status
RUN echo "Build completed successfully. Serving the application on port 80..."

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
