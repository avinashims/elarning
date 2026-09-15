# Deploy on DigitalOcean + Global Android APK

Host backend on your **DigitalOcean Droplet**. Build APK pointing to your server — works on any Android phone worldwide.

---

## What you need

| Item | Example |
|------|---------|
| DigitalOcean Droplet | Ubuntu 22.04, 2 GB RAM ($12/mo) |
| Domain (recommended) | `api.yourdomain.com` → Droplet IP |
| GitHub repo | Your elearning project |

> **HTTPS is required** for a production Android APK. Use a domain + free Let's Encrypt SSL.

---

## Architecture

```
Android APK  ──HTTPS──▶  Nginx (443)  ──▶  Docker API (5000)
                                              ├── PostgreSQL
                                              └── Redis
```

---

## Step 1 — Create DigitalOcean Droplet

1. [cloud.digitalocean.com](https://cloud.digitalocean.com) → **Create Droplet**
2. **Ubuntu 24.04 LTS**
3. Plan: **Basic → Regular → 2 GB RAM** (minimum recommended)
4. Add SSH key (or use password)
5. Create Droplet
6. Note the **IP address** (e.g. `157.230.45.67`)

---

## Step 2 — Point domain to Droplet

In your domain DNS (GoDaddy, Namecheap, Cloudflare, etc.):

| Type | Name | Value |
|------|------|-------|
| A | `api` | `YOUR_DROPLET_IP` |

Wait 5–30 minutes. Test:

```bash
ping api.yourdomain.com
```

Replace `yourdomain.com` with your real domain everywhere below.

---

## Step 3 — Connect to server & install

```bash
ssh root@YOUR_DROPLET_IP
```

Run setup script:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/deploy/setup-droplet.sh | bash
```

Or manually clone and run:

```bash
apt update && apt install -y git docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
git clone https://github.com/YOUR_USER/YOUR_REPO.git /opt/elearning
cd /opt/elearning
bash deploy/setup-droplet.sh
```

---

## Step 4 — Configure environment

```bash
cd /opt/elearning
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production
```

**Change these values:**

```env
DB_PASSWORD=MyStrongPassword123!
JWT_ACCESS_SECRET=paste_output_of_openssl_rand
JWT_REFRESH_SECRET=paste_another_random_string
VIDEO_SIGNING_SECRET=paste_another_random_string
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

Generate secrets on server:

```bash
openssl rand -base64 32
```

Also update `DB_PASSWORD` in both places in the file (DB_PASSWORD and DATABASE_URL password).

---

## Step 5 — Start backend (Docker)

```bash
cd /opt/elearning
export $(grep -v '^#' deploy/.env.production | xargs)
docker compose -f docker-compose.prod.yml up -d --build
```

Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

Test locally on server:

```bash
curl http://127.0.0.1:5000/api/health
```

Expected: `"success": true`

---

## Step 6 — Nginx + HTTPS (SSL)

```bash
cd /opt/elearning
sed -i 's/api.yourdomain.com/api.YOUR-REAL-DOMAIN.com/g' deploy/nginx-api.conf
cp deploy/nginx-api.conf /etc/nginx/sites-available/elearning-api
ln -sf /etc/nginx/sites-available/elearning-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Get free SSL certificate:

```bash
certbot --nginx -d api.yourdomain.com
```

Test globally:

```bash
curl https://api.yourdomain.com/api/health
```

Open in phone browser — should work.

---

## Step 7 — Open firewall

In DigitalOcean dashboard → Droplet → **Networking → Firewalls**:

| Inbound | Port | Source |
|---------|------|--------|
| SSH | 22 | Your IP |
| HTTP | 80 | All |
| HTTPS | 443 | All |

Or on server:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## Step 8 — Build global Android APK

On your **Windows PC**:

### 1. Edit `mobile/eas.json`

Replace with your DigitalOcean API URL:

```json
"EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api"
```

In both `preview` and `production` profiles.

### 2. Build APK

```powershell
cd D:\elearning\mobile
npm install -g eas-cli
eas login
eas init
eas build -p android --profile production
```

### 3. Download & install

- Download APK from [expo.dev](https://expo.dev)
- Send to any Android phone → install
- Works globally on mobile data

**Login:** `student@elearning.com` / `student123`

---

## Step 9 — Deploy frontend (optional)

Deploy React web app to same server or Vercel:

**Vercel (easy):**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Or on same Droplet** — build and serve with Nginx static files.

---

## Useful commands (on server)

```bash
cd /opt/elearning

# View logs
docker compose -f docker-compose.prod.yml logs -f api

# Restart after code update
git pull
export $(grep -v '^#' deploy/.env.production | xargs)
docker compose -f docker-compose.prod.yml up -d --build

# Stop everything
docker compose -f docker-compose.prod.yml down

# Backup database
docker exec elearning-postgres pg_dump -U elearning elearning > backup.sql
```

---

## Update app after changes

```bash
# On server
cd /opt/elearning
git pull
export $(grep -v '^#' deploy/.env.production | xargs)
docker compose -f docker-compose.prod.yml up -d --build
```

If mobile API URL changed → rebuild APK on PC with `eas build`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `curl` health fails | `docker compose logs api` — check DATABASE_URL |
| SSL error | Run `certbot --nginx -d api.yourdomain.com` again |
| APK network error | URL must be `https://api.yourdomain.com/api` (with `/api`) |
| 502 Bad Gateway | API container down — restart docker compose |
| Slow video | Upload MP4 files to `/opt/elearning/videos` on server |

---

## No domain? (IP only — not recommended)

Android blocks plain HTTP by default. For testing only:

- Use IP: `http://YOUR_IP:5000/api` — requires extra Android config
- **Strongly recommended:** buy a cheap domain (~$10/year) and use HTTPS

---

## Quick checklist

- [ ] Droplet created (Ubuntu, 2GB RAM)
- [ ] DNS A record: `api.yourdomain.com` → Droplet IP
- [ ] `deploy/.env.production` configured
- [ ] `docker compose -f docker-compose.prod.yml up -d --build`
- [ ] Nginx + Certbot SSL working
- [ ] `https://api.yourdomain.com/api/health` OK
- [ ] `eas.json` updated with your API URL
- [ ] APK built and tested on Android
