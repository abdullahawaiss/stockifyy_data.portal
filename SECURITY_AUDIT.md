# SECURITY AUDIT REPORT
**Application:** Stockifyy Data Portal  
**Date:** 2025-08-04  
**Auditor:** Principal Application Security Engineer  
**Standard:** OWASP ASVS Level 2 + OWASP Top 10 (2021)

---

## STACK DETECTED
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL via Drizzle ORM
- **Auth:** JWT (jose) + bcryptjs + DB sessions
- **Package Manager:** npm
- **Runtime:** Node.js

---

## PRIORITIZED FINDINGS

| # | Finding | Severity | File | Attack Scenario | Data at Risk | Fix |
|---|---------|----------|------|-----------------|--------------|-----|
| 1 | **Export endpoints completely unauthenticated** | CRITICAL | `api/portal/daily/export/route.ts:8`, `api/portal/weekly/export/route.ts:9` | Anyone calls `/api/portal/daily/export?date=2025-01-01` without any token and downloads entire market dataset | All market data (CSV dump) | Add `getSession()` + `canAccess()` check |
| 2 | **CSV formula injection** | CRITICAL | `export/route.ts:38`, `weekly/export/route.ts:43` | Company name `=CMD|' /C calc'!A0` injected into CSV, opens attacker payload when victim opens in Excel | End-user's machine if Excel auto-executes | Sanitize all CSV fields |
| 3 | **No rate limiting on login** | CRITICAL | `api/auth/login/route.ts` | Attacker sends 10,000 POST /api/auth/login requests, brute-forces passwords | Any user account | Add IP-based rate limit |
| 4 | **Logout does NOT invalidate server-side session** | HIGH | `api/auth/logout/route.ts` | After logout, original JWT still valid for 7 days. Stolen token remains usable. | All user data for token lifetime | Delete session row from DB on logout |
| 5 | **All portal data APIs are public** | HIGH | `api/portal/daily/route.ts`, `companies/route.ts`, `indices/route.ts`, `sectors/route.ts`, `announcements/route.ts`, `research/route.ts`, `weekly/route.ts` | Unauthenticated user scrapes entire database via API | All market data (business asset) | Add auth guard (at minimum `canAccess(session, "public")` which resolves to logged-in check) |
| 6 | **Hardcoded fallback JWT secret** | HIGH | `src/lib/auth.ts:9` | If JWT_SECRET env var missing, uses `"dev_secret_change_in_production_32"` — attacker can forge tokens | Full auth bypass | Remove fallback, throw if missing |
| 7 | **No .gitignore — .env.local unprotected** | HIGH | `.gitignore` (missing) | `git init && git add .` would commit `.env.local` with DB credentials, MinIO keys, JWT secret | DB password, JWT secret, MinIO keys | Create .gitignore immediately |
| 8 | **No security headers** | HIGH | `next.config.ts` | XSS, clickjacking, MIME sniffing attacks have no browser-level defense | User sessions, data | Add headers in next.config.ts |
| 9 | **Internal errors leaked to client** | MEDIUM | `api/portal/import/route.ts:109` | `"Import failed: " + String(err)` returns stack trace, file paths, DB schema | Infrastructure info | Return generic message, log internally |
| 10 | **importType not validated** | MEDIUM | `api/portal/import/route.ts:19` | Any string passed as importType stored in DB import_batches table | DB integrity | Allowlist validation |
| 11 | **date parameter not validated in exports** | MEDIUM | Both export routes | Malformed date strings cause DB errors potentially leaking schema info | DB schema via error | Validate date format |
| 12 | **No request size limit** | MEDIUM | `api/auth/login/route.ts` | 100MB JSON body causes memory exhaustion | Server availability | Add body size check |
| 13 | **IP address never captured in audit logs** | LOW | `api/portal/import/route.ts:92` | No IP in audit trail — forensics impossible after incident | Audit integrity | Log IP from request headers |
| 14 | **Session not updated on successful login** | LOW | `api/auth/login/route.ts` | lastLoginAt never updated | Audit trail | Update lastLoginAt on login |
| 15 | **No Content-Security-Policy** | LOW | `next.config.ts` | XSS via injected scripts has no mitigations | User sessions | Add CSP header |

---

## POSITIVE FINDINGS (Already Correct)
- bcrypt used for password hashing ✅
- HttpOnly + SameSite=lax session cookie ✅  
- Parameterized queries via Drizzle ORM (no raw SQL injection) ✅
- Role hierarchy checked server-side ✅
- File size limit on upload (50MB) ✅
- Import requires `data_manager` role ✅
- Aggregate endpoint requires `data_manager` role ✅
- JWT verified with `jwtVerify` (not just decode) ✅
- Session stored in DB (not purely client-side) ✅
