#!/bin/bash
# Deploy e-learning on shared server (uses existing PostgreSQL + pgAdmin)
# Run from /opt/elearning

set -e
cd "$(dirname "$0")/.."

COMPOSE_FILE=docker-compose.prod.shared.yml

if [ ! -f deploy/.env.production ]; then
  echo "Creating deploy/.env.production from shared-server template..."
  cp deploy/.env.production.shared-server deploy/.env.production
  echo "EDIT deploy/.env.production before continuing!"
  exit 1
fi

export $(grep -v '^#' deploy/.env.production | xargs)

echo "Starting e-learning API on port ${APP_PORT:-9001}..."
docker compose -f $COMPOSE_FILE up -d --build

sleep 8
curl -sf "http://127.0.0.1:${APP_PORT:-9001}/api/health" && echo "" || {
  echo "Health check failed. Logs:"
  docker compose -f $COMPOSE_FILE logs --tail=50 api
  exit 1
}

echo ""
echo "API running at http://127.0.0.1:${APP_PORT:-9001}/api/health"
echo "Next: configure Nginx + SSL for https://api.yourdomain.com"
