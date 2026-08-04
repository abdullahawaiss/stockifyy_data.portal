# CLEANUP INVENTORY
**Branch:** performance-hardening  
**Date:** 2025-08-04  
**Policy:** Nothing deleted without evidence. Files moved to quarantine directory or kept in place.

---

## CATEGORY A — Generated Artifacts (Safe to Exclude)

| Path | Action |
|------|--------|
| `.next/` | In .gitignore — not committed |
| `node_modules/` | In .gitignore — not committed |

---

## CATEGORY B — Possibly Unused Source (Requires Evidence)

### Dead Components (Never Imported Anywhere)

| File | Size | Evidence of No Use | Risk | Action |
|------|------|--------------------|------|--------|
| `src/components/portal/AnimatedIndexCards.tsx` | ~3KB | `grep -r "AnimatedIndexCards" src/` → 0 import statements. Superseded by inline `useCountUp` + `IdxCard` in `OverviewClient.tsx`. | LOW — no code depends on it | **QUARANTINED** — moved to `_quarantine/` directory |
| `src/components/ui/StatCard.tsx` | ~1KB | `grep -r "StatCard" src/` → 0 import statements. Never called anywhere. | LOW | **QUARANTINED** |
| `src/components/portal/PeriodToggle.tsx` | ~1KB | `grep -r "PeriodToggle" src/` → 0 import statements. Never called anywhere. | LOW | **QUARANTINED** |
| `src/components/portal/DemoBanner.tsx` | ~0.5KB | Imported in `layout.tsx` but NOT rendered in JSX. User explicitly removed banner from UI. | LOW — safe to quarantine | **QUARANTINED** (dead import also removed from layout.tsx) |

### Dead Dependencies Removed from package.json

All packages below were confirmed absent from every file in `src/` and `scripts/` via grep before removal.

| Package | Version | Reason Unused | Install Size | Status |
|---------|---------|---------------|-------------|--------|
| `echarts` | ^5.6.0 | No `import ... from 'echarts'` found in src/ | ~5MB | **REMOVED** |
| `echarts-for-react` | ^3.0.2 | Wrapper for echarts, also unused | ~2.5MB | **REMOVED** |
| `xlsx` | ^0.18.5 | No import found; admin page uses native `File.text()` + csv-parse only | ~1.1MB | **REMOVED** |
| `papaparse` | ^5.4.1 | No import; csv-parse handles all CSV parsing | ~200KB | **REMOVED** |
| `@types/papaparse` | ^5.3.15 | Type-only companion to papaparse | — | **REMOVED** |
| `bullmq` | ^5.52.0 | No import found; no job queue implemented yet | ~800KB | **REMOVED** |
| `ioredis` | ^5.6.1 | No import found; no Redis used yet | ~2.2MB | **REMOVED** |
| `multer` | ^2.0.1 | No import found; file uploads handled via Next.js FormData API | ~150KB | **REMOVED** |
| `@types/multer` | ^1.4.12 | Type companion to multer | — | **REMOVED** |
| `react-hook-form` | ^7.54.0 | No import found in any src file | ~200KB | **REMOVED** |
| `@hookform/resolvers` | ^3.10.0 | Companion to react-hook-form | ~100KB | **REMOVED** |
| `@tanstack/react-table` | ^8.21.3 | No import found; tables built with plain HTML | ~400KB | **REMOVED** |
| `drizzle-zod` | ^0.7.0 | No import found; zod schemas not generated | ~100KB | **REMOVED** |
| `zod` | ^3.24.0 | No direct import in src/ (was paired with drizzle-zod) | ~300KB | **REMOVED** |
| `csv-stringify` | ^6.5.2 | No import found; CSV generation uses string templates | ~100KB | **REMOVED** |

**Total removed install size: ~13MB+**

---

## CATEGORY C — Never Delete (Preserved as-is)

| File/Path | Reason |
|-----------|--------|
| `.env.local` | Contains secrets — in .gitignore, never committed |
| `scripts/migrate.ts` | DB migration runner |
| `scripts/seed.ts` | Seed data |
| `scripts/aggregate-weekly.ts` | Weekly aggregation cron script |
| `src/db/schema/*.ts` | Database schema — cannot delete |
| `docker-compose.yml` | Infrastructure |
| `package-lock.json` | Lockfile |
| All `src/app/api/**` | Active API routes |
| `public/stockifyy-logo.svg` | Production asset |
| `public/stockifyy-logo.png` | Production asset |

---

## QUARANTINE DIRECTORY

Files in `_quarantine/` can be safely deleted after 1 sprint of verification that nothing breaks.  
To restore any file: `git checkout master -- <original-path>`

| Quarantined File | Original Path |
|-----------------|---------------|
| `_quarantine/AnimatedIndexCards.tsx` | `src/components/portal/AnimatedIndexCards.tsx` |
| `_quarantine/StatCard.tsx` | `src/components/ui/StatCard.tsx` |
| `_quarantine/PeriodToggle.tsx` | `src/components/portal/PeriodToggle.tsx` |
| `_quarantine/DemoBanner.tsx` | `src/components/portal/DemoBanner.tsx` |

**Rollback:** `git checkout master -- src/` restores all source files to baseline state.
