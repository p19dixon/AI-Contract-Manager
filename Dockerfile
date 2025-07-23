# Multi-stage build for production deployment

# Build stage for client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage for server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install production dependencies only
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app

# Copy built files
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist

# Copy necessary files
COPY server/src/db/schema.ts ./server/src/db/
COPY server/src/db/migrations ./server/src/db/migrations

# Expose port
EXPOSE 3002

# Start the server
WORKDIR /app/server
CMD ["node", "dist/index.js"]