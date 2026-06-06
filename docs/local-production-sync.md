# Localhost ↔ Production Sync

Use Cursor on localhost for editorial work, then push approved reviews to
`postyim.com` without redeploying for every content change.

## Why this exists

- **Localhost**: full codebase access for Cursor, safe iteration, live Gemini generation against your local DB.
- **Production**: public site + production PostgreSQL on your host.
- **Sync bridge**: copies product + review bundles to production over HTTPS.

This is the recommended **pre-PA-API** workflow when Amazon catalog ingestion is still in mock mode.

## Setup (one time)

### 1. Generate a shared secret

```bash
openssl rand -base64 32
```

### 2. Local `.env.local`

```env
DATABASE_URL=postgresql://localhost:5432/postyim
POSTYIM_REMOTE_URL=https://postyim.com
REMOTE_SYNC_SECRET=your-shared-secret
GEMINI_MOCK=false
GEMINI_API_KEY=...
SETTINGS_ENCRYPTION_KEY=...
```

### 3. Production server env (one-time setup)

Create `/var/www/postyim/prod/current/.env.production.local` on the host
(manually — this file is gitignored and is **not** copied by CI/CD):

```env
NEXT_PUBLIC_SITE_URL=https://postyim.com
POSTYIM_REMOTE_URL=https://postyim.com
REMOTE_SYNC_SECRET=same-secret-as-localhost
```

Deploy only updates application code. Existing env files on the server are kept
across deploys because they are gitignored.

Local `.env.local` remains the source of truth for localhost development.

## Daily workflow

1. **Add manual product** — Admin → Products → Add manual product (real ASIN + keyword).
2. **Generate review** — Products → Generate review (live Gemini).
3. **QC + approve** — Admin → Reviews → check SEO/QC panel.
4. **Push to production**:

```bash
pnpm sync:status
pnpm sync:push --review-slug=your-product-slug-review --publish
```

Or use **Production sync** on the review detail page when `POSTYIM_REMOTE_URL` is set locally.

5. **Verify live page** — open `https://postyim.com/reviews/...` and confirm affiliate links include `tag=postyim-20`.
6. **Launch checklist** — Admin → Launch checklist (sections A–H).

## CLI reference

| Command | Description |
|---------|-------------|
| `pnpm sync:status` | Ping production sync endpoint |
| `pnpm sync:push --review-slug=...` | Push draft bundle |
| `pnpm sync:push --review-id=...` | Push by review UUID |
| `pnpm sync:push --product-id=...` | Push product only |
| `pnpm sync:push --review-slug=... --publish` | Push and mark published on production |

## Security notes

- `REMOTE_SYNC_SECRET` is required on every sync request (`Authorization: Bearer ...`).
- Sync routes live under `/api/admin/sync/` and are blocked in `robots.txt`.
- Only superadmin can create manual products; sync uses the shared secret (CLI / local admin).

## What gets synced

Each bundle includes:

- Campaign metadata (by slug)
- Keyword (if present)
- Product (ASIN, title, affiliate link, specs, image)
- Review content (title, body, pros/cons, rating, status)
- Latest quality score snapshot (optional)

Production import upserts by ASIN and review slug, then sets canonical URLs using production `NEXT_PUBLIC_SITE_URL`.

## After PA-API unlock

Keep localhost for editorial refinement. You can still sync curated changes, or run ingestion live on production once Amazon credentials are configured and mock mode is disabled.
