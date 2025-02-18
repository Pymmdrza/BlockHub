FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE_URL=https://blockhub.mmdrza.com
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/dist/ ./
# Copy Config nginx from script folder .
# if from this webserver use please change line 3 'server_name'
COPY ./scripts/nginx.conf /etc/nginx/nginx.conf
# Set Public Port
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
