# MVP Scope Document — postyim.com

> **Version:** 1.0  
> **Target:** Automated Affiliate Review Site (AI-Assisted Editorial Platform)  
> **Timeline:** 4–6 weeks  
> **Primary Market:** English / Global SEO

---

## Vision (MVP)

สร้างแพลตฟอร์ม **AI-Assisted Editorial Platform** ที่ช่วย draft รีวิวสินค้าจาก Amazon โดยมนุษย์เป็นผู้ approve ก่อน publish — ไม่ใช่ระบบ generate แล้วปล่อยอัตโนมัติทั้งหมด

---

## In Scope (v1 — ต้องทำ)

### Infrastructure & Core

| Item | Details |
|------|---------|
| Framework | Next.js 15+ App Router, TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (local: `postyim`) + Drizzle ORM |
| Hosting (dev) | Local development; production target: Vercel |
| Language | **English only** (ออกแบบ slug/URL ให้รองรับ i18n ในอนาคต) |

### Affiliate Integration

| Item | Details |
|------|---------|
| Network | **Amazon Associates (PA-API) เท่านั้น** |
| Adapter | Interface ที่ขยายได้สำหรับ network อื่นใน Phase 2 |
| Data sync | ดึง product ตาม campaign keywords/category |
| Price display | แสดงราคาจาก API; fallback "Check price on Amazon" เมื่อ stale |
| Link tracking | เก็บ affiliate link + click events พื้นฐาน |

### AI Content Pipeline

| Item | Details |
|------|---------|
| Engine | Google Gemini (`gemini-2.0-flash` draft, `gemini-2.0-pro` final) |
| Input | Raw product data (title, specs, price, images) |
| Output | Title, meta description, body (Markdown/HTML), pros/cons, rating |
| Templates | Randomized prompt templates + persona assignment |
| Quality Gate | Automated checklist ก่อนเข้า review queue (ดู `docs/database-schema.md`) |

### Admin Dashboard

| Feature | Priority |
|---------|----------|
| Login (protected route, env-based auth) | P0 |
| Campaign CRUD (name, keywords, category, daily limit) | P0 |
| Product list (synced from Amazon) | P0 |
| Review queue (draft → pending_review → approved → published) | P0 |
| Manual approve / reject / regenerate | P0 |
| Cron/job status logs | P1 |

### Public Frontend

| Page | Priority |
|------|----------|
| Homepage (featured reviews, categories) | P0 |
| Single product review (`/reviews/[slug]`) | P0 |
| Category hub (`/category/[slug]`) | P1 |
| Affiliate Disclosure (`/disclosure`) | P0 |
| Privacy Policy (`/privacy`) | P0 |
| About (`/about`) | P1 |
| Contact (`/contact`) | P2 |

### SEO (MVP)

| Item | Details |
|------|---------|
| ISR | `revalidate = 86400` (24h) สำหรับ review pages |
| Metadata | title, description, OG tags, Twitter card |
| JSON-LD | `Product` + `Review` schema ทุกหน้ารีวิว |
| Sitemap | Dynamic `/sitemap.xml` จาก published reviews |
| robots.txt | Allow crawl; block `/admin/*` |
| Canonical URLs | 1 product = 1 primary review URL |
| Internal linking | Related products ใน review page |

### Background Jobs

| Job | Schedule |
|-----|----------|
| Product ingestion (per campaign) | Configurable (default: daily) |
| Price refresh (published products) | Every 24h |
| Content generation (queued) | On-demand + batch |

### Compliance (MVP — บังคับ)

- FTC Affiliate Disclosure ทุกหน้ารีวิว + หน้า `/disclosure`
- Amazon Associate disclaimer: *"As an Amazon Associate I earn from qualifying purchases."*
- ไม่ cache ราคา Amazon เกิน 24 ชม.
- Cookie notice พื้นฐาน (ถ้ามี analytics)

---

## Out of Scope (v1 — ยังไม่ทำ)

| Item | Phase |
|------|-------|
| ClickBank, CJ Affiliate, ShareASale | Phase 2 |
| Multi-language (i18n UI/content) | Phase 2 |
| Auto-publish without human approval | Phase 2 |
| Comparison pages (`A vs B`) | Phase 2 |
| Best-of list pages (`Top 10 ...`) | Phase 2 |
| Search Console API integration | Phase 2 |
| GA4 / advanced analytics | Phase 2 |
| A/B testing prompt templates | Phase 3 |
| Backlink / outreach automation | Phase 3 |
| Mobile app | Never (web only) |
| User comments / ratings | Phase 3 |
| Email newsletter | Phase 3 |

---

## Content Workflow (MVP)

```
┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌───────────┐
│ Campaign     │ → │ Ingest      │ → │ AI Generate  │ → │ Quality     │ → │ Admin     │ → Publish
│ Created      │    │ Products    │    │ Draft        │    │ Gate        │    │ Approve   │
└──────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
                                              │
                                    Fail → status: `failed`
                                    Pass → status: `pending_review`
```

### Review Status Flow

```
draft → generating → pending_review → approved → scheduled → published
                  ↘ failed          ↘ rejected
```

- **MVP rule:** ทุก review ต้องผ่าน `pending_review` และ admin approve ก่อน `published`
- **Reject:** กลับไป regenerate หรือ archive

---

## Quality Gate Criteria (Minimum to enter Review Queue)

| Check | Threshold |
|-------|-----------|
| Word count | ≥ 1,500 words |
| Uniqueness vs other reviews in DB | ≥ 85% (similarity check) |
| Spec accuracy | Key specs mentioned match raw product data |
| Prohibited phrases | ไม่มี AI clichés (blocklist) |
| Pros & cons | ≥ 3 each, grounded in product data |
| Rating | Decimal score (e.g. 4.3/5) with justification |
| Meta description | 120–160 characters |
| Affiliate disclosure | Present in content body |

---

## Success Metrics (MVP — 90 days)

| Metric | Target |
|--------|--------|
| Published reviews | ≥ 20 high-quality pages |
| Google indexed pages | ≥ 15 |
| Core Web Vitals | All "Good" on published pages |
| Organic impressions | Baseline established (Search Console manual) |
| Affiliate clicks | Trackable via `affiliate_clicks` table |
| Zero manual actions | No Google penalties, no Amazon account issues |

---

## Development Phases (Post-MVP)

### Phase 2 (Weeks 7–12)
- Comparison pages + schema
- Second affiliate network
- Auto-publish when quality score ≥ threshold
- Search Console API

### Phase 3 (Month 4+)
- Content refresh automation (6-month cycle)
- A/B prompt testing
- Advanced analytics & conversion tracking

---

## Environment Variables (MVP)

```env
# Database
DATABASE_URL=postgresql://localhost:5432/postyim

# Amazon PA-API
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_PARTNER_TAG=
AMAZON_REGION=us-east-1

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL_DRAFT=gemini-2.0-flash
GEMINI_MODEL_FINAL=gemini-2.0-pro

# Admin Auth (MVP: simple)
ADMIN_PASSWORD=
AUTH_SECRET=

# Site
NEXT_PUBLIC_SITE_URL=https://postyim.com
NEXT_PUBLIC_SITE_NAME=Postyim
```

---

## Definition of Done (MVP)

- [ ] Admin สร้าง campaign → sync products จาก Amazon ได้
- [ ] AI generate review draft → ผ่าน quality gate → อยู่ใน review queue
- [ ] Admin approve → review publish ที่ `/reviews/[slug]`
- [ ] หน้ารีวิวมี JSON-LD, OG, ISR, disclosure
- [ ] `/sitemap.xml` และ `/robots.txt` ทำงาน
- [ ] Core pages: disclosure, privacy ครบ
- [ ] Job logs บันทึกใน DB
- [ ] ไม่มี secret ใน git (ใช้ `.env.local`)
