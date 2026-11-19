-- Execute once before deploying the updated API.
ALTER TABLE directory.businesses ADD COLUMN IF NOT EXISTS maps_url varchar(1000);
