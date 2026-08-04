# DEPLOYMENT SECURITY CHECKLIST
**Application:** Stockifyy Data Portal  
**Date:** 2025-08-04

Complete every item before going live. Check off each one.

---

## SECRETS & ENVIRONMENT

- [ ] `JWT_SECRET` is set to a cryptographically random 64+ byte string  
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] `DATABASE_URL` uses a dedicated app DB user with least-privilege permissions (SELECT/INSERT/UPDATE/DELETE only on app tables — no DROP, no CREATE)
- [ ] MinIO credentials are changed from the defaults (`minioadmin` / `minioadmin123`)
- [ ] `.env.production` is NOT committed to the repository (verified by `git log --all --name-only | grep .env`)
- [ ] `SESSION_COOKIE_NAME` is set (or the default `stockifyy_session` is acceptable)
- [ ] All `.env.*` files are listed in `.gitignore` (already done)

---

## AUTHENTICATION

- [ ] All default/test user accounts removed from production DB
- [ ] `super_admin` account has a strong unique password (20+ chars, not reused anywhere)
- [ ] Reviewed list of active users in `users` table — only known employees present
- [ ] Confirmed `isActive = false` for any departed users

---

## NETWORK & INFRASTRUCTURE

- [ ] App runs behind HTTPS with a valid TLS certificate (Let's Encrypt / Cloudflare / etc.)
- [ ] `NODE_ENV=production` is set — enables `Secure` cookie flag
- [ ] Reverse proxy (Nginx / Caddy / Cloudflare) is in front of Next.js process
- [ ] Port 3000/3001 is NOT exposed directly to the public internet — only the proxy is
- [ ] Database port (5432) is NOT accessible from the internet — only from the app server
- [ ] MinIO port is NOT accessible from the internet (if used)
- [ ] Firewall rules reviewed and tightened

---

## APPLICATION SECURITY HEADERS (verify with curl -I)

- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Content-Security-Policy` header present
- [ ] `Strict-Transport-Security` header present (HTTPS only)

---

## RATE LIMITING

- [ ] Login rate limiter active (10 attempts / 15 min per IP)
- [ ] **Recommended before launch:** Replace in-memory rate limiter with Redis-backed store (e.g. Upstash) to survive server restarts and multi-process deployments

---

## DATA EXPOSURE

- [ ] Confirmed export endpoints require login (TEST 1 from SECURITY_TEST_PLAN.md passes)
- [ ] Decided whether portal read APIs (`/api/portal/daily`, etc.) should require login or can remain public
- [ ] No PII (user emails, passwords) returned in any API response beyond what is needed

---

## MONITORING & LOGGING

- [ ] Server logs collected and retained (minimum 30 days)
- [ ] Audit log table (`audit_logs`) monitored for unusual import activity
- [ ] Alert set up for repeated 429s (rate limit hits) on the login endpoint
- [ ] Alert set up for 5xx error spikes

---

## DEPENDENCIES

- [ ] Run `npm audit` — address all CRITICAL and HIGH findings before launch
  ```bash
  npm audit --audit-level=high
  ```
- [ ] `npm outdated` reviewed — keep Next.js and `jose` on latest patch

---

## FINAL GO/NO-GO

All items above checked? → **GO**  
Any CRITICAL item unchecked? → **NO-GO** — resolve before launch
