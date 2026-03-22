# Car Tracker SaaS

Track car services, maintenance, and value across all your vehicles.

## Architecture (All Google Cloud)

| Layer | Service |
|-------|---------|
| **Web** | Next.js → Firebase Hosting / Cloud Run |
| **Mobile** | Expo / React Native |
| **API** | Cloud Run (Node.js + Express) |
| **Database** | Cloud SQL (PostgreSQL) |
| **Auth** | Firebase Auth |
| **Payments** | Stripe (future) |

## Structure
```
car-tracker/
├── apps/
│   ├── api/          # Cloud Run API (Express + Prisma)
│   ├── web/          # Next.js web dashboard
│   └── mobile/       # Expo mobile app
├── packages/
│   ├── database/     # Prisma schema + client
│   └── shared/       # Shared types & utils
└── infrastructure/   # Terraform/deployment
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Database
```bash
# Create Cloud SQL instance (or use local Postgres)
# Then push schema:
cd packages/database
cp .env.example .env  # Add DATABASE_URL
npx prisma db push
```

### 3. Set up Firebase
1. Create project at https://console.firebase.google.com
2. Enable Authentication → Email/Password
3. Add Web App, copy config to `.env` files

### 4. Run Locally
```bash
# API
npm run dev:api

# Web
npm run dev:web

# Mobile
cd apps/mobile && npx expo start
```

## Deployment

### API → Cloud Run
```bash
gcloud run deploy car-tracker-api \
  --source apps/api \
  --region us-central1 \
  --allow-unauthenticated
```

### Web → Firebase Hosting
```bash
cd apps/web
npm run build
firebase deploy --only hosting
```

## Features

- 🚗 Multi-vehicle management
- 🔧 Service tracking (14 categories)
- 📊 Spending dashboard
- 🔔 Maintenance reminders
- 💰 Valuation tracking (BaT, Cars & Bids)
- 📱 Mobile + Web apps
- ☁️ Cross-device sync
