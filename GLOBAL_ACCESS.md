# Global Mobile Access

Make your Udemy-style platform visible on **any mobile phone anywhere in the world**.

You have **3 options** — pick one based on your goal.

---

## Option 1: Web app on any phone (recommended)

Deploy the React website. Anyone opens your link in **Chrome / Safari** on their phone — no app store needed.

### Step 1 — Deploy backend (public HTTPS API)

Use [Render](https://render.com), [Railway](https://railway.app), or similar:

1. Connect your repo
2. Set root directory: `backend`
3. Build: `npm install && npx prisma generate`
4. Start: `npm start`
5. Add PostgreSQL and set env vars:

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=strong-secret
JWT_REFRESH_SECRET=strong-secret
FRONTEND_URL=https://YOUR-FRONTEND-URL.vercel.app
CORS_ORIGINS=https://YOUR-FRONTEND-URL.vercel.app
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

6. Run migrations: `npx prisma db push` then `npm run db:seed`

Your API will be like: `https://your-api.onrender.com`

### Step 2 — Deploy frontend (global CDN)

Use [Vercel](https://vercel.com) (free):

1. Import repo, set root: `frontend`
2. Build: `npm run build`
3. Output: `dist`
4. Environment variable:

```env
VITE_API_URL=https://your-api.onrender.com/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

5. Deploy → you get a URL like `https://your-app.vercel.app`

### Step 3 — Share the link

Send this URL to anyone:

```
https://your-app.vercel.app
```

On mobile they can:
- Open in browser (works on Android & iPhone)
- Tap **Add to Home Screen** → installs like an app (PWA)

---

## Option 2: Native app (Expo) — share worldwide via QR

For the React Native app with Expo Go or APK:

### Quick test (any phone with Expo Go)

```powershell
cd D:\elearning\backend
npm run dev
```

In another terminal, expose API publicly (pick one):

**Cloudflare Tunnel (free):**
```powershell
cloudflared tunnel --url http://localhost:5000
```
Copy the `https://....trycloudflare.com` URL.

**Or ngrok:**
```powershell
ngrok http 5000
```

Set mobile `.env`:
```env
EXPO_PUBLIC_API_URL=https://YOUR-TUNNEL-URL/api
```

Start Expo with tunnel (works across countries/Wi‑Fi):

```powershell
cd D:\elearning\mobile
npm run start:tunnel
```

Scan the QR code with **Expo Go** on any phone — works globally if API tunnel is running.

### Production APK (install without Expo Go)

1. Create free account at [expo.dev](https://expo.dev)
2. Set production API in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-api.onrender.com/api
```

3. Build APK:

```powershell
cd D:\elearning\mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

4. Download APK from Expo dashboard and share the file — any Android phone can install it.

---

## Option 3: Run on your PC, show on phones nearby (LAN only)

Only works on the **same Wi‑Fi** (not global):

1. Find your PC IP: `ipconfig` → e.g. `192.168.1.5`
2. Backend: allow firewall port `5000`
3. Frontend `.env`: `VITE_API_URL=http://192.168.1.5:5000/api`
4. Run `npm run dev` in frontend with `--host`:

```powershell
cd D:\elearning\frontend
npm run dev -- --host
```

5. On phone browser open: `http://192.168.1.5:5173`

---

## Checklist for global access

| Item | Required |
|------|----------|
| HTTPS API URL | Yes (Render/Railway/etc.) |
| HTTPS frontend URL | Yes (Vercel/Netlify) |
| `CORS_ORIGINS` includes frontend URL | Yes |
| `VITE_API_URL` points to public API | Yes |
| Database hosted (not localhost) | Yes |
| Mobile `.env` uses public API | Yes (for native app) |

---

## Demo accounts (after seed)

| Email | Password |
|-------|----------|
| student@elearning.com | student123 |
| teacher@elearning.com | teacher123 |

---

## Troubleshooting

**"Network error" on mobile**
- API URL must be `https://...` (not `localhost` or `10.0.2.2`)
- Phone cannot reach your PC unless you use tunnel or deploy

**CORS error in browser**
- Add your frontend URL to `CORS_ORIGINS` in backend `.env`

**Expo QR not loading**
- Use `npm run start:tunnel` instead of `npm start`
- Phone and PC don't need same Wi‑Fi with tunnel mode

**Video not playing**
- Upload video files to server storage path
- Set `VIDEO_STORAGE_PATH` and `VIDEO_SIGNING_SECRET` on deployed backend
