-- Add directory-only ranking; do not change Sin Filas restaurant records.
ALTER TABLE directory.businesses
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
-- Preserve the existing stable order on first migration.
WITH positions AS (
  SELECT id, row_number() OVER (ORDER BY name, id) * 10 AS rank
  FROM directory.businesses WHERE status = 'Published'
)
UPDATE directory.businesses b SET sort_order = p.rank
FROM positions p WHERE b.id = p.id AND b.sort_order = 0;
CREATE INDEX IF NOT EXISTS directory_businesses_status_order_idx
  ON directory.businesses(status, sort_order);
