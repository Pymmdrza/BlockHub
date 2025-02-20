# Stage 1: Build stage
FROM node:20-alpine AS builder
STOPSIGNAL SIGTERM
# create working directory
RUN mkdir -p /usr/src/blockhub

WORKDIR /usr/src/blockhub

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install

# Copy project files and dataset_links.json
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve stage
FROM nginx:alpine as blockhub

FROM debian:11.7-slim

RUN apt-get update && apt-get install -y --no-install-recommends nginx openssl

RUN rm -rf /var/lib/apt/lists/*

RUN openssl req \
    -x509 \
    -subj "/C=KE/ST=Nairobi/L=Nairobi/O=Mmdrza.Com Ltd/OU=Portfolio website/CN=blockhub.mmdrza.com" \
    -nodes \
    -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt


WORKDIR /usr/src/blockhub

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -y && apt install -y nginx certbot python3-certbot-nginx

RUN rm -rf /usr/share/nginx/html/*


COPY --from=builder /usr/src/blockhub/scripts/configs/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /usr/src/blockhub/scripts/configs/nginxconfigs/prox.conf /etc/nginx/prox.conf
COPY --from=builder /usr/src/blockhub/scripts/configs/nginxconfigs/general.conf /etc/nginx/general.conf
COPY --from=builder /usr/src/blockhub/scripts/configs/nginxconfigs/security.conf /etc/nginx/security.conf
COPY --from=builder /usr/src/blockhub/dist /usr/share/nginx/html

COPY --from=builder /usr/src/blockhub/public/dataset_links.json /usr/share/nginx/html/dataset_links.json
# Expose port 80 and 443
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
