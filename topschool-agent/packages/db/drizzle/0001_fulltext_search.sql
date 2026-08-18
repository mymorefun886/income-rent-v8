-- Full-text search for schools
-- Add tsvector column + GIN index for name search

ALTER TABLE schools ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION schools_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name_zh, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.name_en, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.address_zh, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.sponsoring_body, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS schools_search_vector_trigger ON schools;
CREATE TRIGGER schools_search_vector_trigger
  BEFORE INSERT OR UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION schools_search_vector_update();

-- Populate existing rows
UPDATE schools SET search_vector =
  setweight(to_tsvector('simple', COALESCE(name_zh, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(name_en, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(address_zh, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(sponsoring_body, '')), 'C');

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS schools_search_idx ON schools USING gin (search_vector);
