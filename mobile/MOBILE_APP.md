# Use as Mobile App

Follow these steps to run the **Udemy-style app on your phone**.

---

## Method 1: Expo Go (fastest — 5 minutes)

Best for testing on your phone or sharing with others.

### Step 1 — Install Expo Go on your phone

- **Android:** [Google Play — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iPhone:** [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)

### Step 2 — Start the backend

```powershell
cd D:\elearning\backend
npm run dev
```

### Step 3 — Set API URL for your phone

Find your PC IP address:

```powershell
ipconfig
```

Look for **IPv4 Address** (e.g. `192.168.1.5`).

Create `D:\elearning\mobile\.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:5000/api
```

Replace `192.168.1.5` with your actual IP.

> Phone and PC must be on the **same Wi‑Fi**.

### Step 4 — Start the mobile app

```powershell
cd D:\elearning\mobile
npm install
npm start
```

A QR code appears in the terminal.

### Step 5 — Open on phone

- **Android:** Open Expo Go → Scan QR code
- **iPhone:** Open Camera app → Scan QR code → Open in Expo Go

### Demo login

- Email: `student@elearning.com`
- Password: `student123`

---

## Method 2: Install APK (standalone app — no Expo Go)

Build a real Android app you can install and share.

### Requirements

- Free account at [expo.dev](https://expo.dev)
- Backend deployed with **public HTTPS URL** (see [GLOBAL_ACCESS.md](../GLOBAL_ACCESS.md))

### Step 1 — Set production API

`mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-api.onrender.com/api
```

### Step 2 — Build APK

```powershell
cd D:\elearning\mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

When build finishes, download the **APK** from the Expo dashboard.

### Step 3 — Install on any Android phone

1. Copy APK to the phone (WhatsApp, Drive, etc.)
2. Enable **Install unknown apps** for your file manager
3. Tap the APK to install

---

## Method 3: Same Wi‑Fi quick script

Run from project root:

```powershell
.\scripts\start-mobile.ps1
```

This starts backend + mobile app and shows your LAN IP.

---

## App features (mobile)

| Tab | What you get |
|-----|----------------|
| **Home** | Hero, categories, featured courses |
| **Courses** | Browse all courses with price & ratings |
| **My Learning** | Your enrolled courses |
| **Account** | Cart, wishlist, live classes, logout |

From any course: enroll, add to cart, save to wishlist, watch lessons.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Network Error" | Wrong API URL in `.env` — use PC IP, not `localhost` |
| QR code won't load | Same Wi‑Fi? Try `npm run start:tunnel` |
| Android emulator | Use `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api` |
| iPhone on Windows | Use physical device + Expo Go (no iOS simulator on Windows) |
| Login fails | Backend running? Database seeded? |

---

## Project structure

```
mobile/
├── App.js                 # Entry point
├── .env                   # API URL (create from .env.example)
├── src/
│   ├── navigation/        # Tabs + screens
│   ├── screens/           # Home, Courses, Cart, etc.
│   ├── api/client.js      # API + token refresh
│   └── context/           # Auth state
```
