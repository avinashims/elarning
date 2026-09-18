#!/bin/bash
# Deploy e-learning API + web on shared DigitalOcean server
# Run from project root on server: bash deploy/deploy-shared.sh

set -e
cd "$(dirname "$0")/.."

COMPOSE_FILE=docker-compose.prod.shared.yml

if [ ! -f deploy/.env.production ]; then
  echo "Creating deploy/.env.production from shared-server template..."
  cp deploy/.env.production.shared-server deploy/.env.production
  echo "EDIT deploy/.env.production (DATABASE_URL, JWT secrets) then run again."
  exit 1
fi

set -a
source deploy/.env.production
set +a

echo "Building and starting API (port ${APP_PORT:-9001}) + Web (port ${WEB_PORT:-9002})..."
docker compose -f "$COMPOSE_FILE" up -d --build

sleep 10

echo "Checking API health..."
curl -sf "http://127.0.0.1:${APP_PORT:-9001}/api/health" && echo "" || {
  echo "API health check failed. Logs:"
  docker compose -f "$COMPOSE_FILE" logs --tail=50 api
  exit 1
}

echo "Checking web UI..."
curl -sf "http://127.0.0.1:${WEB_PORT:-9002}/" >/dev/null && echo "Web OK" || {
  echo "Web check failed. Logs:"
  docker compose -f "$COMPOSE_FILE" logs --tail=30 web
  exit 1
}

PUBLIC_URL="${FRONTEND_URL:-http://127.0.0.1:${WEB_PORT:-9002}}"

echo ""
echo "=========================================="
echo " E-learning deployed"
echo "=========================================="
echo " Web (teachers/students): ${PUBLIC_URL}"
echo " API (mobile APK):        http://$(hostname -I | awk '{print $1}'):${APP_PORT:-9001}/api"
echo " Health:                  http://127.0.0.1:${APP_PORT:-9001}/api/health"
echo ""
echo " Teacher login:  ${PUBLIC_URL}/login"
echo " Register:       ${PUBLIC_URL}/register  (choose Teacher)"
echo " Dashboard:      ${PUBLIC_URL}/teacher"
echo ""
echo " Demo accounts (after seed):"
echo "   teacher@elearning.com / teacher123"
echo "   student@elearning.com / student123"
echo ""
echo " Open firewall ports ${WEB_PORT:-9002} and ${APP_PORT:-9001} on DigitalOcean if needed."
