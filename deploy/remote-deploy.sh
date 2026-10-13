#!/bin/bash
# Run ON THE DROPLET by GitHub Actions (or by hand).
# Pulls origin/main and rebuilds API + web.
set -euo pipefail
cd "${DEPLOY_PATH:-/opt/elarning}"

echo "Repo: $(pwd)"
git fetch origin
git reset --hard origin/main
git log -1 --oneline

bash deploy/deploy-shared.sh
