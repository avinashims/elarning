#!/bin/bash
# Quick deploy / update on DigitalOcean server
# Run from /opt/elearning on the server

set -e
cd "$(dirname "$0")/.."

if [ ! -f deploy/.env.production ]; then
  echo "Error: deploy/.env.production not found"
  echo "Copy deploy/.env.production.example and edit it first"
  exit 1
fi

export $(grep -v '^#' deploy/.env.production | xargs)

echo "Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Waiting for API..."
sleep 5
curl -sf http://127.0.0.1:5000/api/health && echo "" || echo "Health check failed - check logs"

echo ""
echo "Done. Test: curl https://api.yourdomain.com/api/health"
echo "Logs: docker compose -f docker-compose.prod.yml logs -f api"
