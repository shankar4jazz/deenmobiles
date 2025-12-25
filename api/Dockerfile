# Build stage
FROM node:20-slim AS builder

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl libssl-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Install OpenSSL for Prisma runtime and curl for health checks
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma client for production
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p public/uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
