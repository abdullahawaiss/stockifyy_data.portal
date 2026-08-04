---
name: project-data-portal
description: "Stockifyy Data Portal — what was built, where it lives, and how to run it"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5ca8eb72-2bde-4f74-84a6-9303be6f354f
  modified: 2026-08-04T06:08:50.638Z
---

The Stockifyy Data Portal was built inside the existing Next.js project at:
`C:\Users\abdul\OneDrive\Documents\stockifyy`

**Why:** User requested a full financial data portal for PSX data, integrated into the existing Stockifyy website under the `/data-portal` route.

**How to apply:** When the user mentions the data portal, website, or Stockifyy project, this is the relevant codebase.

## What was built

- 30 routes under `/data-portal/*` (market overview, daily, weekly, indices, sectors, companies, screener, historical, announcements, research, downloads, admin)
- PostgreSQL schema with 30+ tables (Drizzle ORM)
- Weekly aggregation system (idempotent, tested)
- Admin panel with data import, aggregation trigger, audit logs
- 20 unit tests for weekly aggregation (all passing)
- Production build: successful (Next.js 16)
- Docker Compose for local dev (PostgreSQL + Redis + MinIO)
- Full documentation in `docs/`

## Credentials (demo)
- admin@stockifyy.com / admin123
- demo@stockifyy.com / demo123

## Key scripts
- `npm run dev` — start dev server
- `npm run db:migrate` — run migrations
- `npm run db:seed` — seed demo data
- `npm run aggregate:weekly` — generate weekly records
- `npm test` — run tests

## Limitation
Docker is NOT installed on this machine. Database requires Docker or a cloud PostgreSQL (Neon/Supabase) to function. UI and build work without it.
