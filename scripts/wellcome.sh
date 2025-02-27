#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Welcome message
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Welcome to BlockHub!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Application access information
echo -e "${BLUE}Your application is now ready!${NC}\n"

# Show access URLs based on configuration
if [ "$USE_SSL" = "true" ]; then
    if [ "$DOMAIN" = "localhost" ]; then
        echo -e "${YELLOW}Access your application at:${NC}"
        echo -e "• HTTP:  ${GREEN}http://localhost:${PORT:-9000}${NC}"
        echo -e "• HTTPS: ${GREEN}https://localhost:443${NC}"
    else
        echo -e "${YELLOW}Access your application at:${NC}"
        echo -e "• HTTP:  ${GREEN}http://${DOMAIN}:${PORT:-9000}${NC}"
        echo -e "• HTTPS: ${GREEN}https://${DOMAIN}${NC} (Recommended)"
    fi
else
    if [ "$DOMAIN" = "localhost" ]; then
        echo -e "${YELLOW}Access your application at:${NC}"
        echo -e "• HTTP: ${GREEN}http://localhost:${PORT:-9000}${NC}"
    else
        echo -e "${YELLOW}Access your application at:${NC}"
        echo -e "• HTTP: ${GREEN}http://${DOMAIN}:${PORT:-9000}${NC}"
    fi
fi

echo -e "\n${BLUE}API Endpoints:${NC}"
echo -e "• Bitcoin API: ${GREEN}${VITE_API_BASE_URL:-/api/v2}${NC}"
echo -e "• Blockchain Info: ${GREEN}/blockchain-api${NC}"

echo -e "\n${YELLOW}Need help?${NC}"
echo -e "• Documentation: ${GREEN}https://github.com/Pymmdrza/BlockHub#readme${NC}"
echo -e "• Report issues: ${GREEN}https://github.com/Pymmdrza/BlockHub/issues${NC}"

echo -e "\n${GREEN}Happy coding! 🚀${NC}\n" 