# Deployment Guide

## Local Development

### Requirements
- Node.js 20+
- Docker Desktop (for PostgreSQL, Redis, MinIO)

### Setup
```bash
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run aggregate:weekly
npm run dev
```

URL: http://localhost:3000

## Production (Vercel + Neon)

### 1. Database: Neon (PostgreSQL)
- Sign up at neon.tech (free tier)
- Create a project
- Copy connection string

### 2. Vercel Deployment
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Required Environment Variables
```
DATABASE_URL=<neon-connection-string>
JWT_SECRET=<32-char-random-string>
SESSION_COOKIE_NAME=stockifyy_session
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Run Migrations on Production
```bash
DATABASE_URL=<prod-url> npm run db:migrate
DATABASE_URL=<prod-url> npm run db:seed
```

## Post-Deployment Checklist

- [ ] Admin login works at /data-portal/admin/login
- [ ] Demo banner is visible
- [ ] Daily page loads (may show "no data" — expected)
- [ ] Weekly page loads
- [ ] Run data import to populate real data
- [ ] Run weekly aggregation after import
- [ ] Verify audit logs are recording

## Production Credentials Required

| Service | Purpose | Where to Get |
|---------|---------|--------------|
| PostgreSQL (Neon/Supabase) | Database | neon.tech or supabase.com |
| Redis (Upstash) | Caching (optional) | upstash.com |
| S3/R2 | File storage | cloudflare.com/r2 or aws.amazon.com |
| PSX Data Licence | Real market data | psx.com.pk |
