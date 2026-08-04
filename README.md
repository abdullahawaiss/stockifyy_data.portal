# Stockifyy Data Portal

Pakistan Stock Exchange financial data portal built with Next.js 16, PostgreSQL, and Drizzle ORM.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL, Redis, MinIO)
- npm or pnpm

### One-command setup
```bash
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run aggregate:weekly
npm run dev
```

Open: http://localhost:3000/data-portal

### Demo Credentials
- Admin: `admin@stockifyy.com` / `admin123`
- Analyst: `demo@stockifyy.com` / `demo123`

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Main website homepage |
| `/data-portal` | Market overview dashboard |
| `/data-portal/daily` | Daily market data |
| `/data-portal/weekly` | Weekly aggregated data |
| `/data-portal/indices` | Market indices |
| `/data-portal/sectors` | Sector summary |
| `/data-portal/companies` | Company directory |
| `/data-portal/company/[symbol]` | Company profile |
| `/data-portal/screener` | Stock screener |
| `/data-portal/historical-data` | Historical data |
| `/data-portal/announcements` | Company announcements |
| `/data-portal/research` | Research reports |
| `/data-portal/downloads` | Data downloads |
| `/data-portal/admin` | Admin panel (staff only) |
| `/data-portal/admin/import` | Data import centre |
| `/data-portal/admin/login` | Staff login |

## Scripts

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run db:migrate    # Run database migrations
npm run db:seed       # Seed demo data
npm run aggregate:weekly  # Generate weekly records from daily data
npm test              # Run tests
```

## Important Notes

- All data is **demo data** until authorised market data is imported
- Production requires PostgreSQL, Redis, and S3-compatible object storage
- See docs/ for architecture, deployment, and integration guides
