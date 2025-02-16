# Use Node.js LTS (Alpine for smaller image size)
FROM node:20-alpine

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

# Expose port 3000
EXPOSE 3000

# Inform user about the status
RUN echo "Build completed successfully. Starting the application..."

# Start the app with development server
CMD ["npm", "run", "dev"]
