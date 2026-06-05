# Project Blueprint: Automated Affiliate Review Site (postyim.com)

> **Version:** 2.0 — AI-Assisted Editorial Platform  
> **Domain:** [postyim.com](https://postyim.com)  
> **Primary Language:** English (Global SEO)  
> **Related Docs:** [MVP Scope](./docs/mvp-scope.md) · [Database Schema](./docs/database-schema.md)

---

## 1. Project Overview

โปรเจค **AI-Assisted Editorial Platform** สำหรับสร้างเว็บไซต์รีวิวสินค้า Affiliate — AI ช่วย draft content แต่ **มนุษย์ approve ก่อน publish** เพื่อคุณภาพ SEO, E-E-A-T และ compliance

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15+ (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL 17 + Drizzle ORM |
| AI Engine | Google Gemini (`gemini-2.0-flash` draft, `gemini-2.0-pro` final) |
| Job Queue | Inngest or Trigger.dev (Phase 1.5; cron for MVP bootstrap) |
| Hosting | Vercel (frontend) + PostgreSQL (Neon/Supabase for prod) |
| CDN | Vercel Image Optimization / Cloudinary |

### Affiliate Networks

| Network | MVP | Phase |
|---------|-----|-------|
| Amazon Associates (PA-API) | ✅ | v1 |
| ClickBank | — | Phase 2 |
| CJ Affiliate | — | Phase 2 |
| ShareASale | — | Phase 2 |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                              │
│  Next.js App Router · ISR (24h) · JSON-LD · OG Tags · Sitemap          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
┌─────────────────────────────────────────────────────────────────────────┐
│                          STORAGE LAYER                                  │
│  PostgreSQL — products, reviews, campaigns, quality scores, job logs   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI CONTENT GENERATION LAYER                          │
│  Gemini API · Persona Templates · Quality Gate · Review Versions       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA INGESTION LAYER                               │
│  Affiliate Adapters · Cron/Queue Jobs · Rate Limit Protection           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Content Workflow

```
Campaign → Ingest Products → AI Generate → Quality Gate → Admin Approve → Publish
                                    ↓ fail              ↓ reject
                                 failed              regenerate / archive
```

**Review statuses:** `draft` → `generating` → `pending_review` → `approved` → `scheduled` → `published`

---

## 3. Database Schema

Schema เต็มอยู่ใน [`docs/database-schema.md`](./docs/database-schema.md)

### MVP Tables

| Table | Purpose |
|-------|---------|
| `categories` | Category hierarchy (pSEO silos) |
| `campaigns` | Keyword/category campaigns per affiliate network |
| `authors` | E-E-A-T author personas |
| `products` | Raw + normalized product data |
| `reviews` | Generated review content + workflow status |
| `review_versions` | Content history on regenerate |
| `content_quality_scores` | Automated quality gate results |
| `keywords` | Target SEO keyword per review |
| `media_assets` | Product images + alt text |
| `affiliate_clicks` | Click tracking |
| `job_runs` | Background job execution records |
| `cron_logs` | Detailed job logs |

### Local Database

```
Database: postyim
Connection: postgresql://localhost:5432/postyim
```

---

## 4. MVP Scope

รายละเอียดครบใน [`docs/mvp-scope.md`](./docs/mvp-scope.md)

**สรุป In Scope v1:**
- Amazon PA-API เท่านั้น
- English only
- Admin dashboard + manual publish
- Review pages + ISR + JSON-LD
- Core compliance pages (disclosure, privacy)
- Quality gate ก่อน review queue

**Out of Scope v1:**
- Multi-language, comparison pages, auto-publish
- ClickBank / CJ / ShareASale
- Advanced analytics

---

## 5. Legal & Compliance

### FTC (US — บังคับสำหรับ Global audience)

- **Affiliate Disclosure** ชัดเจนทุกหน้ารีวิว (above the fold หรือก่อน affiliate links)
- หน้า `/disclosure` อธิบายความสัมพันธ์ affiliate อย่างละเอียด
- ห้ามเขียน content ที่ misleading เกี่ยวกับ product benefits

### Amazon Associates Operating Agreement

- Disclaimer: *"As an Amazon Associate I earn from qualifying purchases."*
- **ห้าม cache ราคาเกิน 24 ชม.** — ใช้ ISR + price refresh job
- ใช้รูปและข้อมูลตาม PA-API terms
- ต้องมี qualifying sales เพื่อรักษา PA-API access

### GDPR / Privacy

- Privacy Policy ที่ `/privacy`
- Cookie consent ถ้ามี analytics
- Hash IP ใน `affiliate_clicks` (ไม่เก็บ raw IP)

### Google Search Quality

- เน้น **Helpful Content** ไม่ใช่แค่หลบ AI detection
- E-E-A-T: author pages, credentials, about page
- 1 product = 1 primary review (ป้องกัน cannibalization)
- `noindex` สำหรับ draft/thin pages

---

## 6. SEO Strategy

### On-Page (ทุกหน้ารีวิว)

- `<title>`, meta description (120–160 chars)
- Open Graph + Twitter Card
- JSON-LD: `Product` + `Review` (+ `BreadcrumbList`)
- Canonical URL
- Internal links: related products, category hub
- Affiliate disclosure in content

### Programmatic SEO (Phase 2+)

- Comparison: `[Product A] vs [Product B] for [Use Case]`
- Best-of: `Best [Category] for [Audience] in [Year]`
- Use-case: `[Product] for [Specific Group]`

### Technical SEO

- Dynamic `/sitemap.xml` (published pages only)
- `/robots.txt` — block `/admin/*`
- ISR `revalidate = 86400`
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1

### Content Quality Rubric

| Check | Threshold |
|-------|-----------|
| Word count | ≥ 1,500 |
| Uniqueness | ≥ 85% vs other reviews |
| Pros & cons | ≥ 3 each, data-grounded |
| Rating | Decimal with justification |
| Disclosure | Present |
| Prohibited AI phrases | Blocklist pass |

---

## 7. AI Content Generation

### Model Strategy

| Task | Model | Reason |
|------|-------|--------|
| Spec parsing / summarization | `gemini-2.0-flash` | Fast, cheap, large context |
| Final review writing | `gemini-2.0-pro` | Quality, nuance |
| Quality evaluation | `gemini-2.0-flash` | Checklist scoring |

### Prompt Engineering Rules

1. **Persona:** Assign author from `authors` table — expertise, tone, experience
2. **Randomize structure:** Rotate section order, heading styles, opening hooks
3. **User intent:** Match keyword intent (commercial, comparison, informational)
4. **Ground in data:** Pros/cons must reference actual product specs
5. **Prohibited phrases blocklist:**
   - "In conclusion..."
   - "As an AI..."
   - "It's worth noting that..."
   - "In today's fast-paced world..."
   - "Look no further..."
6. **Rating:** Decimal score (e.g. 4.3/5) with paragraph justification
7. **Disclosure:** Include affiliate disclosure paragraph in every review

### Cost Control

- Token budget per campaign/day (config in `campaigns.config`)
- Flash for drafts; Pro only for final pass
- Log token usage in `job_runs.error_details` metadata

---

## 8. Affiliate Adapter Pattern

```typescript
interface AffiliateAdapter {
  network: AffiliateNetwork;
  searchProducts(params: SearchParams): Promise<RawProduct[]>;
  getProduct(externalId: string): Promise<RawProduct>;
  buildAffiliateLink(externalId: string): string;
}
```

**MVP:** `AmazonAdapter` implements interface  
**Phase 2:** `ClickBankAdapter`, `CJAdapter`, `ShareASaleAdapter`

### Amazon PA-API Notes

- Rate limit: respect PA-API throttling (track in `job_runs`)
- Store full response in `products.raw_data`
- Normalize to `products.specs` for AI input
- Refresh prices every 24h max

---

## 9. Admin Dashboard

### MVP Features

| Feature | Route |
|---------|-------|
| Login | `/admin/login` |
| Dashboard overview | `/admin` |
| Campaigns CRUD | `/admin/campaigns` |
| Products list | `/admin/products` |
| Review queue | `/admin/reviews` |
| Approve / Reject / Regenerate | `/admin/reviews/[id]` |
| Job logs | `/admin/jobs` |

### Auth (MVP)

- Simple password auth via env `ADMIN_PASSWORD` + session cookie
- Upgrade to NextAuth/Clerk in Phase 2

---

## 10. Background Jobs

| Job | Type | Schedule | MVP |
|-----|------|----------|-----|
| Product ingestion | `product_ingestion` | Daily per campaign | ✅ |
| Price refresh | `price_refresh` | Every 24h | ✅ |
| Content generation | `content_generation` | On queue | ✅ |
| Quality check | `quality_check` | After generation | ✅ |
| Sitemap generation | `sitemap_generation` | On publish | ✅ |

**MVP:** Next.js Route Handlers + `node-cron` or Vercel Cron  
**Phase 1.5:** Migrate to Inngest/Trigger.dev for retries + observability

---

## 11. Infrastructure

### Development

```bash
# PostgreSQL (local)
brew services start postgresql@17
psql postgresql://localhost:5432/postyim

# Next.js
pnpm dev
```

### Production (Target)

| Service | Provider |
|---------|----------|
| Frontend | Vercel |
| Database | Neon or Supabase |
| Images | Cloudinary or Vercel Image |
| Jobs | Inngest (Vercel integration) |
| Monitoring | Sentry |
| Secrets | Vercel Environment Variables |

### CI/CD

- GitHub Actions: lint, typecheck, test, drizzle migrate
- Preview deployments on PR

---

## 12. Development Roadmap

| Step | Task | Doc Reference |
|------|------|---------------|
| 0 | Legal page templates (disclosure, privacy) | MVP Scope |
| 1 | Next.js + Tailwind + shadcn + Drizzle setup | This doc §3 |
| 2 | Database schema + migrations | `docs/database-schema.md` |
| 3 | Admin dashboard (campaign CRUD) | MVP Scope §Admin |
| 4 | Amazon adapter + ingestion job | §8 |
| 5 | Gemini service + quality gate | §7 |
| 6 | Review pages + ISR + JSON-LD | §6 |
| 7 | Sitemap, robots, internal links | §6 |
| 8 | Manual publish workflow | §2 Workflow |
| 9 | Monitoring + job logs | §10 |

### Cursor Prompts (Copy-Paste Ready)

**Step 1 — Setup:**
> Create a Next.js 15 project with App Router, TypeScript, Tailwind CSS, shadcn/ui, and PostgreSQL using Drizzle ORM. Connect to `postgresql://localhost:5432/postyim`. English only for v1. See `docs/database-schema.md` and `docs/mvp-scope.md`.

**Step 2 — Database:**
> Implement Drizzle schema for all MVP tables in `docs/database-schema.md`. Generate and run migrations.

**Step 3 — Amazon Adapter:**
> Create `AmazonAdapter` implementing the AffiliateAdapter interface. Ingest products by campaign keywords. Store in `products` table. Log to `job_runs` and `cron_logs`.

**Step 4 — AI Service:**
> Create Gemini integration using `@google/genai`. Generate reviews with persona templates and quality gate per `instruction-prompt.md` §7. Save versions to `review_versions`.

**Step 5 — Admin + Frontend:**
> Build admin review queue with approve/reject. Public review pages at `/reviews/[slug]` with ISR (86400), JSON-LD Product+Review schema, OG tags, affiliate disclosure.

---

## 13. Success Metrics

| Metric | 90-Day Target |
|--------|---------------|
| Published reviews | ≥ 20 |
| Google indexed | ≥ 15 |
| Core Web Vitals | All "Good" |
| Affiliate clicks | Trackable |
| Account status | No penalties |

---

## 14. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Google thin content penalty | Quality gate + human approval + E-E-A-T |
| Amazon PA-API revoked | Manual sales first; 24h price refresh |
| Affiliate account ban | Full disclosure; accurate claims |
| Gemini cost overrun | Token budgets; Flash for drafts |
| Duplicate pSEO pages | 1 product = 1 review; uniqueness check |

---

## Environment Variables

See `.env.example` in project root.
