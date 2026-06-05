CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "search_vector" "tsvector";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "search_vector" "tsvector";--> statement-breakpoint
CREATE OR REPLACE FUNCTION reviews_compute_search_vector(review_row reviews)
RETURNS tsvector
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  product_title text;
  category_name text;
  keyword_text text;
BEGIN
  SELECT p.title, c.name, k.keyword
  INTO product_title, category_name, keyword_text
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN keywords k ON k.id = review_row.keyword_id
  WHERE p.id = review_row.product_id;

  RETURN
    setweight(to_tsvector('english', coalesce(review_row.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(review_row.meta_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(product_title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category_name, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(keyword_text, '')), 'B');
END;
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION reviews_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := reviews_compute_search_vector(NEW);
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS reviews_search_vector_update ON reviews;--> statement-breakpoint
CREATE TRIGGER reviews_search_vector_update
BEFORE INSERT OR UPDATE OF title, meta_description, product_id, keyword_id
ON reviews
FOR EACH ROW
EXECUTE FUNCTION reviews_search_vector_trigger();--> statement-breakpoint
CREATE OR REPLACE FUNCTION products_reviews_search_vector_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE reviews r
  SET search_vector = reviews_compute_search_vector(r)
  WHERE r.product_id = NEW.id;
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS products_search_vector_refresh ON products;--> statement-breakpoint
CREATE TRIGGER products_search_vector_refresh
AFTER UPDATE OF title, category_id ON products
FOR EACH ROW
EXECUTE FUNCTION products_reviews_search_vector_refresh();--> statement-breakpoint
CREATE OR REPLACE FUNCTION categories_compute_search_vector(cat categories)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_tsvector(
    'english',
    coalesce(cat.name, '') || ' ' || coalesce(cat.description, '')
  );
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION categories_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := categories_compute_search_vector(NEW);
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS categories_search_vector_update ON categories;--> statement-breakpoint
CREATE TRIGGER categories_search_vector_update
BEFORE INSERT OR UPDATE OF name, description ON categories
FOR EACH ROW
EXECUTE FUNCTION categories_search_vector_trigger();--> statement-breakpoint
CREATE OR REPLACE FUNCTION categories_reviews_search_vector_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE reviews r
  SET search_vector = reviews_compute_search_vector(r)
  FROM products p
  WHERE p.id = r.product_id
    AND p.category_id = NEW.id;
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS categories_search_vector_refresh ON categories;--> statement-breakpoint
CREATE TRIGGER categories_search_vector_refresh
AFTER UPDATE OF name, description ON categories
FOR EACH ROW
EXECUTE FUNCTION categories_reviews_search_vector_refresh();--> statement-breakpoint
CREATE OR REPLACE FUNCTION keywords_reviews_search_vector_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE reviews r
  SET search_vector = reviews_compute_search_vector(r)
  WHERE r.keyword_id = NEW.id;
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS keywords_search_vector_refresh ON keywords;--> statement-breakpoint
CREATE TRIGGER keywords_search_vector_refresh
AFTER UPDATE OF keyword ON keywords
FOR EACH ROW
EXECUTE FUNCTION keywords_reviews_search_vector_refresh();--> statement-breakpoint
UPDATE reviews r
SET search_vector = reviews_compute_search_vector(r);--> statement-breakpoint
UPDATE categories c
SET search_vector = categories_compute_search_vector(c);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS reviews_published_search_vector_gin_idx
ON reviews USING GIN (search_vector)
WHERE status = 'published';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS categories_search_vector_gin_idx
ON categories USING GIN (search_vector);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS reviews_title_trgm_idx
ON reviews USING GIN (title gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS products_title_trgm_idx
ON products USING GIN (title gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS categories_name_trgm_idx
ON categories USING GIN (name gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS reviews_published_at_idx
ON reviews (published_at DESC)
WHERE status = 'published';
