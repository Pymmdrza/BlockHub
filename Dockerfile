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
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Create directory for health checks
RUN mkdir -p /app/dist/health
RUN echo "OK" > /app/dist/health/status

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 80

# Set environment variables
ENV NODE_ENV=production \
    PORT=80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O- http://localhost/health/status || exit 1

# Start the server
CMD ["node", "server/index.js"]
