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

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma || {
    echo "❌ Prisma generate failed"
    exit 1
}
echo "✅ Prisma client generated"

# Start the application
echo "🚀 Starting NestJS application..."
exec node dist/main
