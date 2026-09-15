#!/bin/bash
# Run on a fresh Ubuntu 22.04/24.04 DigitalOcean Droplet (as root)
# Usage: bash deploy/setup-droplet.sh

set -e

echo "=== DigitalOcean E-Learning Server Setup ==="

# 1. System packages
apt-get update
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx

# 2. Docker
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# 3. Docker Compose plugin
apt-get install -y docker-compose-plugin || true

# 4. App directory
APP_DIR=/opt/elearning
mkdir -p $APP_DIR
mkdir -p $APP_DIR/deploy
mkdir -p $APP_DIR/videos

echo ""
echo "=== Next steps ==="
echo ""
echo "1. Upload your project to $APP_DIR (git clone or scp)"
echo "   git clone YOUR_REPO_URL $APP_DIR"
echo ""
echo "2. Create production env file:"
echo "   cp $APP_DIR/deploy/.env.production.example $APP_DIR/deploy/.env.production"
echo "   nano $APP_DIR/deploy/.env.production"
echo ""
echo "3. Start services:"
echo "   cd $APP_DIR"
echo "   export \$(grep -v '^#' deploy/.env.production | xargs)"
echo "   docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "4. Point domain api.yourdomain.com to this server's IP"
echo ""
echo "5. Enable HTTPS:"
echo "   cp deploy/nginx-api.conf /etc/nginx/sites-available/elearning-api"
echo "   ln -sf /etc/nginx/sites-available/elearning-api /etc/nginx/sites-enabled/"
echo "   rm -f /etc/nginx/sites-enabled/default"
echo "   nginx -t && systemctl reload nginx"
echo "   certbot --nginx -d api.yourdomain.com"
echo ""
echo "6. Test: curl https://api.yourdomain.com/api/health"
echo ""
echo "7. Build Android APK with:"
echo "   EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api"
echo ""
