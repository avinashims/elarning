# Deploy on Your DigitalOcean Server (with pgAdmin + hotelbooking)

Your server already runs **hotelbooking** on port **9000** and **pgAdmin** on **5050**.  
E-learning will use port **9001** and a **separate PostgreSQL database** on the same Postgres server.

---

## Port map (your server)

| Service | Port |
|---------|------|
| hotelbooking | 9000 |
| pgAdmin | 5050 |
| **e-learning API** | **9001** (localhost) |
| PostgreSQL | 5432 (shared) |

---

## Step 1 — Upload project to server

```bash
ssh root@YOUR_DROPLET_IP
mkdir -p /opt/elearning
cd /opt/elearning
git clone YOUR_GITHUB_REPO .
```

Or copy files from your PC with `scp`.

---

## Step 2 — Create e-learning database (pgAdmin)

1. Open pgAdmin: `http://YOUR_DROPLET_IP:5050`
2. Login: `admin@hotelbooking.dev` / `admin123`
3. Connect to your PostgreSQL server
4. Open **Query Tool** and run `deploy/init-elearning-db.sql`:

```sql
CREATE USER elearning WITH PASSWORD 'YourStrongElearningPass123';

CREATE DATABASE elearning OWNER elearning;

GRANT ALL PRIVILEGES ON DATABASE elearning TO elearning;
```

5. Connect to database `elearning` → Query Tool:

```sql
GRANT ALL ON SCHEMA public TO elearning;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO elearning;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO elearning;
```

**Or via terminal** (if postgres container is named from hotelbooking):

```bash
docker ps | grep postgres
docker exec -it CONTAINER_NAME psql -U hotel -d postgres -f - < /opt/elearning/deploy/init-elearning-db.sql
```

---

## Step 3 — Configure environment

```bash
cd /opt/elearning
cp deploy/.env.production.shared-server deploy/.env.production
nano deploy/.env.production
```

**Set these:**

```env
APP_PORT=9001
PORT=9001

DATABASE_URL=postgresql://elearning:YourStrongElearningPass123@host.docker.internal:5432/elearning?schema=public

JWT_ACCESS_SECRET=paste_from_openssl_rand_hex_32
JWT_REFRESH_SECRET=paste_another_secret
VIDEO_SIGNING_SECRET=paste_another_secret
```

Generate secrets:

```bash
openssl rand -hex 32
```

---

## Step 4 — Start e-learning API + Web

```bash
cd /opt/elearning   # or /opt/elarning on your server
bash deploy/deploy-shared.sh
```

This starts:

| Service | Port | URL |
|---------|------|-----|
| **Web** (React) | **9002** | `http://YOUR_DROPLET_IP:9002` |
| **API** (mobile) | **9001** | `http://YOUR_DROPLET_IP:9001/api` |

Test:

```bash
curl http://127.0.0.1:9001/api/health
curl -I http://127.0.0.1:9002/
```

**Open firewall** on DigitalOcean for ports **9001** and **9002** (Inbound, All IPv4).

**Teacher web access:**

```
http://YOUR_DROPLET_IP:9002/register   → choose "Teacher"
http://YOUR_DROPLET_IP:9002/teacher    → create courses
```

Demo login: `teacher@elearning.com` / `teacher123`

---

## Step 4b — Update after code changes

```bash
cd /opt/elearning
git pull
bash deploy/deploy-shared.sh
```

## Step 5 — Nginx on port 80 (optional — one URL for web + API)

If you want `http://YOUR_DROPLET_IP/` instead of `:9002`:

```bash
cd /opt/elearning
nano deploy/nginx-elearning-site.conf
# Set server_name to YOUR_DROPLET_IP or learn.yourdomain.com

cp deploy/nginx-elearning-site.conf /etc/nginx/sites-available/elearning
ln -sf /etc/nginx/sites-available/elearning /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Then set in `deploy/.env.production`:

```env
FRONTEND_URL=http://YOUR_DROPLET_IP
CORS_ORIGINS=http://YOUR_DROPLET_IP
```

Rebuild: `bash deploy/deploy-shared.sh`

---

## Step 6 — Nginx + HTTPS (for global Android APK)

Add a subdomain `api.yourdomain.com` → your Droplet IP (DNS A record).

```bash
cd /opt/elearning
nano deploy/nginx-elearning-api.conf
# Change api.yourdomain.com to your real domain

cp deploy/nginx-elearning-api.conf /etc/nginx/sites-available/elearning-api
ln -sf /etc/nginx/sites-available/elearning-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

certbot --nginx -d api.yourdomain.com
```

Test globally:

```bash
curl https://api.yourdomain.com/api/health
```

---

## Step 7 — Build Android APK (your PC)

Edit `mobile/eas.json`:

```json
"EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api"
```

Build:

```powershell
cd D:\elearning\mobile
eas build -p android --profile production
```

Install APK on any Android phone — works globally.

**Demo login:** `student@elearning.com` / `student123`

---

## If PostgreSQL is not reachable from Docker

Check if postgres listens on host:

```bash
ss -tlnp | grep 5432
```

If postgres is **only inside hotelbooking Docker network**, find container name:

```bash
docker ps
```

Option A — expose postgres port on host (in hotelbooking docker-compose add `ports: "5432:5432"` if not already)

Option B — connect e-learning API to same Docker network:

```yaml
# In docker-compose.prod.shared.yml add under api:
networks:
  - hotelbooking_default
networks:
  hotelbooking_default:
    external: true
```

Then use `DATABASE_URL=postgresql://elearning:pass@CONTAINER_NAME:5432/elearning`

Find network name:

```bash
docker network ls
```

---

## Useful commands

```bash
cd /opt/elearning

# Logs
docker compose -f docker-compose.prod.shared.yml logs -f api

# Restart after update
git pull
bash deploy/deploy-shared.sh

# Stop
docker compose -f docker-compose.prod.shared.yml down
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Database connection refused | Postgres must listen on 5432; use `host.docker.internal` |
| Port 9001 in use | Change `APP_PORT=9002` in `.env.production` |
| pgAdmin can't create user | Use superuser `postgres` or admin role |
| APK network error | Must use `https://api.yourdomain.com/api` with valid SSL |
| hotelbooking unaffected | E-learning uses separate DB `elearning` and port 9001 |
