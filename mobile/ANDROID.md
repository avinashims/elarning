# Server + Global APK (Android)

**No local backend.** Host API on cloud → build APK → works on any Android phone worldwide.

👉 **Full guide:** [DEPLOY_AND_APK.md](../DEPLOY_AND_APK.md)

## Quick steps

### 1. Deploy backend (Render — free)

1. Push project to GitHub
2. [render.com](https://render.com) → New → Blueprint → connect repo
3. Wait for deploy → copy URL: `https://elearning-api-xxxx.onrender.com`

### 2. Set API URL in APK build config

Edit `mobile/eas.json`:

```json
"EXPO_PUBLIC_API_URL": "https://elearning-api-xxxx.onrender.com/api"
```

### 3. Build APK

```powershell
cd D:\elearning\mobile
npm install -g eas-cli
eas login
eas init
eas build -p android --profile production
```

### 4. Install APK on any Android phone

Download from [expo.dev](https://expo.dev) → share APK file → install.

---

## Demo login

- `student@elearning.com` / `student123`
