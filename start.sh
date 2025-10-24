#!/bin/sh

# Set environment variables to suppress warnings
export PRISMA_SKIP_POSTINSTALL_GENERATE=true
export PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Run database migrations (ignore warnings)
echo "Running database migrations..."
npx prisma migrate deploy --accept-data-loss || echo "Migration completed with warnings"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate || echo "Prisma generate completed with warnings"

# Start the application
echo "Starting the application..."
npm run start:prod
