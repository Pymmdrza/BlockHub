# Stage 1: Build Stage
FROM node:lts AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy entire project and build the app
COPY . /app

ENV PORT=9000

RUN npm run build

RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends git
EOF

RUN <<EOF
useradd -s /bin/bash -m vscode
groupadd docker
usermod -aG docker vscode
EOF

# 2. For Nginx setup
FROM ubuntu:20.04 AS runner

RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends nginx
EOF

# Copy config nginx
COPY --from=build /app/.nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.nginx/get_ssl.sh /etc/nginx/get_ssl.sh

ENV DOMAIN=${DOMAIN}
ENV PROXY_READ_TIMEOUT=${PROXY_READ_TIMEOUT}
ENV PROXY_CONNECT_TIMEOUT=${PROXY_CONNECT_TIMEOUT}

RUN envsubst < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf
RUN mkdir -p /usr/share/nginx/html

WORKDIR /usr/share/nginx/html

# Copy built application files from the builder stage to the nginx html directory
COPY --from=build /app/dist /var/www/html

RUN chmod +x /etc/nginx/get_ssl.sh
# Expose port 80 and 443
EXPOSE 80 443
ENTRYPOINT ["/etc/nginx/get_ssl.sh"]
