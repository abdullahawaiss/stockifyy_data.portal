# PERFORMANCE BASELINE
**Branch:** master (before performance-hardening)  
**Date:** 2025-08-04  
**Target:** http://localhost:3001/data-portal  
**Environment:** Development server (npm run dev)

---

## LIGHTHOUSE (Dev Server — estimated, see note)
| Metric | Score |
|--------|-------|
| Performance | ~50 |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 100 |

> Note: User-reported Lighthouse score from screenshot. Production build scores are typically 15–30 points higher. Exact prod-build Lighthouse measurement requires a running production server.

---

## IDENTIFIED BOTTLENECKS (Code-Level Analysis)

### LOOP / RE-RENDER ISSUES

| Issue | Location | Impact |
|-------|----------|--------|
| `useMarketStatus` sets state every 1 second (includes `time` string) | `OverviewClient.tsx:64–76` | Causes ENTIRE OverviewClient (all cards, sections, breadth bar, movers, sectors, announcements) to re-render ~60×/minute |
| `<style>` keyframe tag inside JSX | `OverviewClient.tsx:151–158` | Recreated on every 1-second re-render; browser may re-parse CSS |
| `AnimatedIndexCards.tsx` useCountUp has NO visibility guard | `AnimatedIndexCards.tsx:14–37` | RAF loop starts immediately on mount; no IntersectionObserver stop |
| `ShariahClient.tsx` has inline `<style>` with keyframes | `ShariahClient.tsx` | Same pattern; recreated on renders |

### DEAD CODE (Never Imported)

| File | Size (approx) | Evidence |
|------|--------------|---------|
| `src/components/portal/AnimatedIndexCards.tsx` | ~3KB | grep for "AnimatedIndexCards" across src/ → 0 import statements |
| `src/components/ui/StatCard.tsx` | ~1KB | grep for "StatCard" across src/ → 0 import statements |
| `src/components/portal/PeriodToggle.tsx` | ~1KB | grep for "PeriodToggle" across src/ → 0 import statements |
| `DemoBanner` import in `layout.tsx:3` | — | Imported but never used in JSX render |

### DEAD DEPENDENCIES (In package.json, Never Imported in src/)

| Package | Install Size | Evidence |
|---------|-------------|---------|
| `echarts` + `echarts-for-react` | ~7.5MB | grep for "echarts" across src/ → 0 matches |
| `xlsx` | ~1.1MB | grep for "xlsx" across src/ → 0 import matches |
| `papaparse` + `@types/papaparse` | ~350KB | grep across src/ → 0 matches |
| `bullmq` | ~800KB | grep across src/ → 0 matches |
| `ioredis` | ~2.2MB | grep across src/ → 0 matches |
| `multer` + `@types/multer` | ~250KB | grep across src/ → 0 matches |
| `react-hook-form` + `@hookform/resolvers` | ~400KB | grep across src/ → 0 matches |
| `@tanstack/react-table` | ~400KB | grep across src/ → 0 matches |
| `drizzle-zod` | ~100KB | grep across src/ → 0 matches |

**Total dead package install size: ~13MB+**

### BUNDLE CONCERNS

| Concern | Detail |
|---------|--------|
| No dynamic imports on any route | All heavy components are statically imported |
| `echarts` could be tree-shaken but is still installed | Confuses future devs, could accidentally be imported |
| `useCountUp` duplicated | Both in `AnimatedIndexCards.tsx` and `OverviewClient.tsx` — different implementations |

### SCREENER CLIENT-SIDE FILTERING

| Issue | File | Impact |
|-------|------|--------|
| Fetches 100 records then filters in browser | `screener/PageClient.tsx:36–41` | Minor; 100 rows is fine but doesn't scale |
| CSV export in screener has no formula injection protection | `screener/PageClient.tsx:47` | Low security risk |

### INLINE EVENT HANDLERS ON TABLE ROWS

| Issue | File | Impact |
|-------|------|--------|
| `onMouseEnter`/`onMouseLeave` inline functions on every `<tr>` | `daily/PageClient.tsx:178–181`, `companies/PageClient.tsx:85–86` | New function created per row per render; minor for 50-row table |

---

## NETWORK REQUESTS (Data Portal Overview Page)
- 0 API calls on overview page (all data is hardcoded demo data)
- Layout makes 1 session check call (getSession on server)
- Daily/Weekly/Companies pages each make 1 API call on load

---

## DATABASE QUERIES (Per API Route)
| Route | Queries | Notes |
|-------|---------|-------|
| `/api/portal/daily` | 2 (data + count, parallel) | Good: uses Promise.all |
| `/api/portal/daily/export` | 1 (no count needed) | Good |
| `/api/portal/weekly/export` | 1 | Good |
| `/api/portal/companies` | 2 (data + count, parallel) | Good |
| `/api/portal/import` | N+1 per CSV row (company lookup per row) | BAD: 200 rows = 200 DB queries |

### N+1 in Import Route
**File:** `src/app/api/portal/import/route.ts:55`  
**Problem:** Each CSV row triggers a separate `SELECT id FROM companies WHERE symbol = ?` query  
**Impact:** 200-row CSV = 200 sequential DB round-trips. 10,000-row file = 10,000 queries.  
**Fix:** Pre-load all company symbols once, build in-memory map, zero DB queries per row.

---

## CONSOLE ERRORS/WARNINGS (Expected in dev)
- JWT_SECRET startup check now throws if missing (correct behavior)
- No other known errors in clean state
