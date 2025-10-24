#!/bin/sh
set -e  # Exit on any error

# Set environment variables to suppress warnings
export PRISMA_SKIP_POSTINSTALL_GENERATE=true
export PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma || {
    echo "❌ Migration failed"
    exit 1
}
echo "✅ Migrations completed"

# Prisma client is already generated during Docker build
echo "✅ Using pre-generated Prisma client from build stage"

# Start the application
echo "🚀 Starting NestJS application..."
exec node dist/src/main
