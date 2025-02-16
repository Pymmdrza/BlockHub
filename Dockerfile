# Stage 1: Build the app
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install required dependencies for Alpine
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies and verify installation
RUN npm install

# Copy project files
COPY . .

# Build the app and check if the build directory exists
RUN npm run build && ls -l dist/ || (echo "Build failed: 'dist/' not found" && exit 1)

# Stage 2: Serve the built app using nginx
FROM nginx:stable-alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Ensure `dest/` exists before copying
COPY --from=build /app/dist/ ./ || (echo "Error: dist/ not found after build" && exit 1)

# Expose port 80
EXPOSE 80

# Inform user about the status
RUN echo "Build completed successfully. Serving the application on port 80..."

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
