# Deploy Backend to Server + Global Android APK

No local backend needed. Host the API on a cloud server, build an APK that connects to it, and install on **any Android phone worldwide**.

---

## Overview

```
[Your Android APK]  ──HTTPS──▶  [Server API on Render]  ──▶  [PostgreSQL]
     anywhere                         https://xxx.onrender.com
```

---

## Part 1 — Put backend on server (Render — free)

### Step 1: Push code to GitHub

1. Create a repo on [github.com](https://github.com)
2. Push your `D:\elearning` project

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) → Sign up (free)
2. Click **New** → **Blueprint**
3. Connect your GitHub repo
4. Render reads `render.yaml` and creates:
   - PostgreSQL database
   - Node.js API server
5. Click **Apply**

Wait 5–10 minutes for deploy to finish.

### Step 3: Copy your API URL

After deploy, open the **elearning-api** service. You will see a URL like:

```
https://elearning-api-xxxx.onrender.com
```

Test in browser:

```
https://elearning-api-xxxx.onrender.com/api/health
```

You should see: `"success": true`

**Save this URL** — you need it for the APK.

### Step 4 (optional): Set Razorpay keys on Render

In Render dashboard → **elearning-api** → **Environment**:

```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
```

---

## Part 2 — Build Android APK (works globally)

The APK must be built with your **public server URL** baked in.

### Step 1: Update API URL in eas.json

Edit `mobile/eas.json` — replace `YOUR-API-URL` with your real Render URL:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://elearning-api-xxxx.onrender.com/api"
}
```

Do this in **both** `preview` and `production` profiles.

### Step 2: Create Expo account & link project

```powershell
cd D:\elearning\mobile
npm install -g eas-cli
eas login
eas init
```

Follow prompts to create/link an Expo project.

### Step 3: Build APK

```powershell
cd D:\elearning\mobile
eas build -p android --profile production
```

Wait ~10–20 minutes. Download the **APK** from [expo.dev](https://expo.dev) → your project → Builds.

### Step 4: Install on any Android phone

1. Send APK file to the phone (WhatsApp, Google Drive, USB, etc.)
2. On phone: **Settings → Security → Install unknown apps** → allow your file manager
3. Tap the APK → **Install**
4. Open **Udemy** app → login works from anywhere in the world

**Demo login:**
- Email: `student@elearning.com`
- Password: `student123`

---

## Part 3 — Share APK globally

Anyone with the APK file can install it. No Expo Go, no same Wi‑Fi, no PC running.

| Requirement | Details |
|-------------|---------|
| Server must stay online | Render free tier sleeps after 15 min idle — first request may be slow |
| Internet on phone | Mobile data or Wi‑Fi |
| HTTPS API | Render provides this automatically |

---

## Alternative: Your own VPS server

If you have a Linux VPS (DigitalOcean, AWS, Hostinger, etc.):

```bash
# On server
git clone YOUR_REPO
cd elearning/backend
cp .env.example .env
# Edit .env with DATABASE_URL, JWT secrets, etc.

docker build -t elearning-api .
docker run -d -p 5000:5000 --env-file .env elearning-api
```

Use Nginx + Let's Encrypt for HTTPS:

```
https://api.yourdomain.com/api
```

Then set that URL in `mobile/eas.json` and build APK.

---

## Update API URL later

If server URL changes:

1. Edit `mobile/eas.json` → update `EXPO_PUBLIC_API_URL`
2. Rebuild: `eas build -p android --profile production`
3. Share new APK

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| APK shows "Network Error" | Wrong URL in `eas.json` — must be `https://.../api` |
| API health check fails | Render deploy failed — check Render logs |
| Login fails | Run seed on server (included in Render buildCommand) |
| Slow first load | Render free tier wakes from sleep — wait ~30 seconds |
| Build fails on EAS | Run `eas login` and `eas init` first |

---

## Quick checklist

- [ ] Code on GitHub
- [ ] Render deploy successful
- [ ] `/api/health` works in browser
- [ ] `eas.json` has correct `EXPO_PUBLIC_API_URL`
- [ ] `eas build -p android --profile production` completed
- [ ] APK installed on Android phone
- [ ] Login works on mobile data (not same Wi‑Fi as PC)
