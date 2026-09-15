# Udemy Mobile App

React Native (Expo) app for the Udemy-style e-learning platform.

## Global access (any phone, anywhere)

See **[GLOBAL_ACCESS.md](../GLOBAL_ACCESS.md)** in the project root for full steps.

**Quick summary:**

| Goal | Command |
|------|---------|
| Test on any phone (Expo Go) | Set `EXPO_PUBLIC_API_URL` to public HTTPS API, then `npm run start:tunnel` |
| Install APK on Android | `eas build -p android --profile preview` |
| Use website instead | Deploy frontend to Vercel — works in any mobile browser |

## Features

- Login / Register with JWT access + refresh tokens
- Browse courses with price & ratings
- Course detail tabs, cart, wishlist
- Watch lessons with signed video URLs
- Live classes and recordings
- Profile and logout

## Setup

```powershell
cd mobile
Copy-Item .env.example .env
npm install
npm start
```

## API URL

| Environment | `EXPO_PUBLIC_API_URL` |
|-------------|----------------------|
| Android emulator | `http://10.0.2.2:5000/api` |
| iOS simulator | `http://localhost:5000/api` |
| Same Wi-Fi only | `http://YOUR_LAN_IP:5000/api` |
| **Global (any phone)** | `https://your-api.onrender.com/api` |

## Run

```powershell
npm start              # Local network
npm run start:tunnel   # Global QR (works worldwide with public API)
npm run android        # Android emulator
npm run build:android  # Build shareable APK (requires EAS account)
```

## Demo Account

- Email: `student@elearning.com`
- Password: `student123`
