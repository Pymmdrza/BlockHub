#!/usr/bin/env bash
set -eo pipefail

# Configuration
SOURCE_DIR="source"
PORT=3000
NODE_MIN_VERSION=18
COLOR_GREEN="\033[1;32m"
COLOR_RED="\033[1;31m"
COLOR_RESET="\033[0m"

# Helper functions
error_exit() {
  echo -e "${COLOR_RED}Error: $1${COLOR_RESET}" >&2
  exit 1
}

check_directory() {
  [ -d "$1" ] || error_exit "Directory $1 not found! Invalid repository structure."
}

version_compare() {
  local version=$(node -v | cut -d'v' -f2)
  local major=$(echo $version | cut -d'.' -f1)
  [ "$major" -ge "$NODE_MIN_VERSION" ] || error_exit "Node.js v$NODE_MIN_VERSION+ required (found v$version)"
}

# Main execution
echo -e "${COLOR_GREEN}🚀 Starting BlockHub Setup...${COLOR_RESET}"

# Validate environment
check_directory "$SOURCE_DIR"
command -v node >/dev/null 2>&1 || error_exit "Node.js not installed! Visit https://nodejs.org/"
command -v npm >/dev/null 2>&1 || error_exit "npm not found! Reinstall Node.js."
version_compare

# Install dependencies
echo -e "\n📦 Installing dependencies..."
cd "$SOURCE_DIR"
npm ci --silent --no-progress || error_exit "Dependency installation failed"

# Build project
echo -e "\n🔨 Building application..."
npm run build -- --no-color || error_exit "Build failed"

# Start application
echo -e "\n${COLOR_GREEN}⚡ Starting Application...${COLOR_RESET}"
npm run dev -- --port $PORT &

# Health check
sleep 3
curl --silent --retry 3 --max-time 2 http://localhost:$PORT >/dev/null || error_exit "Application failed to start"

# Final output
echo -e "\n${COLOR_GREEN}✅ Successfully launched BlockHub!${COLOR_RESET}"
echo -e "👉 Access the application at ${COLOR_GREEN}http://localhost:$PORT${COLOR_RESET}"
echo -e "\nUse Ctrl+C to stop the server"
wait
