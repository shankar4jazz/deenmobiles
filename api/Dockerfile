# Build stage
FROM node:20-slim AS builder

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to keep only production deps
RUN npm prune --omit=dev

# Production stage
FROM node:20-slim AS production

# Install OpenSSL for Prisma runtime and curl for health checks
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Copy production node_modules from builder (avoids running npm ci again - fixes OOM)
COPY --from=builder /app/node_modules ./node_modules

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy fonts directory for rupee symbol support in PDFs
COPY public/fonts ./public/fonts

# Copy logos directory (company logos for PDFs)
COPY public/uploads/logos ./public/uploads/logos

# Create uploads directories for runtime-generated files
RUN mkdir -p public/uploads/invoices public/uploads/jobsheets public/uploads/estimates public/uploads/labels

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
