# Stockifyy Data Portal

## Project Location
The portal is built INSIDE the existing Stockifyy website project at:
```
C:\Users\abdul\OneDrive\Documents\stockifyy\
```

## Quick Start

Open a terminal and run:
```bash
cd C:\Users\abdul\OneDrive\Documents\stockifyy
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run aggregate:weekly
npm run dev
```

Then open: http://localhost:3000/data-portal

## Admin Login
- URL: http://localhost:3000/data-portal/admin/login
- Email: admin@stockifyy.com
- Password: admin123

## Key Pages
- Market Overview: http://localhost:3000/data-portal
- Daily Data: http://localhost:3000/data-portal/daily
- Weekly Data: http://localhost:3000/data-portal/weekly
- Indices: http://localhost:3000/data-portal/indices
- Companies: http://localhost:3000/data-portal/companies
- Screener: http://localhost:3000/data-portal/screener
- Admin: http://localhost:3000/data-portal/admin

## Documentation
See docs/ folder in the project:
- README.md — Quick start
- docs/WEBSITE-INTEGRATION.md — How to deploy to Vercel
- docs/WEEKLY-AGGREGATION.md — How weekly data works
- docs/DATA-SOURCES.md — Data source policy
- docs/DEPLOYMENT.md — Production deployment
