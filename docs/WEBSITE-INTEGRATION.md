# Website Integration Guide

## How to connect the Stockifyy Data Portal with stockifyy-flame.vercel.app

The data portal is **already built inside** the main Stockifyy Next.js project at:
`C:\Users\abdul\OneDrive\Documents\stockifyy`

The portal routes live at `/data-portal/*` inside the same Next.js app.

---

## Integration Status

The portal is integrated into the existing website project. Here is what was done:

1. The existing `src/app/` directory now includes `data-portal/` routes
2. The homepage at `/` has a "Open Data Portal" link
3. The portal uses the Stockifyy brand colours defined in `globals.css`

---

## Deploying to Vercel (stockifyy-flame.vercel.app)

### Step 1: Connect the repository
If not already on GitHub:
```bash
cd C:\Users\abdul\OneDrive\Documents\stockifyy
git init
git add .
git commit -m "Add Stockifyy Data Portal"
git remote add origin https://github.com/YOUR_USERNAME/stockifyy.git
git push -u origin main
```

### Step 2: Set up production database
Use Neon (free tier available) or Supabase for PostgreSQL:
- Create a new PostgreSQL project
- Get the connection string

### Step 3: Set Vercel environment variables
In Vercel project settings → Environment Variables:
```
DATABASE_URL=postgresql://...your-neon-or-supabase-url...
JWT_SECRET=generate-32-char-random-string
SESSION_COOKIE_NAME=stockifyy_session
NEXT_PUBLIC_APP_URL=https://stockifyy-flame.vercel.app
```

### Step 4: Deploy
```bash
vercel --prod
```

The portal will be live at:
`https://stockifyy-flame.vercel.app/data-portal`

---

## Adding "Data Portal" to the existing website navigation

If the existing website has a navbar component, add this link:
```tsx
<Link href="/data-portal">Data Portal</Link>
```

---

## Data Import (Production)

After deployment, to import real market data:

1. Open https://stockifyy-flame.vercel.app/data-portal/admin/login
2. Log in with admin credentials
3. Navigate to Import Centre
4. Upload daily market data CSV
5. Trigger weekly aggregation

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | 32+ char secret for sessions | `random_32_char_string` |
| `SESSION_COOKIE_NAME` | Cookie name | `stockifyy_session` |
| `NEXT_PUBLIC_APP_URL` | Public URL | `https://stockifyy-flame.vercel.app` |
| `REDIS_URL` | Redis URL (optional for caching) | `redis://localhost:6379` |

---

## Rollback Procedure

If you need to revert the data portal:
1. In Vercel: Deployments → Select previous deployment → Promote to Production
2. In git: `git revert HEAD` and push

The data portal is isolated under `/data-portal/*` so reverting it does not affect the rest of the website.
