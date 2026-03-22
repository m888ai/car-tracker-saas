# Car Tracker SaaS

Track car services, maintenance, and value across all your vehicles.

## Architecture (100% Google Cloud)

| Layer | Service | Cost |
|-------|---------|------|
| **Web** | Next.js → Firebase Hosting | Free |
| **Mobile** | Expo / React Native | Free |
| **API** | Cloud Run (Node.js) | Free tier |
| **Database** | Firestore | Free tier |
| **Auth** | Firebase Auth | Free tier |
| **Payments** | Stripe | Pay as you go |

**Estimated cost: $0/mo** until significant scale (50K+ users)

## Structure
```
car-tracker/
├── apps/
│   ├── api/          # Cloud Run API (Express)
│   ├── web/          # Next.js web dashboard
│   └── mobile/       # Expo mobile app
└── packages/
    └── shared/       # Shared TypeScript types
```

## Quick Start

### 1. Create Firebase Project
```bash
# Go to https://console.firebase.google.com
# Create project: "car-tracker"
# Enable: Authentication (Email/Password) + Firestore
```

### 2. Get Firebase Config
- Project Settings → Your Apps → Add Web App
- Copy config values

### 3. Set Environment Variables

**API** (`apps/api/.env`):
```
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

**Web** (`apps/web/.env.local`):
```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Mobile** (`apps/mobile/.env`):
```
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_API_URL=http://localhost:8080
```

### 4. Run Locally
```bash
# Install deps
npm install

# API (terminal 1)
cd apps/api && npm install && npm run dev

# Web (terminal 2)
cd apps/web && npm install && npm run dev

# Mobile (terminal 3)
cd apps/mobile && npx expo start
```

## Deploy

### API → Cloud Run
```bash
cd apps/api
gcloud run deploy car-tracker-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=your-project-id
```

### Web → Firebase Hosting
```bash
cd apps/web
npm run build
firebase deploy --only hosting
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user |
| GET | `/api/cars` | List all cars |
| POST | `/api/cars` | Create car |
| GET | `/api/cars/:id` | Get car with stats |
| PATCH | `/api/cars/:id` | Update car |
| DELETE | `/api/cars/:id` | Delete car |
| GET | `/api/services` | List services |
| POST | `/api/services` | Create service |
| DELETE | `/api/services/:id` | Delete service |
| GET | `/api/services/spending` | Spending summary |
| GET | `/api/valuations/cars/:id` | Get valuation |
| POST | `/api/valuations/sales` | Add comparable sale |

## Features

- 🚗 Multi-vehicle management
- 🔧 Service tracking (14 categories)
- 📊 Spending dashboard
- 🔔 Maintenance reminders
- 💰 Valuation tracking (BaT, Cars & Bids)
- 📱 Mobile + Web apps
- ☁️ Cross-device sync
- 🔐 Firebase Auth
