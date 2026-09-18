# Show on ANY Mobile Phone

Your API works on the server. To reach **any phone anywhere**, do these 3 things.

---

## What blocks phones today

Your Docker maps port like this:

```
127.0.0.1:9001  →  only the server itself
0.0.0.0:9001    →  any phone on the internet ✅
```

---

## STEP 1 — Expose API to the internet (server)

SSH to server:

```bash
cd /opt/elarning
nano docker-compose.prod.shared.yml
```

Find:

```yaml
ports:
  - '127.0.0.1:9001:9001'
```

Change to:

```yaml
ports:
  - '0.0.0.0:9001:9001'
```

Restart:

```bash
export $(grep -v '^#' deploy/.env.production | xargs)
docker compose -f docker-compose.prod.shared.yml up -d
```

---

## STEP 2 — Open firewall (DigitalOcean)

1. [cloud.digitalocean.com](https://cloud.digitalocean.com) → your Droplet
2. **Networking** → **Firewalls** (or create one)
3. Add **Inbound rule**:
   - Type: **Custom**
   - Port: **9001**
   - Sources: **All IPv4** (0.0.0.0/0)
4. Attach firewall to your droplet

**Test on your phone browser** (mobile data, not Wi‑Fi):

```
http://YOUR_DROPLET_IP:9001/api/health
```

Must show `"success": true`. If yes, any phone can reach your API.

---

## STEP 3 — Choose how users open the app

### Option A — Android APK (install like normal app)

**On your Windows PC:**

1. Edit `D:\elearning\mobile\eas.json`:

```json
"EXPO_PUBLIC_API_URL": "http://YOUR_DROPLET_IP:9001/api"
```

2. Build:

```powershell
cd D:\elearning\mobile
eas login
eas build -p android --profile production
```

3. Download APK from [expo.dev](https://expo.dev)
4. Send APK to any Android phone → Install → Open

Works on **any Android**, anywhere.

---

### Option B — Mobile website (Android + iPhone, no install)

Works on **iPhone and Android** in Chrome/Safari.

**On server** — build and serve frontend:

```bash
cd /opt/elarning/frontend
echo "VITE_API_URL=http://YOUR_DROPLET_IP:9001/api" > .env
npm install
npm run build
```

Serve with nginx (port 9010 example):

```bash
nano /etc/nginx/sites-available/elearning-web
```

```nginx
server {
    listen 9010;
    server_name _;
    root /opt/elarning/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
ln -sf /etc/nginx/sites-available/elearning-web /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Open firewall port **9010**.

**On any phone:**

```
http://YOUR_DROPLET_IP:9010
```

Add to home screen → works like an app (PWA).

---

## Share with anyone

| Method | Link / file |
|--------|-------------|
| Android APK | Send `.apk` file (WhatsApp, Drive) |
| Mobile web | `http://YOUR_DROPLET_IP:9010` |
| API test | `http://YOUR_DROPLET_IP:9001/api/health` |

**Login:** `student@elearning.com` / `student123`

---

## Recommended for production (HTTPS + domain)

Buy/use a domain → point to Droplet IP:

| Subdomain | Use |
|-----------|-----|
| `api.yourdomain.com` | Backend (port 9001 behind nginx + SSL) |
| `app.yourdomain.com` | Mobile web frontend |

```bash
certbot --nginx -d api.yourdomain.com -d app.yourdomain.com
```

APK URL becomes:

```json
"EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api"
```

---

## Quick checklist

- [ ] Docker port `0.0.0.0:9001:9001`
- [ ] Firewall port 9001 open
- [ ] Phone browser: `http://IP:9001/api/health` works on mobile data
- [ ] Android: build APK OR serve web on port 9010
- [ ] Share link/APK with users

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Works on server, not on phone | Change `127.0.0.1` → `0.0.0.0` in docker-compose |
| Phone timeout | Open firewall port 9001 |
| App network error | Rebuild APK with correct `EXPO_PUBLIC_API_URL` |
| iPhone user | Use mobile web (Option B), not APK |
