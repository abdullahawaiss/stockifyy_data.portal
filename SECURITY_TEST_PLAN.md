# SECURITY TEST PLAN
**Application:** Stockifyy Data Portal  
**Date:** 2025-08-04

---

## TEST 1 — Export endpoint authentication

```bash
# Should return 401 (not a CSV download)
curl -v http://localhost:3001/api/portal/daily/export?date=2025-08-01
curl -v http://localhost:3001/api/portal/weekly/export?weekStart=2025-07-28

# Expected: HTTP 401 {"error":"Unauthorized"}
```

---

## TEST 2 — CSV formula injection prevention

After logging in and downloading a CSV, open in a text editor and verify:
- Any cell value that started with `=`, `+`, `-`, or `@` is prefixed with `'`
- Excel/LibreOffice renders it as text, not a formula

Manual check: If a test company symbol were `=1+1`, the CSV cell should contain `'=1+1`.

---

## TEST 3 — Login rate limiting

```bash
# Run 15 rapid login attempts — attempt 11+ should return 429
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Expected: first 10 return 401, attempts 11-15 return 429
```

---

## TEST 4 — Session invalidated on logout

```bash
# 1. Login and capture cookie
LOGIN=$(curl -s -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASS"}')
echo $LOGIN

# 2. Confirm an authenticated endpoint works
curl -s -b cookies.txt http://localhost:3001/api/portal/daily/export?date=2025-08-01 | head -1

# 3. Logout
curl -s -b cookies.txt -X POST http://localhost:3001/api/auth/logout

# 4. Try using the cookie again — should return 401
curl -s -b cookies.txt http://localhost:3001/api/portal/daily/export?date=2025-08-01

# Expected step 4: HTTP 401 {"error":"Unauthorized"}
```

---

## TEST 5 — JWT secret not hardcoded

```bash
# Temporarily unset JWT_SECRET and try to start server
# Expected: Server should fail to start with:
# Error: JWT_SECRET environment variable is required
```

---

## TEST 6 — Security headers present

```bash
curl -I http://localhost:3001/data-portal

# Expected headers in response:
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
# Content-Security-Policy: default-src 'self'; ...
```

---

## TEST 7 — importType allowlist

```bash
# Should return 400 for unknown import type
curl -s -b cookies.txt -X POST http://localhost:3001/api/portal/import \
  -F "file=@test.csv" \
  -F "importType=malicious_type"

# Expected: HTTP 400 {"error":"Invalid importType"}
```

---

## TEST 8 — Date parameter validation

```bash
# Should return 400 for invalid date
curl -s http://localhost:3001/api/portal/daily/export?date=../../etc/passwd
curl -s http://localhost:3001/api/portal/daily/export?date=not-a-date

# Expected: HTTP 400 {"error":"Invalid date format. Use YYYY-MM-DD."}
```

---

## TEST 9 — .gitignore protects secrets

```bash
# From project root (if git is initialized):
git status

# .env.local should NOT appear in untracked files
# Expected: .env.local is not listed
```

---

## TEST 10 — No error details leaked from import

```bash
# Trigger a server error (corrupt CSV with null bytes)
printf "symbol,date\n\x00\x01" > bad.csv
curl -s -b cookies.txt -X POST http://localhost:3001/api/portal/import -F "file=@bad.csv"

# Expected: {"success":false,"message":"Import failed. Please check your file and try again."}
# NOT: stack trace, file path, or DB schema info
```
