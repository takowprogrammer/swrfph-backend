# Use the official Node.js 18 image as base
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install ALL dependencies (including dev dependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables to suppress Prisma warnings
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Generate Prisma client (suppress warnings)
RUN npx prisma generate 2>/dev/null || echo "Prisma generate completed with warnings"

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy the built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/start.sh ./start.sh

# Make startup script executable
RUN chmod +x ./start.sh

USER nestjs

EXPOSE 5000

ENV PORT 5000
ENV HOSTNAME "0.0.0.0"

# Run database migrations and start the application
CMD ["./start.sh"]
