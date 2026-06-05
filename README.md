# Postyim

AI-assisted editorial platform for affiliate product reviews — [postyim.com](https://postyim.com)

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** + shadcn/ui
- **PostgreSQL 17** + Drizzle ORM
- **English-first** global SEO (MVP)

## Docs

- [Project Blueprint](./instruction-prompt.md)
- [MVP Scope](./docs/mvp-scope.md)
- [Database Schema](./docs/database-schema.md)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 17 (`brew services start postgresql@17`)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — health check at [/api/health](http://localhost:3000/api/health).

## Database Scripts

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate migration from schema changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema directly (dev only) |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed categories + authors |

## Project Structure

```
src/
├── app/                 # Next.js App Router pages & API
├── components/ui/       # shadcn/ui components
├── db/
│   ├── index.ts         # Drizzle client
│   ├── schema/          # Table definitions
│   └── seed.ts          # Development seed
└── lib/                 # Utilities
drizzle/                 # SQL migrations
docs/                    # Project documentation
```

## Development Roadmap

- [x] Step 1 — Project setup (Next.js, Tailwind, shadcn, Drizzle)
- [x] Step 2 — Database schema + migrations
- [x] Step 3 — Amazon PA-API adapter + product ingestion
- [x] Step 4 — Gemini content pipeline + quality gate
- [x] Step 5 — Admin dashboard + review pages
- [x] Phase 1.5 — Production readiness (see below)

## Phase 1.5 — Production Readiness

See **[docs/deployment.md](./docs/deployment.md)** for the full launch checklist.

| Feature | Status |
|---------|--------|
| Campaign CRUD in admin | `/admin/campaigns/new`, `/admin/campaigns/[id]` |
| Production readiness panel | Admin dashboard + `/api/health` |
| Vercel cron (daily pipeline) | `/api/cron/daily` via `vercel.json` |
| CI (lint + migrate + build) | `.github/workflows/ci.yml` |
| Author pages (E-E-A-T) | `/authors/[slug]` |
| Product image sync | Auto-sync `media_assets` on ingestion |
| Batch pipeline script | `pnpm pipeline:run` |

```bash
# Run full pipeline locally (ingest → prices → generate)
pnpm pipeline:run

# Check production readiness
curl http://localhost:3000/api/health
```

## Product Ingestion (Step 3)

Uses **Amazon PA-API** when credentials are set, otherwise **mock mode** (`AMAZON_MOCK=true`).

```bash
# Seed sample campaign
pnpm db:seed

# Ingest all active campaigns (CLI)
pnpm jobs:ingest --all

# Or via API (dev: no auth required)
curl -X POST http://localhost:3000/api/jobs/ingest

# Production: protect with CRON_SECRET
curl -X POST http://localhost:3000/api/jobs/ingest \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"all": true}'
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs/ingest` | POST | Ingest products for campaign(s) |
| `/api/jobs/refresh-prices` | POST | Refresh prices for active products |
| `/api/campaigns` | GET | List campaigns |
| `/api/products` | GET | List ingested products |

## Content Generation (Step 4)

Uses **Gemini** when `GEMINI_API_KEY` is set, otherwise **mock mode** (`GEMINI_MOCK=true`).

```bash
# Generate reviews for eligible products (no existing review or failed/rejected)
pnpm jobs:generate-reviews

# Limit batch size
pnpm jobs:generate-reviews --limit=3

# Via API
curl -X POST http://localhost:3000/api/jobs/generate-reviews \
  -H "Content-Type: application/json" \
  -d '{"limit": 3}'

# List reviews
curl http://localhost:3000/api/reviews
curl "http://localhost:3000/api/reviews?status=pending_review"
```

Quality gate checks: word count ≥ 1,500, uniqueness, spec accuracy, SEO meta, disclosure, prohibited phrases. Passing reviews move to `pending_review`; failing ones stay `failed`.

## Admin & Public Site (Step 5)

### Admin (password-protected)

Default dev login: `postyim-dev` (or set `ADMIN_PASSWORD` in `.env.local`)

| Route | Description |
|-------|-------------|
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard overview |
| `/admin/reviews` | Review queue (approve / reject / publish) |
| `/admin/products` | Synced product catalog |
| `/admin/campaigns` | Campaign list + create/edit |
| `/admin/campaigns/new` | Create campaign |
| `/admin/campaigns/[id]` | Edit campaign + run ingestion |
| `/admin/jobs` | Background job logs |

### Public pages

| Route | Description |
|-------|-------------|
| `/reviews` | Published review index |
| `/reviews/[slug]` | Single review (ISR 24h, JSON-LD, OG tags) |
| `/disclosure` | Affiliate disclosure |
| `/privacy` | Privacy policy |
| `/about` | About + author bios |
| `/authors/[slug]` | Author profile + published reviews |
| `/sitemap.xml` | Dynamic sitemap |
| `/robots.txt` | Crawl rules (blocks `/admin/*`) |

### Publish workflow

```bash
# 1. Login (save session cookie)
curl -c cookies.txt -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"postyim-dev"}'

# 2. Approve & publish a review
curl -b cookies.txt -X POST http://localhost:3000/api/admin/reviews/REVIEW_ID \
  -H "Content-Type: application/json" \
  -d '{"action":"approve_and_publish"}'
```
