# Stage 1: Build Stage
FROM node:lts AS development

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy entire project and build the app
COPY . /app

ENV PORT=3000

CMD ["npm", "run", "dev"]


FROM development AS build


RUN npm run build

FROM development AS dev-envs
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
FROM nginx:alpine

# Copy config nginx
COPY --from=build /app/.nginx/nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*


# Copy built application files from the builder stage to the nginx html directory
COPY --from=build /app/dist .

# Copy custom nginx configuration
# COPY --from=builder /app/scripts/nginx.conf /etc/nginx/conf.d/default.conf

# Set environment variables
#ENV DOMAIN=${DOMAIN}
#ENV HTML_PATH=/var/www/html

# Expose port 80 and 443
#EXPOSE 80 443

# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]
# Run custom entrypoint script
# ENTRYPOINT ["/bin/sh", "-c", "envsubst < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/temp.conf && mv /etc/nginx/conf.d/temp.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]