# Stockifyy Data Portal

Pakistan Stock Exchange financial data portal built with Next.js 16, PostgreSQL, and Drizzle ORM.

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- Docker Desktop (for local PostgreSQL)
- npm

### Setup
```bash
npm install
cp .env.example .env.local   # then fill in your values
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run aggregate:weekly
npm run dev
```

Open: http://localhost:3001/data-portal

> **Warning — demo credentials:** The seed script creates `admin@stockifyy.com / admin123` and `demo@stockifyy.com / demo123`. **Change these before going live.**

## Production Deployment

### 1. Environment variables (required)

Copy `.env.example` and set all values on your hosting platform (Vercel, Railway, Render, etc.):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (SSL included by the provider) |
| `JWT_SECRET` | 64-byte random secret — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `SESSION_COOKIE_NAME` | Name of the auth cookie (e.g. `sid`) |
| `NODE_ENV` | Must be `production` |
| `NEXT_PUBLIC_APP_URL` | Your public domain, e.g. `https://data.stockifyy.com` |

### 2. Run migrations on the production database
```bash
DATABASE_URL=<prod-url> NODE_ENV=production npm run db:migrate
```

### 3. Build and start
```bash
npm run build
npm start          # listens on port 3000
```

## Key Routes

| Route | Description |
|-------|-------------|
| `/data-portal` | Market overview dashboard |
| `/data-portal/daily` | Daily market data |
| `/data-portal/weekly` | Weekly aggregated data |
| `/data-portal/indices` | Market indices |
| `/data-portal/sectors` | Sector summary |
| `/data-portal/companies` | Company directory |
| `/data-portal/company/[symbol]` | Company profile |
| `/data-portal/screener` | Stock screener |
| `/data-portal/admin` | Admin panel (staff only) |
| `/data-portal/admin/import` | Data import centre |
| `/data-portal/admin/login` | Staff login |

## Scripts

```bash
npm run dev               # Dev server on port 3001
npm run build             # Production build
npm start                 # Production server on port 3000
npm run db:generate       # Generate Drizzle migration files from schema
npm run db:migrate        # Apply pending migrations
npm run db:seed           # Seed demo data
npm run aggregate:weekly  # Aggregate daily → weekly records
npm test                  # Run test suite
```
