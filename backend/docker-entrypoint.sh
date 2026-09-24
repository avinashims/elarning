#!/bin/sh
set -e

echo "Running database setup..."
npx prisma db push --accept-data-loss

echo "Seeding database (safe to re-run)..."
node prisma/seed.js || echo "Seed skipped or already done"

echo "Starting API server..."
exec node src/index.js
