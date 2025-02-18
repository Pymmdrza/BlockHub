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
ARG VITE_API_BASE_URL=https://blockhub.mmdrza.com
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# Stage 2: Serve the built app using nginx
FROM nginx:stable-alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy built files from the first stage
COPY --from=build /app/dist/ ./

# copy dataset links download file
COPY public/dataset_links.json ./

# Expose port 80
# Copy Config nginx from script folder .
# if from this webserver use please change line 3 'server_name'
COPY scripts/nginx.conf /etc/nginx/conf.d/default.conf

# Set Public Port
EXPOSE 80

# Inform user about the status
RUN echo "Build completed successfully. Serving the application on port 80..."

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
