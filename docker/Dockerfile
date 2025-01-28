# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY source/package*.json ./
RUN npm ci
COPY source .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
