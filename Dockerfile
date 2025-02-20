# Stage 1: Build Stage
FROM node:20-alpine AS builder
WORKDIR /usr/src/blockhub

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy entire project and build the app
COPY . .
RUN npm run build

# Define build arguments with default values (در صورت نیاز می‌توانید این مقادیر را override کنید)
ARG NODE_ENV=production
ARG VITE_API_BASE_URL=/api/v2
ARG DOMAIN=$(PRIMARY_DOMAIN)
ARG ADMIN_EMAIL=admin@example.com
ARG DIST_PATH=/usr/src/blockhub/dist
ARG HTML_PATH=/usr/share/nginx/html

# Set environment variables based on build arguments
ENV NODE_ENV=${NODE_ENV}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV DOMAIN=${DOMAIN}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV DIST_PATH=${DIST_PATH}
ENV HTML_PATH=${HTML_PATH}

# Stage 2: Serve Stage using nginx
FROM nginx:alpine
RUN apk add --no-cache gettext
ENV DOMAIN=${DOMAIN}
ENV HTML_PATH=${HTML_PATH}

# Copy the dataset_links.json file from the builder stage into the designated HTML directory
COPY --from=builder /usr/src/blockhub/public/dataset_links.json ${HTML_PATH}/dataset_links.json

# Copy built application files from the builder stage to the HTML directory
COPY --from=builder ${DIST_PATH} ${HTML_PATH}

# Expose port 9000 (users can map it to container's port 80 as desired)
EXPOSE 9000

RUN envsubst '$DOMAIN $HTML_PATH' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
