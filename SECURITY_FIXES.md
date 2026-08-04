# SECURITY FIXES LOG
**Applied:** 2025-08-04  
**Scope:** All CRITICAL + HIGH + MEDIUM findings from SECURITY_AUDIT.md

---

## FIX 1 — Export endpoints: Add authentication (CRITICAL)
**Files:** `src/app/api/portal/daily/export/route.ts`, `src/app/api/portal/weekly/export/route.ts`  
**Change:** Added `getSession()` + `canAccess(session, "client")` check at top of both handlers. Returns HTTP 401 if unauthenticated.  
**Before:** Any anonymous HTTP GET could download complete market data CSV  
**After:** Only logged-in users (role ≥ client) can export

---

## FIX 2 — CSV formula injection sanitization (CRITICAL)
**Files:** `src/lib/csvSanitize.ts` (new), both export routes  
**Change:** Created `sanitizeCsvField()` helper — prefixes values starting with `=`, `+`, `-`, `@`, `\t`, `\r` with a single quote `'` so spreadsheet apps treat them as text  
**Before:** Company name like `=CMD|'/C calc'!A0` would execute as formula in Excel  
**After:** Such values are rendered as literal text

---

## FIX 3 — Rate limiting on login (CRITICAL)
**Files:** `src/lib/rateLimit.ts` (new), `src/app/api/auth/login/route.ts`  
**Change:** In-memory sliding-window rate limiter: 10 attempts per IP per 15 minutes. Returns HTTP 429 with `Retry-After` header on excess.  
**Note:** In-memory store resets on server restart. For multi-process/serverless production, replace with Redis-backed limiter (e.g. `@upstash/ratelimit`).  
**Before:** Unlimited login attempts — brute-force and credential stuffing possible  
**After:** Attacker is blocked after 10 failed attempts per 15-minute window

---

## FIX 4 — Logout: invalidate server-side session (HIGH)
**Files:** `src/lib/auth.ts`, `src/app/api/auth/logout/route.ts`  
**Change:** Added `invalidateSession(token)` that extracts `sessionId` from JWT and deletes the `sessions` row from DB. Logout route now calls this before clearing the cookie.  
**Before:** Stolen JWT remained valid for up to 7 days after logout  
**After:** Session is immediately invalidated in DB; stolen token is rejected even if cookie was copied

---

## FIX 5 — Remove hardcoded fallback JWT secret (HIGH)
**File:** `src/lib/auth.ts`  
**Change:** Removed `?? "dev_secret_change_in_production_32"` fallback. Server now throws `Error: JWT_SECRET environment variable is required` at startup if the env var is missing.  
**Before:** Missing `JWT_SECRET` silently fell back to a known string, allowing token forgery  
**After:** Missing secret is a hard startup failure — no silent degradation

---

## FIX 6 — Add .gitignore (HIGH)
**File:** `.gitignore` (created)  
**Change:** Comprehensive gitignore covering `.env*` files, `node_modules`, `.next`, build output, and OS/IDE artifacts.  
**Before:** No gitignore; `git add .` would commit `.env.local` containing DB password, JWT secret, MinIO keys  
**After:** All secret files are excluded from version control

---

## FIX 7 — Security headers (HIGH)
**File:** `next.config.ts`  
**Change:** Added `headers()` export with: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and a baseline `Content-Security-Policy`.  
**Before:** No security headers — browser had no defenses against XSS, clickjacking, MIME sniffing  
**After:** All modern browser defenses active on every response

---

## FIX 8 — Remove internal error details from import response (MEDIUM)
**File:** `src/app/api/portal/import/route.ts`  
**Change:** Replaced `"Import failed: " + String(err)` with generic `"Import failed. Please check your file and try again."`  
**Before:** Stack traces, file paths, DB schema info leaked to client on uncaught errors  
**After:** Generic error — details only in server logs

---

## FIX 9 — importType allowlist validation (MEDIUM)
**File:** `src/app/api/portal/import/route.ts`  
**Change:** Added `ALLOWED_IMPORT_TYPES` constant; returns HTTP 400 if submitted value is not in the list  
**Before:** Any string could be stored as importType in the DB  
**After:** Only `daily_stock_prices` (and future explicitly allowed types) accepted

---

## FIX 10 — Date parameter validation in exports (MEDIUM)
**Files:** Both export routes  
**Change:** Validate `date` / `weekStart` params against `/^\d{4}-\d{2}-\d{2}$/` regex. Returns HTTP 400 on mismatch.  
**Before:** Malformed strings passed directly to DB query, DB error could leak schema info  
**After:** Invalid dates rejected before reaching DB

---

## FIX 11 — Request body size guard on login (MEDIUM)
**File:** `src/app/api/auth/login/route.ts`  
**Change:** Check `Content-Length` header; reject >1 MB with HTTP 413 before parsing JSON  
**Before:** Unbounded request body could cause memory exhaustion  
**After:** Oversized bodies rejected immediately

---

## FIX 12 — IP address in audit logs (LOW)
**File:** `src/app/api/portal/import/route.ts`  
**Change:** `x-forwarded-for` / `x-real-ip` headers captured and stored in `auditLogs.newValue`  
**Before:** Audit logs had no IP — forensic tracing after incident was impossible  
**After:** IP recorded alongside every import action

---

## REMAINING (Scope / Environment)

| Finding | Why Not Fixed Here | Recommendation |
|---------|-------------------|----------------|
| All portal read APIs public (finding #5) | Architectural decision — these may intentionally be public | Add `canAccess(session, "client")` if data is subscriber-only |
| Session 7-day duration | No user impact yet | Reduce to 24h + sliding window renewal |
| No Redis rate limiter | No Redis in this env | Add `@upstash/ratelimit` before public launch |
| lastLoginAt not updated | Schema field may not exist | Update on login once confirmed |
