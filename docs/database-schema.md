# Database Schema — postyim.com

> **Version:** 1.0  
> **ORM:** Drizzle  
> **Database:** PostgreSQL 17 (`postyim`)

---

## Entity Relationship Diagram

```mermaid
erDiagram
    categories ||--o{ categories : "parent"
    categories ||--o{ campaigns : "belongs to"
    categories ||--o{ products : "belongs to"

    campaigns ||--o{ products : "sources"
    campaigns ||--o{ job_runs : "triggers"

    authors ||--o{ reviews : "writes"

    products ||--o| reviews : "primary review"
    products ||--o{ media_assets : "has"
    products ||--o{ affiliate_clicks : "tracks"

    reviews ||--o{ review_versions : "history"
    reviews ||--o{ content_quality_scores : "scored"
    reviews }o--o{ products : "comparison (via comparison_pages)"

    comparison_pages ||--o{ comparison_page_products : "includes"
    products ||--o{ comparison_page_products : "compared in"

    keywords ||--o{ reviews : "targets"

    job_runs ||--o{ cron_logs : "details"

    categories {
        uuid id PK
        string slug UK
        string name
        uuid parent_id FK
        text description
        int sort_order
        timestamp created_at
        timestamp updated_at
    }

    campaigns {
        uuid id PK
        string name
        string slug UK
        uuid category_id FK
        enum affiliate_network
        enum status
        jsonb keywords
        jsonb config
        int daily_product_limit
        int priority
        timestamp last_synced_at
        timestamp created_at
        timestamp updated_at
    }

    authors {
        uuid id PK
        string slug UK
        string name
        string title
        text bio
        string avatar_url
        jsonb credentials
        jsonb social_links
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    products {
        uuid id PK
        uuid campaign_id FK
        uuid category_id FK
        enum affiliate_network
        string external_id
        string slug UK
        string title
        text description
        jsonb specs
        jsonb raw_data
        decimal price
        string currency
        string affiliate_link
        string image_url
        string duplicate_hash UK
        enum sync_status
        boolean is_active
        timestamp last_synced_at
        timestamp created_at
        timestamp updated_at
    }

    reviews {
        uuid id PK
        uuid product_id FK UK
        uuid author_id FK
        uuid keyword_id FK
        string slug UK
        string title
        text meta_description
        text content
        jsonb pros
        jsonb cons
        decimal rating
        enum status
        string canonical_url
        int word_count
        timestamp published_at
        timestamp scheduled_at
        timestamp created_at
        timestamp updated_at
    }

    review_versions {
        uuid id PK
        uuid review_id FK
        int version_number
        text content
        string title
        text meta_description
        jsonb pros
        jsonb cons
        decimal rating
        string change_reason
        uuid created_by
        timestamp created_at
    }

    content_quality_scores {
        uuid id PK
        uuid review_id FK
        int word_count_score
        int uniqueness_score
        int spec_accuracy_score
        int seo_score
        int overall_score
        jsonb checklist
        boolean passed
        timestamp evaluated_at
    }

    keywords {
        uuid id PK
        string keyword UK
        enum intent
        int search_volume
        enum difficulty
        timestamp created_at
    }

    media_assets {
        uuid id PK
        uuid product_id FK
        enum type
        string url
        string alt_text
        int sort_order
        timestamp created_at
    }

    comparison_pages {
        uuid id PK
        string slug UK
        string title
        text meta_description
        text content
        enum status
        timestamp published_at
        timestamp created_at
        timestamp updated_at
    }

    comparison_page_products {
        uuid id PK
        uuid comparison_page_id FK
        uuid product_id FK
        int sort_order
        text verdict
    }

    affiliate_clicks {
        uuid id PK
        uuid product_id FK
        uuid review_id FK
        string ip_hash
        string user_agent
        string referrer
        timestamp clicked_at
    }

    job_runs {
        uuid id PK
        enum job_type
        uuid campaign_id FK
        enum status
        int items_processed
        int items_failed
        int duration_ms
        jsonb error_details
        timestamp started_at
        timestamp completed_at
    }

    cron_logs {
        uuid id PK
        uuid job_run_id FK
        enum level
        string message
        jsonb metadata
        timestamp created_at
    }
```

---

## Enums

```sql
-- affiliate_network
CREATE TYPE affiliate_network AS ENUM (
  'amazon',
  'clickbank',
  'cj',
  'shareasale'
);

-- campaign_status
CREATE TYPE campaign_status AS ENUM (
  'active',
  'paused',
  'archived'
);

-- product_sync_status
CREATE TYPE product_sync_status AS ENUM (
  'pending',
  'synced',
  'failed',
  'discontinued'
);

-- review_status
CREATE TYPE review_status AS ENUM (
  'draft',
  'generating',
  'pending_review',
  'approved',
  'scheduled',
  'published',
  'rejected',
  'failed',
  'archived'
);

-- keyword_intent
CREATE TYPE keyword_intent AS ENUM (
  'informational',
  'commercial',
  'transactional',
  'comparison'
);

-- keyword_difficulty
CREATE TYPE keyword_difficulty AS ENUM (
  'low',
  'medium',
  'high'
);

-- media_type
CREATE TYPE media_type AS ENUM (
  'image',
  'video'
);

-- job_type
CREATE TYPE job_type AS ENUM (
  'product_ingestion',
  'price_refresh',
  'content_generation',
  'quality_check',
  'sitemap_generation'
);

-- job_status
CREATE TYPE job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

-- log_level
CREATE TYPE log_level AS ENUM (
  'debug',
  'info',
  'warn',
  'error'
);
```

---

## Table Definitions (MVP vs Phase 2)

### MVP Tables (implement first)

| Table | MVP | Notes |
|-------|-----|-------|
| `categories` | ✅ | Category hierarchy for pSEO silos |
| `campaigns` | ✅ | Amazon campaigns only in v1 |
| `authors` | ✅ | E-E-A-T personas |
| `products` | ✅ | Core product data |
| `reviews` | ✅ | Primary content |
| `review_versions` | ✅ | Regeneration history |
| `content_quality_scores` | ✅ | Quality gate results |
| `keywords` | ✅ | Target keyword per review |
| `media_assets` | ✅ | Product images |
| `affiliate_clicks` | ✅ | Basic click tracking |
| `job_runs` | ✅ | Background job tracking |
| `cron_logs` | ✅ | Detailed job logs |

### Phase 2 Tables

| Table | Phase | Notes |
|-------|-------|-------|
| `comparison_pages` | 2 | A vs B pages |
| `comparison_page_products` | 2 | Junction table |

---

## Detailed Field Specifications

### `categories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `slug` | `varchar(100)` | UNIQUE, NOT NULL | URL-safe identifier |
| `name` | `varchar(200)` | NOT NULL | Display name |
| `parent_id` | `uuid` | FK → categories.id, NULL | Self-referencing hierarchy |
| `description` | `text` | | SEO category description |
| `sort_order` | `int` | DEFAULT 0 | Display order |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

**Indexes:** `slug`, `parent_id`

---

### `campaigns`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `name` | `varchar(200)` | NOT NULL | Campaign name |
| `slug` | `varchar(100)` | UNIQUE, NOT NULL | |
| `category_id` | `uuid` | FK → categories.id | Target category |
| `affiliate_network` | `affiliate_network` | NOT NULL, DEFAULT 'amazon' | |
| `status` | `campaign_status` | NOT NULL, DEFAULT 'active' | |
| `keywords` | `jsonb` | NOT NULL, DEFAULT '[]' | Search keywords array |
| `config` | `jsonb` | DEFAULT '{}' | API-specific settings |
| `daily_product_limit` | `int` | DEFAULT 10 | Rate limit protection |
| `priority` | `int` | DEFAULT 0 | Job queue priority |
| `last_synced_at` | `timestamptz` | | Last successful sync |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

**Indexes:** `slug`, `status`, `affiliate_network`

**`config` example (Amazon):**
```json
{
  "searchIndex": "Electronics",
  "minPrice": 50,
  "maxPrice": 500,
  "minRating": 4.0
}
```

---

### `authors`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `slug` | `varchar(100)` | UNIQUE, NOT NULL | Author page URL |
| `name` | `varchar(200)` | NOT NULL | Display name |
| `title` | `varchar(200)` | | e.g. "Home Office Expert" |
| `bio` | `text` | | E-E-A-T biography |
| `avatar_url` | `varchar(500)` | | |
| `credentials` | `jsonb` | DEFAULT '[]' | ["10 years in ergonomics"] |
| `social_links` | `jsonb` | DEFAULT '{}' | |
| `is_active` | `boolean` | DEFAULT true | |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

---

### `products`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `campaign_id` | `uuid` | FK → campaigns.id, NOT NULL | Source campaign |
| `category_id` | `uuid` | FK → categories.id | |
| `affiliate_network` | `affiliate_network` | NOT NULL | |
| `external_id` | `varchar(100)` | NOT NULL | ASIN, SKU, etc. |
| `slug` | `varchar(200)` | UNIQUE, NOT NULL | URL slug |
| `title` | `varchar(500)` | NOT NULL | Product title |
| `description` | `text` | | Short description |
| `specs` | `jsonb` | DEFAULT '{}' | Normalized specs |
| `raw_data` | `jsonb` | NOT NULL | Full API response |
| `price` | `decimal(10,2)` | | Current price |
| `currency` | `varchar(3)` | DEFAULT 'USD' | |
| `affiliate_link` | `varchar(1000)` | NOT NULL | Tracked affiliate URL |
| `image_url` | `varchar(1000)` | | Primary image |
| `duplicate_hash` | `varchar(64)` | UNIQUE | Hash of title+external_id |
| `sync_status` | `product_sync_status` | DEFAULT 'pending' | |
| `is_active` | `boolean` | DEFAULT true | |
| `last_synced_at` | `timestamptz` | | Must refresh within 24h (Amazon) |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

**Indexes:** `slug`, `external_id`, `campaign_id`, `duplicate_hash`, `sync_status`  
**Unique:** `(affiliate_network, external_id)`

---

### `reviews`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `product_id` | `uuid` | FK → products.id, UNIQUE | 1 product = 1 primary review |
| `author_id` | `uuid` | FK → authors.id | Assigned persona |
| `keyword_id` | `uuid` | FK → keywords.id | Target SEO keyword |
| `slug` | `varchar(200)` | UNIQUE, NOT NULL | `/reviews/[slug]` |
| `title` | `varchar(300)` | NOT NULL | H1 / page title |
| `meta_description` | `varchar(320)` | | SEO meta (120–160 ideal) |
| `content` | `text` | NOT NULL | Review body (Markdown) |
| `pros` | `jsonb` | DEFAULT '[]' | Array of strings |
| `cons` | `jsonb` | DEFAULT '[]' | Array of strings |
| `rating` | `decimal(2,1)` | | e.g. 4.3 |
| `status` | `review_status` | DEFAULT 'draft' | Workflow state |
| `canonical_url` | `varchar(500)` | | Prevent duplicate indexing |
| `word_count` | `int` | | Auto-calculated |
| `published_at` | `timestamptz` | | When went live |
| `scheduled_at` | `timestamptz` | | Future publish date |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

**Indexes:** `slug`, `status`, `product_id`, `published_at`

---

### `review_versions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `review_id` | `uuid` | FK → reviews.id, NOT NULL | |
| `version_number` | `int` | NOT NULL | Incremental |
| `content` | `text` | NOT NULL | Snapshot |
| `title` | `varchar(300)` | | |
| `meta_description` | `varchar(320)` | | |
| `pros` | `jsonb` | | |
| `cons` | `jsonb` | | |
| `rating` | `decimal(2,1)` | | |
| `change_reason` | `varchar(200)` | | e.g. "regenerate", "manual edit" |
| `created_by` | `uuid` | | Admin user ref (future) |
| `created_at` | `timestamptz` | DEFAULT now() | |

**Unique:** `(review_id, version_number)`

---

### `content_quality_scores`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `review_id` | `uuid` | FK → reviews.id, NOT NULL | |
| `word_count_score` | `int` | 0–100 | |
| `uniqueness_score` | `int` | 0–100 | vs other reviews |
| `spec_accuracy_score` | `int` | 0–100 | vs product raw data |
| `seo_score` | `int` | 0–100 | meta, headings, keyword |
| `overall_score` | `int` | 0–100 | Weighted average |
| `checklist` | `jsonb` | NOT NULL | Detailed pass/fail items |
| `passed` | `boolean` | NOT NULL | Gate result |
| `evaluated_at` | `timestamptz` | DEFAULT now() | |

**`checklist` example:**
```json
{
  "wordCountMin1500": true,
  "hasProsCons": true,
  "hasDisclosure": true,
  "noProhibitedPhrases": true,
  "metaDescriptionLength": true,
  "ratingWithJustification": true
}
```

---

### `keywords`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `keyword` | `varchar(300)` | UNIQUE, NOT NULL | Target phrase |
| `intent` | `keyword_intent` | DEFAULT 'commercial' | |
| `search_volume` | `int` | | Optional, from research |
| `difficulty` | `keyword_difficulty` | | |
| `created_at` | `timestamptz` | DEFAULT now() | |

---

### `media_assets`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `product_id` | `uuid` | FK → products.id, NOT NULL | |
| `type` | `media_type` | DEFAULT 'image' | |
| `url` | `varchar(1000)` | NOT NULL | |
| `alt_text` | `varchar(300)` | | SEO alt text |
| `sort_order` | `int` | DEFAULT 0 | |
| `created_at` | `timestamptz` | DEFAULT now() | |

---

### `affiliate_clicks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `product_id` | `uuid` | FK → products.id, NOT NULL | |
| `review_id` | `uuid` | FK → reviews.id | |
| `ip_hash` | `varchar(64)` | | Hashed for privacy |
| `user_agent` | `varchar(500)` | | |
| `referrer` | `varchar(500)` | | |
| `clicked_at` | `timestamptz` | DEFAULT now() | |

**Indexes:** `product_id`, `review_id`, `clicked_at`

---

### `job_runs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `job_type` | `job_type` | NOT NULL | |
| `campaign_id` | `uuid` | FK → campaigns.id | Optional |
| `status` | `job_status` | DEFAULT 'pending' | |
| `items_processed` | `int` | DEFAULT 0 | |
| `items_failed` | `int` | DEFAULT 0 | |
| `duration_ms` | `int` | | |
| `error_details` | `jsonb` | | |
| `started_at` | `timestamptz` | | |
| `completed_at` | `timestamptz` | | |

**Indexes:** `job_type`, `status`, `started_at`

---

### `cron_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK | |
| `job_run_id` | `uuid` | FK → job_runs.id, NOT NULL | |
| `level` | `log_level` | DEFAULT 'info' | |
| `message` | `text` | NOT NULL | |
| `metadata` | `jsonb` | | Extra context |
| `created_at` | `timestamptz` | DEFAULT now() | |

**Indexes:** `job_run_id`, `level`, `created_at`

---

## Phase 2: Comparison Pages

### `comparison_pages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `slug` | `varchar(200)` | UNIQUE — `/compare/[slug]` |
| `title` | `varchar(300)` | e.g. "Product A vs Product B for Home Office" |
| `meta_description` | `varchar(320)` | |
| `content` | `text` | Comparison narrative |
| `status` | `review_status` | Same enum as reviews |
| `published_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `comparison_page_products`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `comparison_page_id` | `uuid` | FK |
| `product_id` | `uuid` | FK |
| `sort_order` | `int` | Display order |
| `verdict` | `text` | Per-product summary |

**Unique:** `(comparison_page_id, product_id)`

---

## Drizzle Implementation Notes

```
src/
├── db/
│   ├── index.ts          # Connection pool
│   ├── schema/
│   │   ├── enums.ts
│   │   ├── categories.ts
│   │   ├── campaigns.ts
│   │   ├── authors.ts
│   │   ├── products.ts
│   │   ├── reviews.ts
│   │   ├── review-versions.ts
│   │   ├── content-quality-scores.ts
│   │   ├── keywords.ts
│   │   ├── media-assets.ts
│   │   ├── affiliate-clicks.ts
│   │   ├── job-runs.ts
│   │   └── cron-logs.ts
│   └── migrations/       # drizzle-kit generate
```

**Migration command (when Next.js project exists):**
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

---

## Seed Data (Development)

```sql
-- Sample category
INSERT INTO categories (slug, name, description) VALUES
  ('home-office', 'Home Office', 'Desks, chairs, and workspace gear');

-- Sample author persona
INSERT INTO authors (slug, name, title, bio, credentials) VALUES
  ('sarah-chen', 'Sarah Chen', 'Ergonomics Specialist',
   'Sarah has spent 12 years optimizing home workspaces for remote professionals.',
   '["Certified Ergonomics Assessment Specialist", "12 years remote work experience"]');
```

---

## Connection String

```
DATABASE_URL=postgresql://adisornlam@localhost:5432/postyim
```

Verify connection:
```bash
psql postgresql://localhost:5432/postyim -c "SELECT current_database();"
```
