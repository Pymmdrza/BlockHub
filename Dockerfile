# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files and dataset_links.json
COPY . .
COPY public/dataset_links.json ./

# Build the app
RUN npm run build

# Stage 2: Serve stage
FROM ubuntu:22.04 AS build

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -y \
    && apt install nginx -y \
    && apt-get install software-properties-common -y \
    && add-apt-repository ppa:certbot/certbot -y \
    && apt-get update -y \
    && apt-get install python-certbot-nginx -y \
    && apt-get install openssl -y

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/public/dataset_links.json /usr/share/nginx/html/dataset_links.json

COPY scripts/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

# Expose port 80 and 443
EXPOSE 80
EXPOSE 443

CMD ["./entrypoint.sh"]
