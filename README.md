# Udemy-Style E-Learning Platform

A full-stack Udemy-inspired marketplace with React frontend, Node.js/Express backend, PostgreSQL, Prisma ORM, Redis caching, JWT authentication, and Razorpay payments.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router |
| Mobile | React Native (Expo) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache | Redis |
| Auth | JWT access + refresh tokens (jsonwebtoken + bcrypt) |
| Payments | Razorpay |

## Features

### Udemy-style marketplace
- Category browsing with filters (level, price, search, sort)
- Course pricing, cart, and one-click buy (Razorpay)
- Wishlist / save for later
- Star ratings and written reviews
- Instructor profiles with published courses
- Course detail tabs: Overview, Curriculum, Instructor, Reviews
- My Learning dashboard for enrolled courses

### Core platform
- User registration & login with JWT access + refresh tokens
- Secure logout with refresh token revocation
- Role-based access (Student, Teacher, Admin)
- Courses with chapters and lessons
- Free and premium lesson tiers
- Subscription plans with Razorpay integration
- Premium content access control
- Live class scheduling
- Recorded previous classes
- Video progress tracking with auto-save
- Resume video from last watched position
- Admin dashboard (stats, user management)
- Teacher dashboard (courses, live classes)

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for PostgreSQL and Redis)

### 1. Start Database Services

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm test
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

**Deploy backend + global Android APK:** [DEPLOY_AND_APK.md](DEPLOY_AND_APK.md)

**DigitalOcean server:** [DEPLOY_DIGITALOCEAN.md](DEPLOY_DIGITALOCEAN.md)

### 4. Mobile App (React Native)

**Full guide:** [mobile/MOBILE_APP.md](mobile/MOBILE_APP.md)

Quick start (phone + Expo Go, same Wi-Fi):

```powershell
cd D:\elearning\backend
npm run dev
```

```powershell
cd D:\elearning\mobile
Copy-Item .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:5000/api
npm install
npm start
```

Or use the helper script:

```powershell
.\scripts\start-mobile.ps1
```

Scan the QR code with **Expo Go** on Android/iPhone.

### 5. Video Files (Protected Playback)

Lesson videos are stored **outside** the Node.js app. After `npx prisma db push` and `npm run db:seed`:

1. Create `D:\elearning\videos\samples\`
2. Add MP4 files matching seed keys (e.g. `big-buck-bunny.mp4`, `elephants-dream.mp4`)
3. Set `VIDEO_SIGNING_SECRET` in `backend/.env`

The API never exposes permanent video URLs — the frontend requests a signed URL at playback time.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@elearning.com | admin123 |
| Teacher | teacher@elearning.com | teacher123 |
| Student | student@elearning.com | student123 |

## Environment Variables

### Backend (`backend/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/elearning
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
FRONTEND_URL=http://localhost:5173
VIDEO_STORAGE_PATH=../videos
VIDEO_SIGNING_SECRET=your-video-signing-secret
VIDEO_URL_EXPIRY_SECONDS=900
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login (returns access + refresh tokens) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/profile` | Get authenticated profile |
| GET | `/api/courses` | List courses (`?category=&level=&q=&sort=&minPrice=&maxPrice=`) |
| GET | `/api/courses/instructor/:id` | Instructor profile + courses |
| GET | `/api/courses/:id` | Course details (rating, enrollment status) |
| POST | `/api/courses/:id/enroll` | Enroll in free course |
| GET | `/api/categories` | List course categories |
| GET | `/api/reviews/courses/:courseId` | Course reviews |
| POST | `/api/reviews/courses/:courseId` | Submit review (enrolled users) |
| GET | `/api/cart` | Shopping cart |
| POST | `/api/cart` | Add course to cart |
| DELETE | `/api/cart/:courseId` | Remove from cart |
| POST | `/api/cart/checkout` | Checkout cart (Razorpay) |
| POST | `/api/cart/verify` | Verify cart payment |
| POST | `/api/cart/buy/:courseId` | Buy single course |
| POST | `/api/cart/buy/:courseId/verify` | Verify single-course payment |
| GET | `/api/wishlist` | User wishlist |
| POST | `/api/wishlist/:courseId` | Toggle wishlist |
| GET | `/api/lessons/:id` | Get lesson metadata (no raw video URLs) |
| GET | `/api/videos/lessons/:id/access` | Get short-lived signed stream URL (auth + premium check) |
| GET | `/api/videos/stream?token=...` | Stream video from external storage |
| PUT | `/api/progress/lesson/:id` | Save video progress |
| GET | `/api/progress/lesson/:id` | Get saved watch position for resume |
| GET | `/api/payments/plans` | Subscription plans |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |
| GET | `/api/live-classes/upcoming` | Upcoming live classes (public) |
| GET | `/api/live-classes` | List live classes (auth, optional `courseId`/`status` filters) |
| GET | `/api/live-classes/:id/join` | Verify join eligibility; returns `meetingUrl` / `liveStreamId` |
| POST | `/api/live-classes` | Schedule live class (teacher/admin) |
| POST | `/api/live-classes/:id/start` | Start live class (teacher/admin) |
| POST | `/api/live-classes/:id/end` | End live class; optional `recordingUrl` (teacher/admin) |
| PUT | `/api/live-classes/:id` | Update live class (teacher/admin) |
| GET | `/api/live-classes/recordings` | Recorded classes (auth, premium gating) |
| GET | `/api/dashboard/admin` | Admin stats |
| GET | `/api/dashboard/teacher` | Teacher stats |

## Project Structure

```
elearning/
├── backend/
│   ├── prisma/schema.prisma
│   ├── prisma/seed.js
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── index.js
├── frontend/
│   └── src/
├── mobile/
│   └── src/
│       ├── screens/
│       ├── navigation/
│       └── api/
├── docker-compose.yml
└── README.md
```

## Production Deployment

1. Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` plus production database credentials
2. Configure Razorpay live keys
3. Build frontend: `cd frontend && npm run build`
4. Serve frontend static files via CDN or nginx
5. Run backend with `NODE_ENV=production npm start`
6. Use managed PostgreSQL and Redis services
7. Enable HTTPS and update CORS origins

## License

MIT
"# elarning" 
