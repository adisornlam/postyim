# Phase 1.5 Deployment Guide — Postyim

This guide walks through taking the MVP from local mock mode to a production-ready deployment on Vercel.

## Prerequisites

- GitHub repository connected to Vercel
- [Neon](https://neon.tech) or [Supabase](https://supabase.com) PostgreSQL database
- Amazon Associates account with PA-API access
- Google AI Studio API key for Gemini

## Step 1 — Provision production database

1. Create a PostgreSQL 17 database on Neon or Supabase.
2. Copy the connection string (use the pooled connection URL on Vercel).
3. Run migrations locally against production once:

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate
pnpm db:seed
```

## Step 2 — Configure Vercel environment variables

Set these in the Vercel project settings:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Production PostgreSQL URL |
| `AMAZON_ACCESS_KEY` | PA-API access key |
| `AMAZON_SECRET_KEY` | PA-API secret key |
| `AMAZON_PARTNER_TAG` | Your associate tag |
| `AMAZON_REGION` | `us-east-1` (or your marketplace) |
| `AMAZON_MOCK` | `false` |
| `GEMINI_API_KEY` | Google AI API key |
| `GEMINI_MOCK` | `false` |
| `CRON_SECRET` | Random 32+ char secret |
| `ADMIN_PASSWORD` | Strong admin password |
| `AUTH_SECRET` | Random 32+ char secret |
| `NEXT_PUBLIC_SITE_URL` | `https://postyim.com` |
| `NEXT_PUBLIC_SITE_NAME` | `Postyim` |

## Step 3 — Deploy

```bash
git push origin main
```

Vercel will build and deploy automatically. The included `vercel.json` registers a daily cron job at `/api/cron/daily` (06:00 UTC).

Cron authentication uses the `Authorization: Bearer <CRON_SECRET>` header. Vercel injects this automatically when `CRON_SECRET` is set.

## Step 4 — Verify health check

After deploy, open:

```
https://postyim.com/api/health
```

Expected response includes:

- `status: "ok"`
- `readiness.score` showing configured integrations
- `integrations.amazon.mock: false`
- `integrations.gemini.mock: false`

## Step 5 — Create your first live campaign

1. Log in at `/admin/login`
2. Open **Dashboard** → check **Production readiness** panel
3. Go to **Campaigns** → **New campaign**
4. Add keywords, category, and Amazon search settings
5. Save, then click **Run ingestion now**

## Step 6 — Generate and publish reviews

### Option A — Admin UI

1. Open **Reviews** queue
2. Approve drafts and publish

### Option B — Batch pipeline script

Run locally against production DB (or via CI):

```bash
pnpm pipeline:run
```

This runs: ingest all active campaigns → refresh prices → generate up to 10 reviews.

### Option C — Cron (automatic)

The daily cron at `/api/cron/daily` runs:

1. Product ingestion for all active campaigns
2. Price refresh for published products
3. Content generation (limit 5 per run)

## Step 7 — Submit sitemap

After publishing reviews:

```
https://postyim.com/sitemap.xml
```

Submit this URL in Google Search Console.

## Production checklist

Use the admin dashboard **Production readiness** panel or `/api/health` to confirm:

- [ ] Database connected
- [ ] Amazon PA-API live (not mock)
- [ ] Gemini live (not mock)
- [ ] CRON_SECRET set
- [ ] ADMIN_PASSWORD and AUTH_SECRET set
- [ ] NEXT_PUBLIC_SITE_URL uses HTTPS
- [ ] At least 1 active campaign with keywords
- [ ] ≥20 published reviews (90-day target)
- [ ] Sitemap submitted to Search Console

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Cron returns 401 | Set `CRON_SECRET` in Vercel env |
| Admin login fails | Verify `ADMIN_PASSWORD` and `AUTH_SECRET` |
| No products ingested | Check campaign status is `active` and keywords are set |
| Mock content still generated | Set `GEMINI_MOCK=false` and add `GEMINI_API_KEY` |
| Images broken | Ensure Amazon product images sync via ingestion; check `media_assets` table |

## Next phase

After production is stable, proceed to **Phase 2**:

- Comparison pages (`A vs B`)
- Best-of list pages
- Second affiliate network
- Auto-publish when quality score ≥ threshold
- Search Console API integration

See [`docs/mvp-scope.md`](./mvp-scope.md) for the full roadmap.
